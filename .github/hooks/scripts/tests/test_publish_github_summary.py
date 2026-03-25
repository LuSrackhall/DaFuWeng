import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import publish_github_summary


class PublishGitHubSummaryTests(unittest.TestCase):
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
            "summaryMarkdownFileName": "release-evidence-summary.md",
            "summaryHeading": "## Engineering Evidence",
            "bilingualSummaryMarkdownFileName": "release-bilingual-summary.md",
            "bilingualSummaryHeading": "## Bilingual Release Summary",
        }
        path = repo_root / ".github/policies/release-evidence-policy.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_build_updated_body_appends_summary_once(self) -> None:
        body = "Base notes"
        summary = "## Engineering Evidence\n\n- item"
        updated = publish_github_summary.build_updated_body(body, summary, "## Engineering Evidence")
        self.assertIn("Base notes", updated)
        self.assertIn("## Engineering Evidence", updated)

        unchanged = publish_github_summary.build_updated_body(updated, summary, "## Engineering Evidence")
        self.assertEqual(updated, unchanged)

    def test_append_optional_section_ignores_missing_file(self) -> None:
        repo_root = self.make_repo()
        missing = repo_root / "missing.md"
        updated = publish_github_summary.append_optional_section("Base notes", missing, "## Heading")
        self.assertEqual(updated, "Base notes")

    def test_main_skips_when_summary_file_is_missing(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        with mock.patch.object(publish_github_summary, "REPO_ROOT", repo_root), mock.patch.object(
            publish_github_summary,
            "POLICY_PATH",
            policy_path,
        ), mock.patch.dict(os.environ, {"GITHUB_TOKEN": "token", "GITHUB_REPOSITORY": "owner/repo"}, clear=False), mock.patch(
            "sys.argv",
            ["publish_github_summary.py", "v1.2.3"],
        ):
            self.assertEqual(publish_github_summary.main(), 0)
