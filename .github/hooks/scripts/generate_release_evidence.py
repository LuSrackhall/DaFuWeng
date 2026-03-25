import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

import validate_pr_iteration_governance


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/release-evidence-policy.json"


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
        raise FileNotFoundError(f"Missing release evidence policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    if not isinstance(policy, dict):
        raise ValueError("Release evidence policy must contain a JSON object.")

    return policy


def load_event_payload() -> dict:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        return {}

    path = Path(event_path)
    if not path.is_file():
        return {}

    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    return payload if isinstance(payload, dict) else {}


def should_generate(event_name: str, ref: str) -> bool:
    return event_name == "push" and ref == "refs/heads/main"


def fetch_associated_pull_request(repo_full_name: str, commit_sha: str, token: Optional[str]) -> Optional[dict[str, Any]]:
    if not token or not repo_full_name or not commit_sha:
        return None

    url = f"https://api.github.com/repos/{repo_full_name}/commits/{commit_sha}/pulls"
    request = urllib.request.Request(url)
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return None

    if not isinstance(payload, list) or not payload:
        return None

    for pull_request in payload:
        if isinstance(pull_request, dict) and pull_request.get("merged_at"):
            return pull_request

    first = payload[0]
    return first if isinstance(first, dict) else None


def extract_governance_sections(body: str) -> dict[str, str]:
    governance_policy = validate_pr_iteration_governance.load_policy()
    headings = [section["heading"] for section in governance_policy["requiredSections"]]
    extracted: dict[str, str] = {}
    for section in governance_policy["requiredSections"]:
        heading = section["heading"]
        extracted[heading] = validate_pr_iteration_governance.extract_section_body(body, heading, headings) or ""
    return extracted


def normalize_bullets(section_body: str) -> list[str]:
    values: list[str] = []
    for line in section_body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("<!--"):
            continue
        if stripped.startswith("- "):
            values.append(stripped[2:].strip())
        else:
            values.append(stripped)
    return values


def build_evidence(payload: dict, associated_pr: Optional[dict[str, Any]]) -> dict[str, Any]:
    commit_sha = payload.get("after") or os.environ.get("GITHUB_SHA") or ""
    head_commit = payload.get("head_commit") if isinstance(payload, dict) else None
    head_commit_message = head_commit.get("message") if isinstance(head_commit, dict) else ""
    repo = payload.get("repository") if isinstance(payload, dict) else None
    repo_full_name = repo.get("full_name") if isinstance(repo, dict) else ""

    warnings: list[str] = []
    if associated_pr and isinstance(associated_pr.get("body"), str):
        sections = extract_governance_sections(associated_pr["body"])
        source_kind = "pull-request"
    else:
        sections = {
            "## 本轮完成切片": head_commit_message or "Unavailable: no associated pull request body found.",
            "## 质量证据": "Unavailable: no associated pull request body found.",
            "## 剩余风险": "Unavailable: no associated pull request body found.",
            "## 下一步建议": "Unavailable: no associated pull request body found.",
        }
        source_kind = "commit-fallback"
        warnings.append("No associated pull request body was available; release evidence used commit fallback content.")

    return {
        "sourceKind": source_kind,
        "workflowName": "ci",
        "commitSha": commit_sha,
        "repository": repo_full_name,
        "pullRequest": {
            "number": associated_pr.get("number") if isinstance(associated_pr, dict) else None,
            "title": associated_pr.get("title") if isinstance(associated_pr, dict) else None,
            "url": associated_pr.get("html_url") if isinstance(associated_pr, dict) else None,
        },
        "completedSlice": normalize_bullets(sections.get("## 本轮完成切片", "")),
        "qualityEvidence": normalize_bullets(sections.get("## 质量证据", "")),
        "remainingRisks": normalize_bullets(sections.get("## 剩余风险", "")),
        "nextStepRecommendations": normalize_bullets(sections.get("## 下一步建议", "")),
        "warnings": warnings,
    }


def render_markdown(evidence: dict[str, Any]) -> str:
    pr = evidence.get("pullRequest", {})
    lines = [
        "# Release Evidence",
        "",
        f"- Source kind: {evidence.get('sourceKind', 'unknown')}",
        f"- Workflow: {evidence.get('workflowName', 'unknown')}",
        f"- Commit: {evidence.get('commitSha', '')}",
        f"- Pull request: #{pr.get('number') or 'n/a'} {pr.get('title') or ''}".rstrip(),
        "",
        "## Completed Slice",
    ]
    lines.extend([f"- {item}" for item in evidence.get("completedSlice", [])] or ["- Unavailable"]) 
    lines.append("")
    lines.append("## Quality Evidence")
    lines.extend([f"- {item}" for item in evidence.get("qualityEvidence", [])] or ["- Unavailable"])
    lines.append("")
    lines.append("## Remaining Risks")
    lines.extend([f"- {item}" for item in evidence.get("remainingRisks", [])] or ["- Unavailable"])
    lines.append("")
    lines.append("## Next Step Recommendations")
    lines.extend([f"- {item}" for item in evidence.get("nextStepRecommendations", [])] or ["- Unavailable"])
    if evidence.get("warnings"):
        lines.append("")
        lines.append("## Warnings")
        lines.extend([f"- {warning}" for warning in evidence["warnings"]])
    lines.append("")
    return "\n".join(lines)


def write_outputs(policy: dict, evidence: dict[str, Any]) -> tuple[Path, Path]:
    output_dir = REPO_ROOT / policy["outputDirectory"]
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / policy["jsonFileName"]
    markdown_path = output_dir / policy["markdownFileName"]
    json_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    markdown_path.write_text(render_markdown(evidence), encoding="utf-8")
    return json_path, markdown_path


def main() -> int:
    event_name = os.environ.get("GITHUB_EVENT_NAME", "")
    ref = os.environ.get("GITHUB_REF", "")
    if not should_generate(event_name, ref):
        print("Release evidence generation skipped outside push-to-main events.")
        return 0

    try:
        policy = load_policy()
        payload = load_event_payload()
        repo = payload.get("repository") if isinstance(payload, dict) else None
        repo_full_name = repo.get("full_name") if isinstance(repo, dict) else ""
        commit_sha = payload.get("after") or os.environ.get("GITHUB_SHA") or ""
        associated_pr = fetch_associated_pull_request(repo_full_name, commit_sha, os.environ.get("GITHUB_TOKEN"))
        evidence = build_evidence(payload, associated_pr)
        json_path, markdown_path = write_outputs(policy, evidence)
    except Exception as exc:  # pragma: no cover - CLI error path
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Generated release evidence JSON: {json_path}")
    print(f"Generated release evidence Markdown: {markdown_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())