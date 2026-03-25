import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import generate_marketing_summary


class GenerateMarketingSummaryTests(unittest.TestCase):
    def make_repo(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        repo_root = Path(temp_dir.name)
        (repo_root / ".github/policies").mkdir(parents=True, exist_ok=True)
        (repo_root / ".artifacts/release-evidence").mkdir(parents=True, exist_ok=True)
        return repo_root

    def write_policy(self, repo_root: Path) -> Path:
        policy = {
            "version": 1,
            "policyName": "release-evidence-policy",
            "outputDirectory": ".artifacts/release-evidence",
            "jsonFileName": "release-evidence.json",
            "semanticNotesFileName": "semantic-release-notes.md",
            "marketingSummaryMarkdownFileName": "release-marketing-summary.md",
            "marketingSummaryHeading": "## Marketing Summary",
        }
        path = repo_root / ".github/policies/release-evidence-policy.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_render_marketing_summary_contains_two_column_table(self) -> None:
        sections = {"features": ["Add reconnect cues"], "bug fixes": ["Fix stale overlay"]}
        evidence = {"completedSlice": ["完成接线"], "qualityEvidence": ["通过 hooks 单测"], "remainingRisks": ["措辞保持保守"]}
        policy = {"marketingSummaryHeading": "## Marketing Summary"}
        summary = generate_marketing_summary.render_marketing_summary("1.2.3", sections, evidence, policy)
        self.assertIn("| 中文 | English |", summary)
        self.assertIn("发布主线", summary)
        self.assertIn("Release headline", summary)

    def test_main_skips_when_notes_file_is_missing(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        with mock.patch.object(generate_marketing_summary, "REPO_ROOT", repo_root), mock.patch.object(
            generate_marketing_summary,
            "POLICY_PATH",
            policy_path,
        ), mock.patch("sys.argv", ["generate_marketing_summary.py", "1.2.3"]):
            self.assertEqual(generate_marketing_summary.main(), 0)