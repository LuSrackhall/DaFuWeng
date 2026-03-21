import json

from role_rotation_state import reset_state


def main() -> None:
    reset_state()
    message = (
        "Project defaults: use OpenSpec for substantial work; keep gameplay server authoritative; "
        "prefer CI for build and release; conventional commits are required for automated versioning; "
        "start every conversation by checking git status; proactively decide whether completed agent-owned work should be committed and pushed; "
        "prefer conventional commit messages with Chinese subjects; and report round progress with a role-by-role summary of every AI agent or subagent used. "
        "This repository now enforces multi-agent role rotation for substantial work. Before any repository edit, commit, push, or release-like action, initialize workflow state with `python3 .github/hooks/scripts/role_rotation.py init --mode <planning|implementation|release> --change <active-change>` and then record each required role using `complete` or `waive`. Use `python3 .github/hooks/scripts/role_rotation.py status --json` to inspect missing gates."
    )
    print(json.dumps({"systemMessage": message}, ensure_ascii=True))


if __name__ == "__main__":
    main()
