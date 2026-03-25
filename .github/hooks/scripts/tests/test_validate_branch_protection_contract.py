import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in __import__("sys").path:
    __import__("sys").path.insert(0, str(SCRIPTS_DIR))

import validate_branch_protection_contract


class BranchProtectionContractTests(unittest.TestCase):
    def make_repo(self) -> Path:
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        repo_root = Path(temp_dir.name)
        (repo_root / ".github/policies").mkdir(parents=True, exist_ok=True)
        (repo_root / ".github/workflows").mkdir(parents=True, exist_ok=True)
        return repo_root

    def write_policy(self, repo_root: Path) -> Path:
        policy = {
            "version": 1,
            "policyName": "branch-protection-required-checks",
            "protectedBranch": "main",
            "workflowName": "ci",
            "requiredPullRequestChecks": ["commitlint", "branch-protection-contract"],
            "mainPushOnlyChecks": ["release-evidence"],
            "workflowPath": ".github/workflows/ci.yml",
        }
        path = repo_root / ".github/policies/branch-protection-required-checks.json"
        path.write_text(json.dumps(policy, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def test_validate_contract_succeeds_when_required_jobs_exist(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        (repo_root / ".github/workflows/ci.yml").write_text(
            "jobs:\n  commitlint:\n    runs-on: ubuntu-latest\n  branch-protection-contract:\n    runs-on: ubuntu-latest\n  release-evidence:\n    runs-on: ubuntu-latest\n",
            encoding="utf-8",
        )

        with mock.patch.object(validate_branch_protection_contract, "POLICY_PATH", policy_path):
            failures = validate_branch_protection_contract.validate_contract(repo_root)

        self.assertEqual(failures, [])

    def test_validate_contract_reports_missing_jobs(self) -> None:
        repo_root = self.make_repo()
        policy_path = self.write_policy(repo_root)
        (repo_root / ".github/workflows/ci.yml").write_text(
            "jobs:\n  commitlint:\n    runs-on: ubuntu-latest\n",
            encoding="utf-8",
        )

        with mock.patch.object(validate_branch_protection_contract, "POLICY_PATH", policy_path):
            failures = validate_branch_protection_contract.validate_contract(repo_root)

        self.assertEqual(len(failures), 2)
        self.assertIn("branch-protection-contract", failures[0])