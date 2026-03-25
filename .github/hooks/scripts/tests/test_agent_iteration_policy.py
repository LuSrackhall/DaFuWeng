import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import validate_agent_iteration_policy


class AgentIterationPolicyTests(unittest.TestCase):
    def make_repo(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        repo_root = Path(temp_dir.name)
        (repo_root / ".github/policies").mkdir(parents=True, exist_ok=True)
        (repo_root / ".github/hooks/scripts").mkdir(parents=True, exist_ok=True)
        (repo_root / ".github/skills/monopoly-multi-agent-delivery").mkdir(parents=True, exist_ok=True)
        (repo_root / ".github/workflows").mkdir(parents=True, exist_ok=True)
        return repo_root

    def write_policy(self, repo_root: Path) -> None:
        policy = {
            "version": 1,
            "policyName": "agent-iteration-policy",
            "canonicalPrinciples": [
                "请持续不断地迭代我们的大富翁项目, 如果可以的话, 每次完成推进任务后, 请尽可能多给几步之后工作的推荐建议, 但千万不要影响迭代质量, 这样我们才能保证进度的同时不影响产品落地。",
                "请仔细思考, 深度研究, 确保完美完成任务",
            ],
            "requiredSnippets": {
                ".github/copilot-instructions.md": ["请持续不断地迭代我们的大富翁项目"],
                ".github/skills/monopoly-multi-agent-delivery/SKILL.md": ["continuous iteration policy"],
                ".github/hooks/scripts/session_context.py": ["agent-iteration-policy.json"],
                ".github/workflows/ci.yml": ["agent-policy:"],
            },
        }
        (repo_root / ".github/policies/agent-iteration-policy.json").write_text(
            json.dumps(policy, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def test_validate_policy_succeeds_when_all_targets_contain_required_snippets(self) -> None:
        repo_root = self.make_repo()
        self.write_policy(repo_root)
        (repo_root / ".github/copilot-instructions.md").write_text("请持续不断地迭代我们的大富翁项目", encoding="utf-8")
        (repo_root / ".github/skills/monopoly-multi-agent-delivery/SKILL.md").write_text("continuous iteration policy", encoding="utf-8")
        (repo_root / ".github/hooks/scripts/session_context.py").write_text("agent-iteration-policy.json", encoding="utf-8")
        (repo_root / ".github/workflows/ci.yml").write_text("agent-policy:", encoding="utf-8")

        with mock.patch.object(validate_agent_iteration_policy, "REPO_ROOT", repo_root), mock.patch.object(
            validate_agent_iteration_policy,
            "POLICY_PATH",
            repo_root / ".github/policies/agent-iteration-policy.json",
        ):
            failures = validate_agent_iteration_policy.validate_policy(repo_root)

        self.assertEqual(failures, [])

    def test_validate_policy_reports_missing_snippet(self) -> None:
        repo_root = self.make_repo()
        self.write_policy(repo_root)
        (repo_root / ".github/copilot-instructions.md").write_text("missing", encoding="utf-8")
        (repo_root / ".github/skills/monopoly-multi-agent-delivery/SKILL.md").write_text("continuous iteration policy", encoding="utf-8")
        (repo_root / ".github/hooks/scripts/session_context.py").write_text("agent-iteration-policy.json", encoding="utf-8")
        (repo_root / ".github/workflows/ci.yml").write_text("agent-policy:", encoding="utf-8")

        with mock.patch.object(validate_agent_iteration_policy, "REPO_ROOT", repo_root), mock.patch.object(
            validate_agent_iteration_policy,
            "POLICY_PATH",
            repo_root / ".github/policies/agent-iteration-policy.json",
        ):
            failures = validate_agent_iteration_policy.validate_policy(repo_root)

        self.assertEqual(len(failures), 1)
        self.assertIn(".github/copilot-instructions.md", failures[0])