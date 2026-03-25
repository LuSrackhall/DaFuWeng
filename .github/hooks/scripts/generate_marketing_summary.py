import json
import sys
from pathlib import Path
from typing import Optional

import generate_bilingual_release_summary


REPO_ROOT = Path(__file__).resolve().parents[3]
POLICY_PATH = REPO_ROOT / ".github/policies/release-evidence-policy.json"


def load_policy() -> dict:
    if not POLICY_PATH.is_file():
        raise FileNotFoundError(f"Missing policy file: {POLICY_PATH}")

    with POLICY_PATH.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)

    if not isinstance(policy, dict):
        raise ValueError("Policy file must contain a JSON object.")

    return policy


def marketing_summary_path(policy: dict) -> Path:
    return REPO_ROOT / policy["outputDirectory"] / policy["marketingSummaryMarkdownFileName"]


def render_row(left: str, right: str) -> str:
    safe_left = left.replace("\n", "<br>")
    safe_right = right.replace("\n", "<br>")
    return f"| {safe_left} | {safe_right} |"


def first_or_default(values: list[str], fallback: str) -> str:
    return values[0] if values else fallback


def render_marketing_summary(version: str, sections: dict[str, list[str]], evidence: Optional[dict], policy: dict) -> str:
    features = generate_bilingual_release_summary.collect_by_headings(sections, generate_bilingual_release_summary.FEATURE_HEADINGS)
    fixes = generate_bilingual_release_summary.collect_by_headings(sections, generate_bilingual_release_summary.FIX_HEADINGS)
    other_changes = generate_bilingual_release_summary.collect_other_changes(sections)
    completed_slice = evidence.get("completedSlice", []) if isinstance(evidence, dict) else []
    quality_evidence = evidence.get("qualityEvidence", []) if isinstance(evidence, dict) else []
    remaining_risks = evidence.get("remainingRisks", []) if isinstance(evidence, dict) else []

    headline_zh = first_or_default(features[:1] or fixes[:1], "本次更新聚焦于已发布内容与关键体验说明。")
    headline_en = first_or_default(features[:1] or fixes[:1], "This update focuses on shipped changes and player-facing clarity.")
    players_notice_zh = "；".join(features[:2] or fixes[:2] or other_changes[:2]) or "本次更新包含可见改动，但摘要保持保守表述。"
    players_notice_en = "; ".join(features[:2] or fixes[:2] or other_changes[:2]) or "This update includes visible changes while keeping the summary conservative."
    quality_zh = "；".join((completed_slice + quality_evidence)[:3]) or "本次发布带有现有工程验证上下文。"
    quality_en = "; ".join((completed_slice + quality_evidence)[:3]) or "This publication includes current engineering verification context."
    scope_zh = "；".join(remaining_risks[:2]) or "本摘要仅覆盖已发布内容，不扩展到未承诺范围。"
    scope_en = "; ".join(remaining_risks[:2]) or "This summary covers shipped content only and does not extend beyond confirmed scope."

    lines = [policy.get("marketingSummaryHeading", "## Marketing Summary"), "", f"Version: {version}", "", "| 中文 | English |", "| --- | --- |"]
    lines.append(render_row(f"发布主线：{headline_zh}", f"Release headline: {headline_en}"))
    lines.append(render_row(f"玩家可感知：{players_notice_zh}", f"What players will notice: {players_notice_en}"))
    lines.append(render_row(f"质量信号：{quality_zh}", f"Quality signals: {quality_en}"))
    lines.append(render_row(f"范围说明：{scope_zh}", f"Scope notes: {scope_en}"))
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) < 2:
        print("Expected version as the first argument.", file=sys.stderr)
        return 1

    version = sys.argv[1]
    policy = load_policy()
    notes_file = generate_bilingual_release_summary.semantic_notes_path(policy)
    if not notes_file.is_file():
        print("Skipping marketing summary generation because semantic-release notes file is missing.")
        return 0

    notes = notes_file.read_text(encoding="utf-8")
    sections = generate_bilingual_release_summary.parse_sections(notes)
    evidence = generate_bilingual_release_summary.load_evidence(policy)
    summary = render_marketing_summary(version, sections, evidence, policy)
    destination = marketing_summary_path(policy)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(summary, encoding="utf-8")
    print(f"Generated marketing summary: {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())