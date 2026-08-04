"""
Direct-mode behavioral tests for Evidence Escrow.

Covers:
- deadline-based recovery path for unresponsive defendants
- payout branches (plaintiff win / defendant win / insufficient evidence refund)
"""

import json

import pytest

CONTRACT = "contracts/evidence_escrow.py"
STAKE = 10_000_000_000_000_000_000
DEFENDANT = "0x00000000000000000000000000000000000000bb"
URLS = "https://example.com/a, https://example.com/b"
PAGE_TEXT = "Public evidence page for dispute testing."


def _verdict_payload(verdict: str) -> str:
    return json.dumps(
        {
            "verdict": verdict,
            "confidence": 8,
            "reasoning": f"Mocked verdict: {verdict}",
        }
    )


@pytest.fixture
def contract(direct_vm, direct_deploy, direct_alice):
    direct_vm.mock_web(r".*", PAGE_TEXT)
    direct_vm.mock_llm(r".*", _verdict_payload("INSUFFICIENT_EVIDENCE"))
    direct_vm.sender = direct_alice
    return direct_deploy(CONTRACT)


class TestRecoveryPath:
    def test_claimant_can_cancel_after_deadline(self, contract, direct_bob):
        # 0-second response window => immediate expiry path.
        contract.file_dispute(
            DEFENDANT,
            "Unresponsive respondent",
            "No response expected",
            URLS,
            0,
            _value=STAKE,
        )
        contract.cancel_expired_dispute(0)
        d = contract.get_dispute(0)
        assert d["status"] == "CANCELLED"
        assert d["verdict"] == "EXPIRED_NO_RESPONSE"
        assert d["paid_out"] is True

        # After cancellation, defense path is closed.
        contract.sender = direct_bob
        with pytest.raises(Exception):
            contract.submit_defense(0, "Late response", URLS, _value=STAKE)


class TestSettlementBranches:
    def _open_ready_case(self, contract, direct_bob):
        contract.file_dispute(
            DEFENDANT,
            "Invoice dispute",
            "Services delivered; payment withheld.",
            URLS,
            72 * 60 * 60,
            _value=STAKE,
        )
        contract.sender = direct_bob
        contract.submit_defense(
            0,
            "Work quality disputed.",
            URLS,
            _value=STAKE,
        )

    def test_plaintiff_wins_branch(self, contract, direct_vm, direct_alice, direct_bob):
        self._open_ready_case(contract, direct_bob)
        direct_vm.mock_llm(r".*", _verdict_payload("PLAINTIFF_WINS"))
        contract.sender = direct_alice
        contract.judge_dispute(0)
        d = contract.get_dispute(0)
        assert d["status"] == "JUDGED"
        assert d["verdict"] == "PLAINTIFF_WINS"
        assert d["paid_out"] is True
        assert d["escrow"] == STAKE * 2

    def test_defendant_wins_branch(self, contract, direct_vm, direct_alice, direct_bob):
        self._open_ready_case(contract, direct_bob)
        direct_vm.mock_llm(r".*", _verdict_payload("DEFENDANT_WINS"))
        contract.sender = direct_alice
        contract.judge_dispute(0)
        d = contract.get_dispute(0)
        assert d["status"] == "JUDGED"
        assert d["verdict"] == "DEFENDANT_WINS"
        assert d["paid_out"] is True
        assert d["escrow"] == STAKE * 2

    def test_insufficient_evidence_refund_branch(
        self, contract, direct_vm, direct_alice, direct_bob
    ):
        self._open_ready_case(contract, direct_bob)
        direct_vm.mock_llm(r".*", _verdict_payload("INSUFFICIENT_EVIDENCE"))
        contract.sender = direct_alice
        contract.judge_dispute(0)
        d = contract.get_dispute(0)
        assert d["status"] == "JUDGED"
        assert d["verdict"] == "INSUFFICIENT_EVIDENCE"
        assert d["paid_out"] is True
        assert d["escrow"] == STAKE * 2
