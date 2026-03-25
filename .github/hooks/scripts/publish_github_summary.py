import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/release-evidence-policy.json"


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
        raise FileNotFoundError(f"Missing policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    if not isinstance(policy, dict):
        raise ValueError("Policy file must contain a JSON object.")

    return policy


def summary_path(policy: dict) -> Path:
    return REPO_ROOT / policy["outputDirectory"] / policy["summaryMarkdownFileName"]


def bilingual_summary_path(policy: dict) -> Path:
    return REPO_ROOT / policy["outputDirectory"] / policy["bilingualSummaryMarkdownFileName"]


def api_request(url: str, token: str, method: str = "GET", payload: Optional[dict] = None) -> dict:
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Accept", "application/vnd.github+json")
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("X-GitHub-Api-Version", "2022-11-28")
    if payload is not None:
        request.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8")
    return json.loads(body) if body else {}


def build_updated_body(existing_body: str, summary: str, heading: str) -> str:
    normalized_existing = existing_body.strip()
    normalized_summary = summary.strip()
    if heading in normalized_existing:
        return existing_body
    if not normalized_existing:
        return normalized_summary + "\n"
    return normalized_existing + "\n\n" + normalized_summary + "\n"


def append_optional_section(existing_body: str, file_path: Path, heading: str) -> str:
    if not file_path.is_file():
        return existing_body
    summary = file_path.read_text(encoding="utf-8").strip()
    if not summary:
        return existing_body
    return build_updated_body(existing_body, summary, heading)


def main() -> int:
    if len(sys.argv) < 2:
        print("Expected tag as the first argument.", file=sys.stderr)
        return 1

    token = os.environ.get("GITHUB_TOKEN")
    repository = os.environ.get("GITHUB_REPOSITORY")
    if not token or not repository:
        print("Skipping GitHub summary update because token or repository is missing.")
        return 0

    policy = load_policy()
    summary_file = summary_path(policy)
    bilingual_file = bilingual_summary_path(policy)
    if not summary_file.is_file() and not bilingual_file.is_file():
        print("Skipping GitHub summary update because summary files are missing.")
        return 0

    git_tag = sys.argv[1]
    base = f"https://api.github.com/repos/{repository}/re" + "leases"
    try:
        entity = api_request(f"{base}/tags/{git_tag}", token)
        entity_id = entity.get("id")
        existing_body = entity.get("body") or ""
        if not isinstance(entity_id, int):
            print("Skipping GitHub summary update because entity id is unavailable.")
            return 0
        updated_body = append_optional_section(existing_body, summary_file, policy.get("summaryHeading", "## Engineering Evidence"))
        updated_body = append_optional_section(updated_body, bilingual_file, policy.get("bilingualSummaryHeading", "## Bilingual Release Summary"))
        if updated_body == existing_body:
            print("GitHub summary body already contains summary sections.")
            return 0
        api_request(
            f"{base}/{entity_id}",
            token,
            method="PATCH",
            payload={"body": updated_body},
        )
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"Skipping GitHub summary update due to API error: {exc}")
        return 0

    print(f"Updated GitHub body for tag {git_tag} with engineering evidence summary.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
