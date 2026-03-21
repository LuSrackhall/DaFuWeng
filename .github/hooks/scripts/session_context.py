import json


def main() -> None:
    message = (
        "Project defaults: use OpenSpec for substantial work; keep gameplay server authoritative; "
        "prefer CI for build and release; conventional commits are required for automated versioning."
    )
    print(json.dumps({"systemMessage": message}, ensure_ascii=True))


if __name__ == "__main__":
    main()
