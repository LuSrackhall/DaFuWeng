import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


ALL_ROLES = [
    "GitHub Copilot Workflow Expert",
    "Monopoly Product Manager",
    "Monopoly UI UX Director",
    "Monopoly Rules Expert",
    "Monopoly Tech Lead",
    "Monopoly Pixi Scene Engineer",
    "Monopoly Senior Implementer",
    "Monopoly QA Lead",
    "Monopoly Simulated Player",
    "Monopoly Versioning Manager",
    "Monopoly Release Marketer",
]

MODE_REQUIRED_ROLES = {
    "analysis": [],
    "planning": [
        "GitHub Copilot Workflow Expert",
        "Monopoly Product Manager",
        "Monopoly UI UX Director",
        "Monopoly Rules Expert",
        "Monopoly Tech Lead",
    ],
    "implementation": [
        "GitHub Copilot Workflow Expert",
        "Monopoly Product Manager",
        "Monopoly UI UX Director",
        "Monopoly Rules Expert",
        "Monopoly Tech Lead",
        "Monopoly Senior Implementer",
        "Monopoly QA Lead",
        "Monopoly Simulated Player",
        "Monopoly Versioning Manager",
    ],
    "release": [
        "GitHub Copilot Workflow Expert",
        "Monopoly Product Manager",
        "Monopoly UI UX Director",
        "Monopoly Rules Expert",
        "Monopoly Tech Lead",
        "Monopoly Senior Implementer",
        "Monopoly QA Lead",
        "Monopoly Simulated Player",
        "Monopoly Versioning Manager",
        "Monopoly Release Marketer",
    ],
}

EDIT_DEFERRED_ROLES = {
    "Monopoly QA Lead",
    "Monopoly Simulated Player",
    "Monopoly Versioning Manager",
    "Monopoly Release Marketer",
}
COMMIT_DEFERRED_ROLES = {
    "Monopoly Release Marketer",
}

STATE_VERSION = 2
STATE_DIR = Path(__file__).resolve().parents[1] / "runtime"
STATE_PATH = STATE_DIR / "role-rotation-state.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_runtime_dir() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)


def default_state() -> dict[str, Any]:
    return {
        "version": STATE_VERSION,
        "workflowInitialized": False,
        "mode": "uninitialized",
        "activeChange": "",
        "summary": "",
        "requiredRoles": [],
        "completedRoles": [],
        "waivedRoles": {},
        "history": [],
        "updatedAt": utc_now(),
    }


def load_state() -> dict[str, Any]:
    ensure_runtime_dir()
    if not STATE_PATH.exists():
        return default_state()

    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default_state()

    if not isinstance(state, dict):
        return default_state()

    merged = default_state()
    merged.update(state)

    mode = merged.get("mode")
    if merged.get("workflowInitialized") and isinstance(mode, str) and mode in MODE_REQUIRED_ROLES:
        merged["requiredRoles"] = dedupe_roles(MODE_REQUIRED_ROLES[mode] + list(merged.get("requiredRoles", [])))
    else:
        merged["requiredRoles"] = dedupe_roles(list(merged.get("requiredRoles", [])))

    merged["completedRoles"] = dedupe_roles(list(merged.get("completedRoles", [])))
    merged["version"] = STATE_VERSION
    return merged


def write_state(state: dict[str, Any]) -> dict[str, Any]:
    ensure_runtime_dir()
    state = deepcopy(state)
    state["updatedAt"] = utc_now()
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    return state


def append_history(state: dict[str, Any], kind: str, **details: Any) -> None:
    history = state.setdefault("history", [])
    history.append({"timestamp": utc_now(), "kind": kind, **details})


def normalize_role(role: str) -> str:
    normalized = role.strip()
    for candidate in ALL_ROLES:
        if candidate.lower() == normalized.lower():
            return candidate
    raise ValueError(f"Unknown role: {role}")


def dedupe_roles(roles: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for role in roles:
        if role not in seen:
            seen.add(role)
            ordered.append(role)
    return ordered


def validate_mode(mode: str) -> str:
    normalized = mode.strip().lower()
    if normalized not in MODE_REQUIRED_ROLES:
        raise ValueError(f"Unknown workflow mode: {mode}")
    return normalized


def init_state(mode: str, active_change: str, summary: str = "") -> dict[str, Any]:
    normalized_mode = validate_mode(mode)
    roles = MODE_REQUIRED_ROLES[normalized_mode]
    canonical_roles = dedupe_roles([normalize_role(role) for role in roles])
    state = default_state()
    state.update(
        {
            "workflowInitialized": True,
            "mode": normalized_mode,
            "activeChange": active_change.strip(),
            "summary": summary.strip(),
            "requiredRoles": canonical_roles,
        }
    )
    append_history(
        state,
        "init",
        mode=normalized_mode,
        activeChange=state["activeChange"],
        requiredRoles=canonical_roles,
        summary=state["summary"],
    )
    return write_state(state)


def reset_state() -> dict[str, Any]:
    state = default_state()
    append_history(state, "reset")
    return write_state(state)


def complete_role(role: str, note: str = "") -> dict[str, Any]:
    state = load_state()
    canonical_role = normalize_role(role)
    if canonical_role not in state["requiredRoles"]:
        state["requiredRoles"] = dedupe_roles(state["requiredRoles"] + [canonical_role])
    if canonical_role in state["waivedRoles"]:
        del state["waivedRoles"][canonical_role]
    if canonical_role not in state["completedRoles"]:
        state["completedRoles"].append(canonical_role)
    append_history(state, "complete", role=canonical_role, note=note.strip())
    return write_state(state)


def waive_role(role: str, reason: str) -> dict[str, Any]:
    if not reason.strip():
        raise ValueError("Waiver reason is required.")
    state = load_state()
    canonical_role = normalize_role(role)
    if canonical_role not in state["requiredRoles"]:
        state["requiredRoles"] = dedupe_roles(state["requiredRoles"] + [canonical_role])
    if canonical_role in state["completedRoles"]:
        state["completedRoles"] = [item for item in state["completedRoles"] if item != canonical_role]
    state.setdefault("waivedRoles", {})[canonical_role] = {
        "reason": reason.strip(),
        "timestamp": utc_now(),
    }
    append_history(state, "waive", role=canonical_role, reason=reason.strip())
    return write_state(state)


def satisfied_roles(state: dict[str, Any]) -> set[str]:
    return set(state.get("completedRoles", [])) | set(state.get("waivedRoles", {}).keys())


def deferred_roles_for_checkpoint(checkpoint: str) -> set[str]:
    if checkpoint == "edit":
        return EDIT_DEFERRED_ROLES
    if checkpoint == "commit":
        return COMMIT_DEFERRED_ROLES
    return set()


def missing_roles(state: dict[str, Any], checkpoint: str) -> list[str]:
    required_roles = state.get("requiredRoles", [])
    deferred = deferred_roles_for_checkpoint(checkpoint)
    satisfied = satisfied_roles(state)
    return [
        role
        for role in required_roles
        if role not in deferred and role not in satisfied
    ]


def status_snapshot(state: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    current = deepcopy(state or load_state())
    current["missing"] = {
        "edit": missing_roles(current, "edit"),
        "commit": missing_roles(current, "commit"),
        "release": missing_roles(current, "release"),
    }
    return current