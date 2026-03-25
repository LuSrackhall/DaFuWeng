import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import validate_pr_iteration_governance


class PrIterationGovernanceTests(unittest.TestCase):
    def make_repo(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        repo_root = Path(temp_dir.name)
        (repo_root / ".github/policies").mkdir(parents=True, exist_ok=True)
        return repo_root

    def write_policy(self, repo_root: Path) -> Path:
        policy = {
            "version": 1,
            "policyName": "pr-iteration-governance",
            "requiredSections": [
                {"heading": "## 本轮完成切片", "description": "slice"},
                {"heading": "## 质量证据", "description": "quality"},
                {"heading": "## 剩余风险", "description": "risk"},
                {"heading": "## 下一步建议", "description": "next"},
            ],
        }
        path = repo_root / ".github/policies/pr-iteration-governance.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_validate_pr_body_succeeds_when_all_sections_have_content(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        with mock.patch.object(validate_pr_iteration_governance, "POLICY_PATH", policy_path):
            policy = validate_pr_iteration_governance.load_policy()

        body = """## 本轮完成切片
- 完成 PR 模板与正文校验

## 质量证据
- 已运行 hook 单测与 validator

## 剩余风险
- 仍需接 branch protection

## 下一步建议
- 推进 PR 模板与 release notes 的联动
"""

        failures = validate_pr_iteration_governance.validate_pr_body(body, policy)
        self.assertEqual(failures, [])

    def test_validate_pr_body_reports_missing_or_placeholder_sections(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        with mock.patch.object(validate_pr_iteration_governance, "POLICY_PATH", policy_path):
            policy = validate_pr_iteration_governance.load_policy()

        body = """## 本轮完成切片
- 本轮最小交付:

## 质量证据
- 关键测试或日志:
"""

        failures = validate_pr_iteration_governance.validate_pr_body(body, policy)
        self.assertEqual(len(failures), 4)
        self.assertIn("Section is empty or still placeholder-only: ## 本轮完成切片", failures[0])

    def test_filled_template_prefix_lines_are_treated_as_meaningful_content(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        with mock.patch.object(validate_pr_iteration_governance, "POLICY_PATH", policy_path):
            policy = validate_pr_iteration_governance.load_policy()

        body = """## 本轮完成切片
- OpenSpec change: pr-iteration-governance-automation
- 本轮最小交付: 新增 PR 模板与 CI 校验

## 质量证据
- 已运行验证: hooks 单测

## 剩余风险
- 当前已知风险: branch protection 尚未配置

## 下一步建议
- 建议 1: 接入 branch protection
"""

        failures = validate_pr_iteration_governance.validate_pr_body(body, policy)
        self.assertEqual(failures, [])

    def test_main_skips_outside_pull_request_events(self) -> None:
        with mock.patch.dict(os.environ, {"GITHUB_EVENT_NAME": "push"}, clear=False):
            self.assertEqual(validate_pr_iteration_governance.main(), 0)