import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/branch-protection-required-checks.json"


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
        raise FileNotFoundError(f"Missing branch protection policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    if not isinstance(policy, dict):
        raise ValueError("Branch protection policy must contain a JSON object.")

    required_checks = policy.get("requiredPullRequestChecks")
    main_push_checks = policy.get("mainPushOnlyChecks")
    if not isinstance(required_checks, list) or not required_checks:
        raise ValueError("Branch protection policy must define requiredPullRequestChecks.")
    if not isinstance(main_push_checks, list):
        raise ValueError("Branch protection policy must define mainPushOnlyChecks.")

    return policy


def extract_job_ids(ci_content: str) -> list[str]:
    return re.findall(r"^  ([a-z0-9-]+):\s*$", ci_content, re.MULTILINE)


def validate_contract(repo_root: Path) -> list[str]:
    policy = load_policy()
    workflow_path = repo_root / policy["workflowPath"]
    if not workflow_path.is_file():
        return [f"Missing workflow file declared by branch protection policy: {policy['workflowPath']}"]

    workflow_content = workflow_path.read_text(encoding="utf-8")
    job_ids = set(extract_job_ids(workflow_content))
    failures: list[str] = []

    for check_name in policy["requiredPullRequestChecks"]:
        if check_name not in job_ids:
            failures.append(f"Required PR check missing from workflow jobs: {check_name}")

    for check_name in policy["mainPushOnlyChecks"]:
        if check_name not in job_ids:
            failures.append(f"Main-push-only check missing from workflow jobs: {check_name}")

    overlap = set(policy["requiredPullRequestChecks"]) & set(policy["mainPushOnlyChecks"])
    if overlap:
        failures.append(f"Checks cannot be both PR-required and main-push-only: {', '.join(sorted(overlap))}")

    return failures


def main() -> int:
    try:
        failures = validate_contract(REPO_ROOT)
    except Exception as exc:  # pragma: no cover - CLI error path
        print(str(exc), file=sys.stderr)
        return 1

    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        return 1

    policy = load_policy()
    print("Validated branch protection contract checks:")
    for check_name in policy["requiredPullRequestChecks"]:
        print(f" - PR required: {check_name}")
    for check_name in policy["mainPushOnlyChecks"]:
        print(f" - main push only: {check_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())