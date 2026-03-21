import json
import re
import sys
from typing import Any, Iterable


CONVENTIONAL_COMMIT_RE = re.compile(
    r"^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: .+"
)
CHINESE_TEXT_RE = re.compile(r"[\u4e00-\u9fff]")

BANNED_COMMAND_PATTERNS = [
    "git reset --hard",
    "git checkout --",
    "git clean -fd",
    "git clean -xdf",
    "git push --force",
    "git push -f",
    "git tag ",
    "gh release create",
    "rm -rf /",
    "sudo rm -rf",
]

CI_FIRST_PATTERNS = [
    "npm run build",
    "pnpm build",
    "yarn build",
    "go build",
    "cargo build",
    "tauri build",
    "xcodebuild",
    "gradlew assemble",
]


def iter_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
        return

    if isinstance(value, dict):
        for key, nested in value.items():
            yield str(key)
            yield from iter_strings(nested)
        return

    if isinstance(value, list):
        for nested in value:
            yield from iter_strings(nested)
        return

    if value is not None:
        yield str(value)


def load_payload() -> dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw}

    return payload if isinstance(payload, dict) else {"payload": payload}


def ask(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": reason,
                }
            },
            ensure_ascii=True,
        )
    )


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            },
            ensure_ascii=True,
        )
    )


def allow() -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "allow",
                    "permissionDecisionReason": "Command passed workspace policy checks.",
                }
            },
            ensure_ascii=True,
        )
    )


def main() -> None:
    payload = load_payload()
    flattened = "\n".join(iter_strings(payload))
    lowered = flattened.lower()

    if any(pattern in lowered for pattern in BANNED_COMMAND_PATTERNS):
        deny(
            "Blocked by workspace policy: destructive git or manual release command detected."
        )
        return

    if "git commit" in lowered:
        match = re.search(
            r"git commit(?:\s+-[amS]+)*\s+-m\s+[\"']([^\"']+)[\"']", flattened
        )
        if match:
            message = match.group(1).strip()
            if not CONVENTIONAL_COMMIT_RE.match(message):
                ask("Commit message is not in conventional commit format.")
                return
            subject = message.split(":", 1)[1].strip() if ":" in message else message
            if not CHINESE_TEXT_RE.search(subject):
                ask("Prefer a Chinese subject in the conventional commit message for this repository.")
                return
        else:
            ask(
                "Interactive or message-less git commit detected. Use a conventional commit message."
            )
            return

    if any(pattern in lowered for pattern in CI_FIRST_PATTERNS):
        ask(
            "Local build detected. CI is the preferred build and release path for this repository."
        )
        return

    allow()


if __name__ == "__main__":
    main()
