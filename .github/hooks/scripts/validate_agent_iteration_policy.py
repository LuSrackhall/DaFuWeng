import json
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/agent-iteration-policy.json"


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
        raise FileNotFoundError(f"Missing policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    if not isinstance(policy, dict):
        raise ValueError("Policy file must contain a JSON object.")

    canonical = policy.get("canonicalPrinciples")
    if not isinstance(canonical, list) or len(canonical) != 2 or not all(isinstance(item, str) and item.strip() for item in canonical):
        raise ValueError("Policy file must define exactly two non-empty canonicalPrinciples.")

    snippets = policy.get("requiredSnippets")
    if not isinstance(snippets, dict) or not snippets:
        raise ValueError("Policy file must define requiredSnippets for target files.")

    return policy


def validate_policy(repo_root: Path) -> list[str]:
    policy = load_policy()
    failures: list[str] = []

    for relative_path, snippets in policy["requiredSnippets"].items():
        target_path = repo_root / relative_path
        if not target_path.is_file():
            failures.append(f"Missing required target file: {relative_path}")
            continue

        content = target_path.read_text(encoding="utf-8")
        if not isinstance(snippets, list) or not snippets:
            failures.append(f"Policy entry for {relative_path} must define at least one required snippet.")
            continue

        for snippet in snippets:
            if snippet not in content:
                failures.append(f"Missing required snippet in {relative_path}: {snippet}")

    return failures


def main() -> int:
    try:
        failures = validate_policy(REPO_ROOT)
    except Exception as exc:  # pragma: no cover - CLI error path
        print(str(exc), file=sys.stderr)
        return 1

    if failures:
        for failure in failures:
            print(failure, file=sys.stderr)
        return 1

    print("Validated agent iteration policy targets:")
    for relative_path in load_policy()["requiredSnippets"].keys():
        print(f" - {relative_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())