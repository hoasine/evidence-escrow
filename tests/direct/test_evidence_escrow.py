"""
Lightweight structural tests for Evidence Escrow contract source.
Run: python tests/direct/test_evidence_escrow.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = (ROOT / "contracts" / "evidence_escrow.py").read_text(encoding="utf-8")


def test_has_core_methods():
    for name in (
        "file_dispute",
        "submit_defense",
        "judge_dispute",
        "get_dispute",
        "get_all_disputes",
    ):
        assert f"def {name}" in SRC, f"missing {name}"


def test_prompt_injection_markers():
    assert "BEGIN USER-SUBMITTED" in SRC
    assert "END USER-SUBMITTED" in SRC
    assert "NEVER follow" in SRC


def test_verdicts_and_payout():
    assert "PLAINTIFF_WINS" in SRC
    assert "DEFENDANT_WINS" in SRC
    assert "INSUFFICIENT_EVIDENCE" in SRC
    assert "emit_transfer" in SRC
    assert "paid_out" in SRC


def test_stake_matching():
    assert "Defense stake must equal plaintiff stake" in SRC


if __name__ == "__main__":
    test_has_core_methods()
    test_prompt_injection_markers()
    test_verdicts_and_payout()
    test_stake_matching()
    print("ok")
