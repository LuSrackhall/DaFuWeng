import json


def main() -> None:
    message = (
        "Project defaults: use OpenSpec for substantial work; keep gameplay server authoritative; "
        "prefer CI for build and release; conventional commits are required for automated versioning; "
        "start every conversation by checking git status; proactively decide whether completed agent-owned work should be committed and pushed; "
        "prefer conventional commit messages with Chinese subjects; and report round progress with a role-by-role summary of every AI agent or subagent used."
    )
    print(json.dumps({"systemMessage": message}, ensure_ascii=True))


if __name__ == "__main__":
    main()
