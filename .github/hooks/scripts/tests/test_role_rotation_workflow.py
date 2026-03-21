import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from typing import Optional


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import pre_tool_policy
import role_rotation_state


class RoleRotationWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_state_dir = role_rotation_state.STATE_DIR
        self.original_state_path = role_rotation_state.STATE_PATH
        role_rotation_state.STATE_DIR = Path(self.temp_dir.name)
        role_rotation_state.STATE_PATH = role_rotation_state.STATE_DIR / "role-rotation-state.json"
        role_rotation_state.reset_state()

    def tearDown(self) -> None:
        role_rotation_state.STATE_DIR = self.original_state_dir
        role_rotation_state.STATE_PATH = self.original_state_path
        self.temp_dir.cleanup()

    def run_policy(self, payload: dict, state: Optional[dict] = None) -> dict:
        previous_stdin = sys.stdin
        original_load_state = pre_tool_policy.load_state
        try:
            sys.stdin = io.StringIO(json.dumps(payload))
            if state is not None:
                pre_tool_policy.load_state = lambda: state

            buffer = io.StringIO()
            with redirect_stdout(buffer):
                pre_tool_policy.main()

            output = buffer.getvalue().strip()
            self.assertTrue(output)
            return json.loads(output)
        finally:
            sys.stdin = previous_stdin
            pre_tool_policy.load_state = original_load_state

    def test_init_state_includes_rules_and_versioning_roles(self) -> None:
        state = role_rotation_state.init_state(
            "implementation",
            "2026-03-22-enforce-multi-agent-rotation",
            "test",
        )

        self.assertIn("Monopoly Rules Expert", state["requiredRoles"])
        self.assertIn("Monopoly UI UX Pro Max", state["requiredRoles"])
        self.assertIn("Monopoly Versioning Manager", state["requiredRoles"])
        self.assertNotIn("Monopoly Pixi Scene Engineer", state["requiredRoles"])

    def test_load_state_migrates_old_required_roles(self) -> None:
        role_rotation_state.ensure_runtime_dir()
        role_rotation_state.STATE_PATH.write_text(
            json.dumps(
                {
                    "version": 1,
                    "workflowInitialized": True,
                    "mode": "implementation",
                    "activeChange": "legacy-change",
                    "requiredRoles": [
                        "GitHub Copilot Workflow Expert",
                        "Monopoly Product Manager",
                        "Monopoly UI UX Director",
                        "Monopoly UI UX Pro Max",
                        "Monopoly Tech Lead",
                        "Monopoly Senior Implementer",
                        "Monopoly QA Lead",
                        "Monopoly Simulated Player",
                    ],
                    "completedRoles": [],
                    "waivedRoles": {},
                    "history": [],
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        state = role_rotation_state.load_state()

        self.assertEqual(state["version"], 2)
        self.assertIn("Monopoly UI UX Pro Max", state["requiredRoles"])
        self.assertIn("Monopoly Rules Expert", state["requiredRoles"])
        self.assertIn("Monopoly Versioning Manager", state["requiredRoles"])

    def test_edit_is_denied_when_workflow_is_uninitialized(self) -> None:
        result = self.run_policy(
            {"tool": "apply_patch", "input": "*** Begin Patch\n*** Add File: demo.txt\n+demo\n*** End Patch"},
            role_rotation_state.load_state(),
        )

        self.assertEqual(
            result["hookSpecificOutput"]["permissionDecision"],
            "deny",
        )
        self.assertIn(
            "workflow state is not initialized",
            result["hookSpecificOutput"]["permissionDecisionReason"],
        )

    def test_commit_is_denied_when_versioning_role_is_missing(self) -> None:
        state = role_rotation_state.init_state(
            "implementation",
            "2026-03-22-enforce-multi-agent-rotation",
            "test",
        )
        for role in [
            "GitHub Copilot Workflow Expert",
            "Monopoly Product Manager",
            "Monopoly UI UX Director",
            "Monopoly UI UX Pro Max",
            "Monopoly Rules Expert",
            "Monopoly Tech Lead",
            "Monopoly Senior Implementer",
            "Monopoly QA Lead",
            "Monopoly Simulated Player",
        ]:
            state = role_rotation_state.complete_role(role, "ready")

        result = self.run_policy(
            {"command": 'git commit -m "feat: 完成门禁测试"'},
            state,
        )

        self.assertEqual(
            result["hookSpecificOutput"]["permissionDecision"],
            "deny",
        )
        self.assertIn(
            "Monopoly Versioning Manager",
            result["hookSpecificOutput"]["permissionDecisionReason"],
        )

    def test_commit_is_allowed_when_required_roles_are_satisfied(self) -> None:
        state = role_rotation_state.init_state(
            "implementation",
            "2026-03-22-enforce-multi-agent-rotation",
            "test",
        )
        for role in [
            "GitHub Copilot Workflow Expert",
            "Monopoly Product Manager",
            "Monopoly UI UX Director",
            "Monopoly UI UX Pro Max",
            "Monopoly Rules Expert",
            "Monopoly Tech Lead",
            "Monopoly Senior Implementer",
            "Monopoly QA Lead",
            "Monopoly Simulated Player",
            "Monopoly Versioning Manager",
        ]:
            state = role_rotation_state.complete_role(role, "ready")

        result = self.run_policy(
            {"command": 'git commit -m "feat: 完成门禁测试"'},
            state,
        )

        self.assertEqual(
            result["hookSpecificOutput"]["permissionDecision"],
            "allow",
        )

    def test_commit_is_allowed_when_simulated_player_is_waived(self) -> None:
        state = role_rotation_state.init_state(
            "implementation",
            "2026-03-22-enforce-multi-agent-rotation",
            "test",
        )
        for role in [
            "GitHub Copilot Workflow Expert",
            "Monopoly Product Manager",
            "Monopoly UI UX Director",
            "Monopoly UI UX Pro Max",
            "Monopoly Rules Expert",
            "Monopoly Tech Lead",
            "Monopoly Senior Implementer",
            "Monopoly QA Lead",
            "Monopoly Versioning Manager",
        ]:
            state = role_rotation_state.complete_role(role, "ready")

        state = role_rotation_state.waive_role(
            "Monopoly Simulated Player",
            "workflow-only infrastructure change",
        )

        result = self.run_policy(
            {"command": 'git commit -m "feat: 完成门禁测试"'},
            state,
        )

        self.assertEqual(
            result["hookSpecificOutput"]["permissionDecision"],
            "allow",
        )

    def test_release_is_denied_when_release_marketer_is_missing(self) -> None:
        state = role_rotation_state.init_state(
            "release",
            "2026-03-22-enforce-multi-agent-rotation",
            "test",
        )
        for role in [
            "GitHub Copilot Workflow Expert",
            "Monopoly Product Manager",
            "Monopoly UI UX Director",
            "Monopoly UI UX Pro Max",
            "Monopoly Rules Expert",
            "Monopoly Tech Lead",
            "Monopoly Senior Implementer",
            "Monopoly QA Lead",
            "Monopoly Simulated Player",
            "Monopoly Versioning Manager",
        ]:
            state = role_rotation_state.complete_role(role, "ready")

        result = self.run_policy(
            {"command": "pnpm release"},
            state,
        )

        self.assertEqual(
            result["hookSpecificOutput"]["permissionDecision"],
            "deny",
        )
        self.assertIn(
            "Monopoly Release Marketer",
            result["hookSpecificOutput"]["permissionDecisionReason"],
        )


if __name__ == "__main__":
    unittest.main()