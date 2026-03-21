import json
import re
import sys
from typing import Any, Iterable, Optional

from role_rotation_state import load_state, missing_roles


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

ROLE_ROTATION_BYPASS_PATTERNS = [
    ".github/hooks/scripts/role_rotation.py init",
    ".github/hooks/scripts/role_rotation.py complete",
    ".github/hooks/scripts/role_rotation.py waive",
    ".github/hooks/scripts/role_rotation.py status",
    ".github/hooks/scripts/role_rotation.py reset",
]

EDIT_MARKERS = [
    "*** begin patch",
    "*** update file:",
    "*** add file:",
    "*** delete file:",
    "apply_patch",
    "create_file",
    "vscode_renamesymbol",
]

TERMINAL_EDIT_PATTERNS = [
    r"(^|&&\s*)sed\s+-i\b",
    r"(^|&&\s*)perl\s+-pi\b",
    r"(^|&&\s*)perl\s+-0pi\b",
    r"(^|&&\s*)python3\s+-c\b",
    r"(^|&&\s*)python3\s+-\s*<<",
    r"(^|&&\s*)node\s+-e\b",
    r"(^|&&\s*)tee\b",
    r"(^|&&\s*)touch\b",
    r"(^|&&\s*)mkdir\b",
    r"(^|&&\s*)mv\b",
    r"(^|&&\s*)cp\b",
    r">>",
    r"(^|[^>])>([^>]|$)",
]

RELEASE_PATTERNS = [
    r"\bsemantic" + r"-release\b",
    r"\bpnpm re" + r"lease\b",
    r"\bnpm run re" + r"lease\b",
    r"\byarn re" + r"lease\b",
    r"\bgh re" + r"lease cr" + r"eate\b",
    r"\bgit ta" + r"g\b",
]

COMMIT_PATTERNS = [
    r"\bgit com" + r"mit\b",
    r"\bgit pu" + r"sh\b",
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


def detect_checkpoint(lowered: str) -> Optional[str]:
    if any(marker in lowered for marker in EDIT_MARKERS):
        return "edit"

    if any(re.search(pattern, lowered) for pattern in TERMINAL_EDIT_PATTERNS):
        return "edit"

    if any(re.search(pattern, lowered) for pattern in RELEASE_PATTERNS):
        return "release"

    if any(re.search(pattern, lowered) for pattern in COMMIT_PATTERNS):
        return "commit"

    return None


def workflow_gate_message(checkpoint: str, state: dict[str, Any], missing: list[str]) -> str:
    active_change = state.get("activeChange") or "<active-change>"
    missing_text = ", ".join(missing)
    return (
        f"Multi-agent workflow gate blocked the {checkpoint} action. Missing roles: {missing_text}. "
        f"Initialize or update workflow state with `python3 .github/hooks/scripts/role_rotation.py init --mode <planning|implementation|release> --change {active_change}` and then record each missing role with `complete` or `waive` before retrying."
    )


def is_role_rotation_command(payload: dict[str, Any]) -> bool:
    command = payload.get("command")
    if not isinstance(command, str):
        return False

    lowered_command = command.strip().lower()
    return bool(
        re.match(
            r"^(cd\s+.+\s+&&\s+)?python3\s+\.github/hooks/scripts/role_rotation\.py\s+(init|complete|waive|status|reset)\b[^;&|]*$",
            lowered_command,
        )
    )


def main() -> None:
    payload = load_payload()
    flattened = "\n".join(iter_strings(payload))
    lowered = flattened.lower()

    if is_role_rotation_command(payload):
        allow()
        return

    checkpoint = detect_checkpoint(lowered)
    if checkpoint is not None:
        state = load_state()
        if not state.get("workflowInitialized"):
            deny(
                "Multi-agent workflow state is not initialized. Run `python3 .github/hooks/scripts/role_rotation.py init --mode <planning|implementation|release> --change <active-change>` before editing, committing, pushing, or release-like actions."
            )
            return

        if state.get("mode") == "analysis":
            deny(
                "Workflow mode `analysis` is read-only. Re-initialize with `planning`, `implementation`, or `release` before attempting edits, commits, pushes, or release-like actions."
            )
            return

        if not state.get("activeChange"):
            deny(
                "Substantial work requires an active OpenSpec change in workflow state. Re-run `python3 .github/hooks/scripts/role_rotation.py init --mode <planning|implementation|release> --change <active-change>` before continuing."
            )
            return

        missing = missing_roles(state, checkpoint)
        if missing:
            deny(workflow_gate_message(checkpoint, state, missing))
            return

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
