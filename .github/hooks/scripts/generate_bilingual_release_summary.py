import json
import sys
from pathlib import Path
from typing import Optional


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/release-evidence-policy.json"

FEATURE_HEADINGS = {"features", "feature"}
FIX_HEADINGS = {"bug fixes", "bug fix", "performance improvements", "performance improvement", "reverts", "revert"}


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
        raise FileNotFoundError(f"Missing policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    if not isinstance(policy, dict):
        raise ValueError("Policy file must contain a JSON object.")

    return policy


def output_dir(policy: dict) -> Path:
    return REPO_ROOT / policy["outputDirectory"]


def semantic_notes_path(policy: dict) -> Path:
    return output_dir(policy) / policy["semanticNotesFileName"]


def evidence_json_path(policy: dict) -> Path:
    return output_dir(policy) / policy["jsonFileName"]


def bilingual_summary_path(policy: dict) -> Path:
    return output_dir(policy) / policy["bilingualSummaryMarkdownFileName"]


def parse_sections(notes: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current_heading = "general"
    for raw_line in notes.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("### "):
            current_heading = line[4:].strip().lower()
            sections.setdefault(current_heading, [])
            continue
        if line.startswith("- "):
            sections.setdefault(current_heading, []).append(line[2:].strip())
            continue
        sections.setdefault(current_heading, []).append(line)
    return sections


def load_evidence(policy: dict) -> Optional[dict]:
    path = evidence_json_path(policy)
    if not path.is_file():
        return None

    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    return payload if isinstance(payload, dict) else None


def collect_by_headings(sections: dict[str, list[str]], allowed: set[str]) -> list[str]:
    values: list[str] = []
    for heading, items in sections.items():
        if heading in allowed:
            values.extend(items)
    return values


def collect_other_changes(sections: dict[str, list[str]]) -> list[str]:
    values: list[str] = []
    for heading, items in sections.items():
        if heading not in FEATURE_HEADINGS and heading not in FIX_HEADINGS:
            values.extend(items)
    return values


def render_section(title: str, items: list[str], fallback: Optional[str] = None) -> list[str]:
    if not items and not fallback:
        return []
    lines = [title]
    if items:
        lines.extend([f"- {item}" for item in items])
    elif fallback:
        lines.append(f"- {fallback}")
    lines.append("")
    return lines


def render_summary(version: str, sections: dict[str, list[str]], evidence: Optional[dict], policy: dict) -> str:
    features = collect_by_headings(sections, FEATURE_HEADINGS)
    fixes = collect_by_headings(sections, FIX_HEADINGS)
    other_changes = collect_other_changes(sections)
    completed_slice = evidence.get("completedSlice", []) if isinstance(evidence, dict) else []
    quality_evidence = evidence.get("qualityEvidence", []) if isinstance(evidence, dict) else []
    remaining_risks = evidence.get("remainingRisks", []) if isinstance(evidence, dict) else []

    lines = [policy.get("bilingualSummaryHeading", "## Bilingual Release Summary"), ""]
    lines.extend([
        "### 中文摘要",
        f"- 版本：{version}",
        "- 本摘要基于自动发布记录与现有工程证据生成，细节条目保留原始措辞。",
        "",
    ])
    lines.extend(render_section("#### 发布摘要", features[:1] or fixes[:1] or other_changes[:1], "本次更新包含已发布变更与工程验证上下文。"))
    lines.extend(render_section("#### 新增与改进", features))
    lines.extend(render_section("#### 修复与稳定性", fixes))
    lines.extend(render_section("#### 其他说明", other_changes))
    lines.extend(render_section("#### 工程验证", completed_slice + quality_evidence, "本次未附带额外工程验证条目。"))
    lines.extend(render_section("#### 范围说明", remaining_risks, "本摘要仅覆盖已发布变更与现有工程证据。"))

    lines.extend([
        "### English Summary",
        f"- Version: {version}",
        "- This summary is generated from published notes and current engineering evidence. Detailed entries preserve the original wording.",
        "",
    ])
    lines.extend(render_section("#### Release Summary", features[:1] or fixes[:1] or other_changes[:1], "This update includes shipped changes and current engineering context."))
    lines.extend(render_section("#### New and Improved", features))
    lines.extend(render_section("#### Fixes and Stability", fixes))
    lines.extend(render_section("#### Additional Notes", other_changes))
    lines.extend(render_section("#### Engineering Verification", completed_slice + quality_evidence, "No additional engineering verification items were attached for this publication."))
    lines.extend(render_section("#### Scope Notes", remaining_risks, "This summary covers shipped changes and currently available engineering evidence only."))
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    if len(sys.argv) < 2:
        print("Expected version as the first argument.", file=sys.stderr)
        return 1

    version = sys.argv[1]
    policy = load_policy()
    notes_file = semantic_notes_path(policy)
    if not notes_file.is_file():
        print("Skipping bilingual summary generation because semantic-release notes file is missing.")
        return 0

    notes = notes_file.read_text(encoding="utf-8")
    sections = parse_sections(notes)
    evidence = load_evidence(policy)
    summary = render_summary(version, sections, evidence, policy)
    destination = bilingual_summary_path(policy)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(summary, encoding="utf-8")
    print(f"Generated bilingual release summary: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())