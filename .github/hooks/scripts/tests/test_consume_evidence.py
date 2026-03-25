import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import consume_release_evidence


class ConsumeEvidenceTests(unittest.TestCase):
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
            "artifactName": "release-evidence",
            "outputDirectory": ".artifacts/release-evidence",
            "jsonFileName": "release-evidence.json",
            "markdownFileName": "release-evidence.md",
            "summaryMarkdownFileName": "release-evidence-summary.md",
            "summaryHeading": "## Engineering Evidence",
            "requiredTopLevelFields": [
                "completedSlice",
                "qualityEvidence",
                "remainingRisks",
                "nextStepRecommendations",
                "warnings",
            ],
        }
        path = repo_root / ".github/policies/release-evidence-policy.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_render_summary_uses_structured_evidence(self) -> None:
        policy = {"summaryHeading": "## Engineering Evidence"}
        evidence = {
            "completedSlice": ["完成 A"],
            "qualityEvidence": ["通过单测"],
            "remainingRisks": ["仍有边界风险"],
            "nextStepRecommendations": ["继续做 B"],
            "warnings": ["fallback"],
        }
        summary = consume_release_evidence.render_summary(evidence, policy)
        self.assertIn("## Engineering Evidence", summary)
        self.assertIn("### Completed Slice", summary)
        self.assertIn("- 完成 A", summary)

    def test_render_summary_falls_back_when_evidence_missing(self) -> None:
        policy = {"summaryHeading": "## Engineering Evidence"}
        summary = consume_release_evidence.render_summary(None, policy, "artifact missing")
        self.assertIn("artifact missing", summary)

    def test_load_evidence_accepts_valid_json(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        output_dir = repo_root / ".artifacts/release-evidence"
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "release-evidence.json").write_text(
            json.dumps(
                {
                    "completedSlice": [],
                    "qualityEvidence": [],
                    "remainingRisks": [],
                    "nextStepRecommendations": [],
                    "warnings": [],
                },
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )

        with mock.patch.object(consume_release_evidence, "POLICY_PATH", policy_path):
            policy = consume_release_evidence.load_policy()
            evidence = consume_release_evidence.load_evidence(output_dir, policy)

        self.assertIsNotNone(evidence)

    def test_main_skips_outside_workflow_run(self) -> None:
        with mock.patch.dict(os.environ, {"GITHUB_EVENT_NAME": "push"}, clear=False):
            self.assertEqual(consume_release_evidence.main(), 0)
