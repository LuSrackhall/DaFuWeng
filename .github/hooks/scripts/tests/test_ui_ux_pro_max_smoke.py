import subprocess
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[4]
SEARCH_SCRIPT = REPO_ROOT / ".github/prompts/ui-ux-pro-max/scripts/search.py"


class UiUxProMaxSmokeTests(unittest.TestCase):
    def test_design_system_search_runs(self) -> None:
        result = subprocess.run(
            [
                "python3",
                str(SEARCH_SCRIPT),
                "monopoly board mobile game premium",
                "--design-system",
                "-p",
                "DaFuWeng",
                "-f",
                "markdown",
            ],
            cwd=REPO_ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn("## Design System: DaFuWeng", result.stdout)
        self.assertIn("### Pattern", result.stdout)


if __name__ == "__main__":
    unittest.main()