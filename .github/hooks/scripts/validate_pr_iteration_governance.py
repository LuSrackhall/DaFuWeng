import json
import os
import sys
from pathlib import Path
from typing import Optional


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/pr-iteration-governance.json"
PLACEHOLDER_PREFIXES = (
    "- OpenSpec change:",
    "- 本轮最小交付:",
    "- 影响范围:",
    "- 已运行验证:",
    "- 关键测试或日志:",
    "- 仍未运行项:",
    "- 当前已知风险:",
    "- 边界与限制:",
    "- 建议 1:",
    "- 建议 2:",
    "- 建议 3:",
)


def is_placeholder_line(line: str) -> bool:
    normalized = line.strip()
    for prefix in PLACEHOLDER_PREFIXES:
        if normalized == prefix:
            return True
    return False


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
      raise FileNotFoundError(f"Missing PR governance policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    sections = policy.get("requiredSections")
    if not isinstance(sections, list) or not sections:
        raise ValueError("PR governance policy must define requiredSections.")

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


def extract_section_body(body: str, heading: str, all_headings: list[str]) -> Optional[str]:
    start = body.find(heading)
    if start < 0:
        return None

    start += len(heading)
    remaining = body[start:]
    next_indices = [remaining.find(other) for other in all_headings if other != heading and remaining.find(other) >= 0]
    end = min(next_indices) if next_indices else len(remaining)
    return remaining[:end].strip()


def has_meaningful_content(section_body: str) -> bool:
    for line in section_body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("<!--"):
            continue
        if is_placeholder_line(stripped):
            continue
        return True
    return False


def validate_pr_body(body: str, policy: dict) -> list[str]:
    failures: list[str] = []
    sections = policy["requiredSections"]
    headings = [section["heading"] for section in sections]

    for section in sections:
        heading = section["heading"]
        section_body = extract_section_body(body, heading, headings)
        if section_body is None:
            failures.append(f"Missing required PR section: {heading}")
            continue
        if not has_meaningful_content(section_body):
            failures.append(f"Section is empty or still placeholder-only: {heading}")

    return failures


def main() -> int:
    event_name = os.environ.get("GITHUB_EVENT_NAME", "")
    if not event_name.startswith("pull_request"):
        print("PR governance validation skipped outside pull_request events.")
        return 0

    policy = load_policy()
    payload = load_event_payload()
    pull_request = payload.get("pull_request") if isinstance(payload, dict) else None
    body = pull_request.get("body") if isinstance(pull_request, dict) else None

    if not isinstance(body, str) or not body.strip():
        print("Pull request body is empty or missing.", file=sys.stderr)
        return 1

    failures = validate_pr_body(body, policy)
    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        return 1

    print("Validated PR iteration governance sections:")
    for section in policy["requiredSections"]:
        print(f" - {section['heading']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())