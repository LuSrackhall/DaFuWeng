import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import generate_release_evidence


class GenerateReleaseEvidenceTests(unittest.TestCase):
    def make_repo(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        repo_root = Path(temp_dir.name)
        (repo_root / ".github/policies").mkdir(parents=True, exist_ok=True)
        return repo_root

    def write_policy(self, repo_root: Path) -> Path:
        policy = {
            "version": 1,
            "policyName": "release-evidence-policy",
            "outputDirectory": ".artifacts/release-evidence",
            "jsonFileName": "release-evidence.json",
            "markdownFileName": "release-evidence.md",
            "governancePolicyPath": ".github/policies/pr-iteration-governance.json",
            "requiredTopLevelFields": ["sourceKind", "commitSha"],
        }
        path = repo_root / ".github/policies/release-evidence-policy.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_build_evidence_uses_pull_request_sections_when_available(self) -> None:
        payload = {
            "after": "abc123",
            "repository": {"full_name": "owner/repo"},
            "head_commit": {"message": "ci: sample"},
        }
        associated_pr = {
            "number": 42,
            "title": "Add release evidence",
            "html_url": "https://example.test/pr/42",
            "body": "## 本轮完成切片\n- 完成 release evidence 生成\n\n## 质量证据\n- 运行 hooks 单测\n\n## 剩余风险\n- 未接 branch protection\n\n## 下一步建议\n- 配置 required checks\n",
        }

        evidence = generate_release_evidence.build_evidence(payload, associated_pr)
        self.assertEqual(evidence["sourceKind"], "pull-request")
        self.assertEqual(evidence["pullRequest"]["number"], 42)
        self.assertIn("完成 release evidence 生成", evidence["completedSlice"][0])

    def test_main_skips_outside_push_to_main(self) -> None:
        with mock.patch.dict(os.environ, {"GITHUB_EVENT_NAME": "pull_request", "GITHUB_REF": "refs/pull/1/merge"}, clear=False):
            self.assertEqual(generate_release_evidence.main(), 0)

    def test_write_outputs_creates_json_and_markdown(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        evidence = {
            "sourceKind": "commit-fallback",
            "workflowName": "ci",
            "commitSha": "abc123",
            "completedSlice": ["fallback"],
            "qualityEvidence": ["unknown"],
            "remainingRisks": ["risk"],
            "nextStepRecommendations": ["next"],
            "warnings": [],
            "pullRequest": {"number": None, "title": None, "url": None},
        }

        with mock.patch.object(generate_release_evidence, "REPO_ROOT", repo_root), mock.patch.object(
            generate_release_evidence,
            "POLICY_PATH",
            policy_path,
        ):
            policy = generate_release_evidence.load_policy()
            json_path, markdown_path = generate_release_evidence.write_outputs(policy, evidence)

        self.assertTrue(json_path.is_file())
        self.assertTrue(markdown_path.is_file())