import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import generate_bilingual_release_summary


class GenerateBilingualReleaseSummaryTests(unittest.TestCase):
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
            "bilingualSummaryMarkdownFileName": "release-bilingual-summary.md",
            "bilingualSummaryHeading": "## Bilingual Release Summary",
        }
        path = repo_root / ".github/policies/release-evidence-policy.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_parse_sections_groups_markdown_headings(self) -> None:
        notes = "### Features\n- Add rooms\n### Bug Fixes\n- Fix sync\n"
        sections = generate_bilingual_release_summary.parse_sections(notes)
        self.assertEqual(sections["features"], ["Add rooms"])
        self.assertEqual(sections["bug fixes"], ["Fix sync"])

    def test_render_summary_contains_bilingual_sections(self) -> None:
        sections = {
            "features": ["Add room reconnect feedback"],
            "bug fixes": ["Fix stale state"],
        }
        evidence = {
            "completedSlice": ["完成双语摘要接线"],
            "qualityEvidence": ["通过 hooks 单测"],
            "remainingRisks": ["营销措辞仍保持保守"],
        }
        policy = {"bilingualSummaryHeading": "## Bilingual Release Summary"}
        summary = generate_bilingual_release_summary.render_summary("1.2.3", sections, evidence, policy)
        self.assertIn("### 中文摘要", summary)
        self.assertIn("### English Summary", summary)
        self.assertIn("#### 新增与改进", summary)
        self.assertIn("#### Fixes and Stability", summary)

    def test_main_skips_when_notes_file_is_missing(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        with mock.patch.object(generate_bilingual_release_summary, "REPO_ROOT", repo_root), mock.patch.object(
            generate_bilingual_release_summary,
            "POLICY_PATH",
            policy_path,
        ), mock.patch("sys.argv", ["generate_bilingual_release_summary.py", "1.2.3"]):
            self.assertEqual(generate_bilingual_release_summary.main(), 0)