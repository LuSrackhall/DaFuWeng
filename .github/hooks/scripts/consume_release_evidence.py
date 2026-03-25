import io
import json
import os
import urllib.error
import urllib.request
import zipfile
from pathlib import Path
from typing import Any, Optional


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


def api_request(url: str, token: str, accept: str = "application/vnd.github+json") -> bytes:
    request = urllib.request.Request(url)
    request.add_header("Accept", accept)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def fetch_artifact_bytes(repo_full_name: str, run_id: int, artifact_name: str, token: str) -> Optional[bytes]:
    list_url = f"https://api.github.com/repos/{repo_full_name}/actions/runs/{run_id}/artifacts"
    try:
        payload = json.loads(api_request(list_url, token).decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None

    artifacts = payload.get("artifacts") if isinstance(payload, dict) else None
    if not isinstance(artifacts, list):
        return None

    artifact = next((item for item in artifacts if isinstance(item, dict) and item.get("name") == artifact_name), None)
    if not isinstance(artifact, dict):
        return None

    download_url = artifact.get("archive_download_url")
    if not isinstance(download_url, str) or not download_url:
        return None

    try:
        return api_request(download_url, token, accept="application/vnd.github+json")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return None


def extract_artifact_bytes(archive_bytes: bytes, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
        archive.extractall(output_dir)


def load_evidence(output_dir: Path, policy: dict) -> Optional[dict[str, Any]]:
    json_path = output_dir / policy["jsonFileName"]
    if not json_path.is_file():
        return None

    with json_path.open("r", encoding="utf-8") as handle:
        evidence = json.load(handle)

    if not isinstance(evidence, dict):
        return None

    for key in policy.get("requiredTopLevelFields", []):
        if key not in evidence:
            return None

    return evidence


def render_summary(evidence: Optional[dict[str, Any]], policy: dict, fallback_reason: Optional[str] = None) -> str:
    heading = policy.get("summaryHeading", "## Engineering Evidence")
    if evidence is None:
        return "\n".join([heading, "", f"- Evidence unavailable: {fallback_reason or 'unknown reason'}", ""])

    lines = [heading, "", "### Completed Slice"]
    lines.extend([f"- {item}" for item in evidence.get("completedSlice", [])] or ["- Unavailable"])
    lines.extend(["", "### Quality Evidence"])
    lines.extend([f"- {item}" for item in evidence.get("qualityEvidence", [])] or ["- Unavailable"])
    lines.extend(["", "### Remaining Risks"])
    lines.extend([f"- {item}" for item in evidence.get("remainingRisks", [])] or ["- Unavailable"])
    next_steps = evidence.get("nextStepRecommendations", [])
    if next_steps:
        lines.extend(["", "### Next Step Recommendations"])
        lines.extend([f"- {item}" for item in next_steps])
    warnings = evidence.get("warnings", [])
    if warnings:
        lines.extend(["", "### Warnings"])
        lines.extend([f"- {item}" for item in warnings])
    lines.append("")
    return "\n".join(lines)


def write_summary(output_dir: Path, policy: dict, summary: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    summary_path = output_dir / policy["summaryMarkdownFileName"]
    summary_path.write_text(summary, encoding="utf-8")
    return summary_path


def main() -> int:
    event_name = os.environ.get("GITHUB_EVENT_NAME", "")
    if event_name != "workflow_run":
        print("Release evidence consumption skipped outside workflow_run events.")
        return 0

    policy = load_policy()
    payload = load_event_payload()
    workflow_run = payload.get("workflow_run") if isinstance(payload, dict) else None
    repo = payload.get("repository") if isinstance(payload, dict) else None
    token = os.environ.get("GITHUB_TOKEN", "")
    output_dir = REPO_ROOT / policy["outputDirectory"]

    evidence: Optional[dict[str, Any]] = None
    fallback_reason: Optional[str] = None

    try:
        run_id = workflow_run.get("id") if isinstance(workflow_run, dict) else None
        repo_full_name = repo.get("full_name") if isinstance(repo, dict) else os.environ.get("GITHUB_REPOSITORY", "")
        if not isinstance(run_id, int) or not repo_full_name or not token:
            fallback_reason = "missing workflow_run context or token"
        else:
            archive_bytes = fetch_artifact_bytes(repo_full_name, run_id, policy["artifactName"], token)
            if archive_bytes is None:
                fallback_reason = "artifact download unavailable"
            else:
                extract_artifact_bytes(archive_bytes, output_dir)
                evidence = load_evidence(output_dir, policy)
                if evidence is None:
                    fallback_reason = "artifact payload missing or invalid"
    except Exception as exc:  # pragma: no cover - CLI error path
        fallback_reason = str(exc)

    summary = render_summary(evidence, policy, fallback_reason)
    summary_path = write_summary(output_dir, policy, summary)
    print(f"Prepared release evidence summary: {summary_path}")
    if fallback_reason:
        print(f"Summary fallback reason: {fallback_reason}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())