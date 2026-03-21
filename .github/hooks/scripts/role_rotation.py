import argparse
import json
import sys

from role_rotation_state import (
    MODE_REQUIRED_ROLES,
    complete_role,
    init_state,
    reset_state,
    status_snapshot,
    waive_role,
)


def print_status(as_json: bool) -> int:
    status = status_snapshot()
    if as_json:
        print(json.dumps(status, ensure_ascii=False, indent=2))
        return 0

    print(f"workflowInitialized: {status['workflowInitialized']}")
    print(f"mode: {status['mode']}")
    print(f"activeChange: {status['activeChange'] or '-'}")
    print(f"requiredRoles: {', '.join(status['requiredRoles']) or '-'}")
    print(f"completedRoles: {', '.join(status['completedRoles']) or '-'}")
    waived = ", ".join(
        f"{role} ({details['reason']})" for role, details in status['waivedRoles'].items()
    )
    print(f"waivedRoles: {waived or '-'}")
    print(f"missing.edit: {', '.join(status['missing']['edit']) or '-'}")
    print(f"missing.commit: {', '.join(status['missing']['commit']) or '-'}")
    print(f"missing.release: {', '.join(status['missing']['release']) or '-'}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage repository-enforced multi-agent role rotation state.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    init_parser = subparsers.add_parser("init", help="Initialize workflow mode and required roles.")
    init_parser.add_argument("--mode", required=True, choices=sorted(MODE_REQUIRED_ROLES.keys()))
    init_parser.add_argument("--change", default="", help="Active OpenSpec change name for this session.")
    init_parser.add_argument("--summary", default="", help="Short summary of the current slice.")
    complete_parser = subparsers.add_parser("complete", help="Mark a role as completed for this session.")
    complete_parser.add_argument("--role", required=True)
    complete_parser.add_argument("--note", default="", help="Short note about what the role contributed.")

    waive_parser = subparsers.add_parser("waive", help="Waive a role with an explicit reason.")
    waive_parser.add_argument("--role", required=True)
    waive_parser.add_argument("--reason", required=True)

    status_parser = subparsers.add_parser("status", help="Print current workflow state.")
    status_parser.add_argument("--json", action="store_true")

    subparsers.add_parser("reset", help="Reset workflow state for the next session.")

    args = parser.parse_args()

    try:
        if args.command == "init":
            state = init_state(args.mode, args.change, args.summary)
            print(json.dumps(status_snapshot(state), ensure_ascii=False, indent=2))
            return 0
        if args.command == "complete":
            state = complete_role(args.role, args.note)
            print(json.dumps(status_snapshot(state), ensure_ascii=False, indent=2))
            return 0
        if args.command == "waive":
            state = waive_role(args.role, args.reason)
            print(json.dumps(status_snapshot(state), ensure_ascii=False, indent=2))
            return 0
        if args.command == "status":
            return print_status(args.json)
        if args.command == "reset":
            state = reset_state()
            print(json.dumps(status_snapshot(state), ensure_ascii=False, indent=2))
            return 0
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2

    return 1


if __name__ == "__main__":
    raise SystemExit(main())