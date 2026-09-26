import pytest
import json
from pathlib import Path


def test_contract_syntax_and_structure(contract_source):
    """Verify that contract starts with the exact required pragma and defines essential methods."""
    assert contract_source.startswith(
        '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
    )
    assert "class JobBounty:" in contract_source
    assert "class Contract(gl.Contract):" in contract_source
    assert "def post_job_bounty(" in contract_source
    assert "def submit_interview_response(" in contract_source
    assert "def adjudicate_interview(" in contract_source
    assert "def appeal_verdict(" in contract_source
    assert "def adjudicate_appeal(" in contract_source
    assert "def finalize_settlement(" in contract_source
    assert "def cancel_or_reclaim(" in contract_source
    assert "def get_job(" in contract_source
    assert "def get_job_count(" in contract_source
    assert "def get_job_id_by_index(" in contract_source
    assert "def get_jobs_paginated(" in contract_source
    assert "def get_all_jobs(" in contract_source
    assert "def get_stats(" in contract_source


def test_job_bounty_struct_fields(contract_source):
    """Ensure JobBounty defines all storage fields required by protocol specification without default values."""
    expected_fields = [
        "job_id: str",
        "employer: Address",
        "candidate_agent: Address",
        "dispute_initiator: Address",
        "bounty_amount: bigint",
        "dispute_bond: bigint",
        "job_description: str",
        "interview_response_url: str",
        "status: u8",
        "verdict: str",
        "reason: str",
        "confidence: u8",
        "competency_score: u8",
        "created_at_block: u256",
        "expires_at_block: u256",
        "interview_started_block: u256",
        "audit_completed_block: u256",
    ]
    for field in expected_fields:
        assert field in contract_source, f"Missing storage field in JobBounty: {field}"

    # Verify NO default assignments in dataclass (Pavel & Joaquin compliance)
    assert 'appeal_reason: str = ""' not in contract_source
    assert 'appeal_count: u8 = u8(0)' not in contract_source


def test_semantic_consensus_rule(contract_source):
    """Verify validator_fn implements Semantic Consensus on verdict instead of byte-equality."""
    assert 'mine["verdict"] == leader["verdict"]' in contract_source, (
        "Validator function must strictly implement semantic consensus on verdict"
    )


def test_security_canary_token(contract_source):
    """Verify canary token security pattern is declared and verified."""
    assert 'CANARY_TOKEN = "CANARY_AGENT_TALENT_V1"' in contract_source
    assert 'canary' in contract_source


def test_native_transfers(contract_source):
    """Verify payouts and refunds use gl.get_contract_at(...).emit_transfer(value=u256(...))."""
    assert "emit_transfer(value=u256(escrow_val))" in contract_source
    assert "emit_transfer(value=u256(half_bounty))" in contract_source
    assert "emit_transfer(value=u256(employer_refund))" in contract_source
    assert "emit_transfer(value=u256(bond_val))" in contract_source


# --- Behavioral State Machine Simulation (GenVM Role-Based Unit Tests) ---

class MockAgentTalentSimulator:
    """Simulates GenVM state transitions for AgentTalent with 30-block cooling-off and appeal bonds."""

    def __init__(self):
        self.jobs = {}
        self.job_ids = []
        self.total_talent_locked = 0
        self.total_hires_completed = 0
        self.job_counter = 0
        self.balances = {"employer": 1000, "candidate": 100, "third_party": 500}

    def post_job_bounty(self, sender: str, value: int, job_description: str, duration_blocks: int = 5000) -> str:
        if value <= 0:
            raise ValueError("Hiring bounty escrow must be greater than 0 GEN.")
        clean_desc = str(job_description).strip()
        if not clean_desc or len(clean_desc) < 15:
            raise ValueError("Job specification and case study scenario must be at least 15 characters.")

        self.job_counter += 1
        job_id = f"talent-{self.job_counter}"
        current_block = self.job_counter
        duration = duration_blocks if duration_blocks > 0 else 5000
        expires_at = current_block + duration

        self.jobs[job_id] = {
            "job_id": job_id,
            "employer": sender,
            "candidate_agent": "0x0000000000000000000000000000000000000000",
            "dispute_initiator": "0x0000000000000000000000000000000000000000",
            "bounty_amount": value,
            "dispute_bond": 0,
            "job_description": clean_desc,
            "interview_response_url": "",
            "status": 0,  # OPEN
            "verdict": "PENDING",
            "reason": "Role open. Awaiting AI agent candidate interview submission.",
            "confidence": 0,
            "competency_score": 0,
            "created_at_block": current_block,
            "expires_at_block": expires_at,
            "interview_started_block": 0,
            "audit_completed_block": 0,
        }
        self.job_ids.append(job_id)
        self.total_talent_locked += value
        self.balances[sender] -= value
        return job_id

    def submit_interview_response(self, sender: str, job_id: str, interview_response_url: str) -> None:
        if job_id not in self.jobs:
            raise KeyError(f"Job {job_id} does not exist.")
        j = self.jobs[job_id]
        if j["status"] != 0:
            raise ValueError(f"Job {job_id} is not open for interview submission.")
        if sender == j["employer"]:
            raise ValueError("Employer cannot apply as candidate for their own job post.")
        clean_url = str(interview_response_url).strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            raise ValueError("Valid public interview solution URL (http/https) is required.")

        self.job_counter += 1
        j["candidate_agent"] = sender
        j["interview_response_url"] = clean_url
        j["status"] = 1  # IN_INTERVIEW
        j["interview_started_block"] = self.job_counter
        j["reason"] = "Interview response submitted. Executive AI Hiring Board convening for evaluation."

    def adjudicate_interview(self, job_id: str, verdict: str, reason: str, confidence: int, competency_score: int) -> None:
        if job_id not in self.jobs:
            raise KeyError(f"Job {job_id} does not exist.")
        j = self.jobs[job_id]
        if j["status"] != 1:
            raise ValueError(f"Job {job_id} is not awaiting interview adjudication.")

        self.job_counter += 1
        j["verdict"] = verdict
        j["reason"] = reason
        j["confidence"] = confidence
        j["competency_score"] = competency_score
        j["status"] = 7  # AUDIT_COMPLETED (cooling-off window begins)
        j["audit_completed_block"] = self.job_counter
        # Notice: escrow is NOT transferred yet, total_talent_locked is untouched!

    def appeal_verdict(self, sender: str, job_id: str, new_evidence_url: str, bond_value: int, current_block: int) -> None:
        if job_id not in self.jobs:
            raise KeyError(f"Job {job_id} does not exist.")
        j = self.jobs[job_id]
        if j["status"] != 7:
            raise ValueError("Job is not in appeal challenge window.")
        if sender != j["employer"] and sender != j["candidate_agent"]:
            raise PermissionError("Only Employer or Candidate can file an appeal.")

        if current_block > (j["audit_completed_block"] + 30):
            raise ValueError("Appeal challenge window has expired. Eligible for settlement.")

        required_bond = max(1, (j["bounty_amount"] * 10) // 100)
        if bond_value < required_bond:
            raise ValueError(f"Appeal bond insufficient. Minimum required: 10% ({required_bond} wei).")

        clean_url = str(new_evidence_url).strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            raise ValueError("Valid new evidence URL (http/https) is required for appeal.")

        self.job_counter += 1
        j["status"] = 6  # DISPUTED
        j["dispute_initiator"] = sender
        j["dispute_bond"] = bond_value
        j["interview_response_url"] = clean_url
        j["verdict"] = "DISPUTED"
        j["reason"] = f"Initial verdict appealed by {'Employer' if sender == j['employer'] else 'Candidate'}."
        self.total_talent_locked += bond_value
        self.balances[sender] -= bond_value

    def adjudicate_appeal(self, job_id: str, appeal_verdict: str, reason: str) -> None:
        if job_id not in self.jobs:
            raise KeyError(f"Job {job_id} does not exist.")
        j = self.jobs[job_id]
        if j["status"] != 6:
            raise ValueError("Job is not in active dispute.")

        escrow = j["bounty_amount"]
        bond = j["dispute_bond"]
        appellant = j["dispute_initiator"]
        j["dispute_bond"] = 0

        self.total_talent_locked -= (escrow + bond)
        self.total_hires_completed += 1

        if appeal_verdict == "APPEAL_UPHELD_HIRED":
            j["status"] = 2  # HIRED_PAID
            j["verdict"] = "CANDIDATE_HIRED"
            j["reason"] = reason
            self.balances[j["candidate_agent"]] += escrow
            self.balances[j["candidate_agent"]] += bond
        elif appeal_verdict == "APPEAL_UPHELD_SHORTLISTED":
            j["status"] = 4  # SHORTLISTED_PARTIAL
            j["verdict"] = "CANDIDATE_SHORTLISTED"
            j["reason"] = reason
            half_bounty = escrow // 2
            refund = escrow - half_bounty
            if half_bounty > 0:
                self.balances[j["candidate_agent"]] += half_bounty
            if refund > 0:
                self.balances[j["employer"]] += refund
            self.balances[appellant] += bond
        else:
            # Appeal rejected
            if appellant == j["candidate_agent"]:
                j["status"] = 3  # REJECTED_REFUNDED
                j["verdict"] = "CANDIDATE_REJECTED"
                self.balances[j["employer"]] += escrow
                self.balances[j["employer"]] += bond
            else:
                j["status"] = 2  # HIRED_PAID
                j["verdict"] = "CANDIDATE_HIRED"
                self.balances[j["candidate_agent"]] += escrow
                self.balances[j["candidate_agent"]] += bond

    def finalize_settlement(self, job_id: str, current_block: int) -> None:
        if job_id not in self.jobs:
            raise KeyError(f"Job {job_id} does not exist.")
        j = self.jobs[job_id]
        if j["status"] != 7:
            raise ValueError(f"Job {job_id} is not awaiting final settlement.")

        if current_block <= (j["audit_completed_block"] + 30):
            raise ValueError("Appeal cooling-off window (30 blocks) is still active.")

        escrow = j["bounty_amount"]
        self.total_talent_locked -= escrow
        self.total_hires_completed += 1

        if j["verdict"] == "CANDIDATE_HIRED":
            j["status"] = 2  # HIRED_PAID
            self.balances[j["candidate_agent"]] += escrow
        elif j["verdict"] == "CANDIDATE_SHORTLISTED":
            j["status"] = 4  # SHORTLISTED_PARTIAL
            half_bounty = escrow // 2
            refund = escrow - half_bounty
            if half_bounty > 0:
                self.balances[j["candidate_agent"]] += half_bounty
            if refund > 0:
                self.balances[j["employer"]] += refund
        else:
            j["status"] = 3  # REJECTED_REFUNDED
            self.balances[j["employer"]] += escrow

    def cancel_or_reclaim(self, sender: str, job_id: str, current_block: int) -> None:
        if job_id not in self.jobs:
            raise KeyError(f"Job {job_id} does not exist.")
        j = self.jobs[job_id]
        if sender != j["employer"]:
            raise PermissionError("Only the employer can cancel or reclaim bounty.")

        if j["status"] == 1:
            if current_block < (j["interview_started_block"] + 50):
                raise ValueError("Cannot reclaim: Interview is under active evaluation by the hiring board.")
        elif j["status"] == 0:
            if current_block < j["expires_at_block"]:
                raise ValueError("Cannot cancel: Job listing duration has not yet expired.")
        else:
            raise ValueError("Job bounty is already settled or reclaimed.")

        j["status"] = 5  # CANCELLED
        j["verdict"] = "CANCELLED"
        j["reason"] = "Job listing cancelled and bounty refunded to employer."
        escrow = j["bounty_amount"]
        self.total_talent_locked -= escrow
        self.balances[sender] += escrow


# --- Integration Test Scenarios ---

def test_post_job_validation_rules():
    """Verify escrow > 0 and description minimum length rules."""
    sim = MockAgentTalentSimulator()

    # Zero escrow fails
    with pytest.raises(ValueError, match="must be greater than 0"):
        sim.post_job_bounty(sender="employer", value=0, job_description="Valid length description here")

    # Short description fails
    with pytest.raises(ValueError, match="at least 15 characters"):
        sim.post_job_bounty(sender="employer", value=100, job_description="Too short")

    # Valid posting succeeds
    job_id = sim.post_job_bounty(
        sender="employer",
        value=300,
        job_description="Seeking Autonomous Arbitrage Agent with sub-second execution logic and risk models.",
        duration_blocks=1000
    )
    assert job_id == "talent-1"
    assert sim.balances["employer"] == 700
    assert sim.total_talent_locked == 300
    assert sim.jobs[job_id]["status"] == 0


def test_candidate_submission_guards():
    """Verify employer cannot apply, and only valid http/https URLs are accepted."""
    sim = MockAgentTalentSimulator()
    job_id = sim.post_job_bounty(
        sender="employer",
        value=200,
        job_description="Architect an autonomous DAO treasury management agent."
    )

    # Employer cannot apply to own job
    with pytest.raises(ValueError, match="Employer cannot apply as candidate"):
        sim.submit_interview_response(sender="employer", job_id=job_id, interview_response_url="https://agent.ai/solution")

    # Invalid URL scheme fails
    with pytest.raises(ValueError, match="Valid public interview solution URL"):
        sim.submit_interview_response(sender="candidate", job_id=job_id, interview_response_url="ftp://agent.ai/repo")

    # Valid submission transitions to IN_INTERVIEW
    sim.submit_interview_response(sender="candidate", job_id=job_id, interview_response_url="https://agent.ai/case-study-v1")
    assert sim.jobs[job_id]["status"] == 1
    assert sim.jobs[job_id]["candidate_agent"] == "candidate"

    # Cannot apply again to already applied job
    with pytest.raises(ValueError, match="not open for interview submission"):
        sim.submit_interview_response(sender="third_party", job_id=job_id, interview_response_url="https://other.ai/test")


def test_cooling_off_and_finalize_hired(mock_hired_interview_response):
    """Test initial adjudication transitions to AUDIT_COMPLETED (status 7), then finalizes after cooling-off."""
    sim = MockAgentTalentSimulator()
    job_id = sim.post_job_bounty(
        sender="employer",
        value=500,
        job_description="Design high-frequency MEV protection agent with dynamic routing."
    )
    sim.submit_interview_response(sender="candidate", job_id=job_id, interview_response_url="https://agent.ai/mev-protect")

    data = json.loads(mock_hired_interview_response["llm_response"])

    # 1. Adjudication sets status 7 (AUDIT_COMPLETED). Funds are still locked in escrow!
    sim.adjudicate_interview(
        job_id=job_id,
        verdict=data["verdict"],
        reason=data["reason"],
        confidence=data["confidence"],
        competency_score=data["competency_score"]
    )
    assert sim.jobs[job_id]["status"] == 7
    assert sim.total_talent_locked == 500  # Crucial: Not deducted yet!
    assert sim.balances["candidate"] == 100 # Not disbursed yet!

    # 2. Premature finalize within 30 blocks is BLOCKED
    with pytest.raises(ValueError, match="Appeal cooling-off window .* is still active"):
        sim.finalize_settlement(job_id=job_id, current_block=sim.jobs[job_id]["audit_completed_block"] + 10)

    # 3. Finalize after 30 blocks cooling-off succeeds safely
    sim.finalize_settlement(job_id=job_id, current_block=sim.jobs[job_id]["audit_completed_block"] + 35)
    assert sim.jobs[job_id]["status"] == 2  # HIRED_PAID
    assert sim.balances["candidate"] == 600 # 100 + 500
    assert sim.total_talent_locked == 0
    assert sim.total_hires_completed == 1


def test_appeal_flow_with_bond_and_slashing():
    """Verify appellant must stake 10% bond, and appeal adjudication settles fairly."""
    sim = MockAgentTalentSimulator()
    job_id = sim.post_job_bounty(
        sender="employer",
        value=400,
        job_description="Implement cross-chain collateral monitoring agent."
    )
    sim.submit_interview_response(sender="candidate", job_id=job_id, interview_response_url="https://agent.ai/collateral")

    # Initial adjudication rejects candidate
    sim.adjudicate_interview(job_id=job_id, verdict="CANDIDATE_REJECTED", reason="Insufficient invariant checks", confidence=85, competency_score=45)
    assert sim.jobs[job_id]["status"] == 7
    audit_block = sim.jobs[job_id]["audit_completed_block"]

    # Third party cannot appeal
    with pytest.raises(PermissionError):
        sim.appeal_verdict(sender="third_party", job_id=job_id, new_evidence_url="https://agent.ai/appeal", bond_value=40, current_block=audit_block + 5)

    # Insufficient bond (< 10% = 40) fails
    with pytest.raises(ValueError, match="Appeal bond insufficient"):
        sim.appeal_verdict(sender="candidate", job_id=job_id, new_evidence_url="https://agent.ai/appeal", bond_value=20, current_block=audit_block + 5)

    # Expired appeal (> 30 blocks) fails
    with pytest.raises(ValueError, match="Appeal challenge window has expired"):
        sim.appeal_verdict(sender="candidate", job_id=job_id, new_evidence_url="https://agent.ai/appeal", bond_value=40, current_block=audit_block + 35)

    # Valid appeal by candidate staking 40 wei bond
    sim.appeal_verdict(sender="candidate", job_id=job_id, new_evidence_url="https://agent.ai/appeal_proof", bond_value=40, current_block=audit_block + 15)
    assert sim.jobs[job_id]["status"] == 6  # DISPUTED
    assert sim.balances["candidate"] == 60  # 100 - 40
    assert sim.total_talent_locked == 440   # 400 bounty + 40 bond

    # Senior Board upholds appeal: candidate is hired, receives bounty + bond refund
    sim.adjudicate_appeal(job_id=job_id, appeal_verdict="APPEAL_UPHELD_HIRED", reason="Formal verification proven in new proof.")
    assert sim.jobs[job_id]["status"] == 2  # HIRED_PAID
    assert sim.balances["candidate"] == 60 + 400 + 40  # 500 total!
    assert sim.total_talent_locked == 0
    assert sim.total_hires_completed == 1


def test_cancel_and_reclaim_lifecycle():
    """Verify timelock protections and successful reclamation after expiration."""
    sim = MockAgentTalentSimulator()
    job_id = sim.post_job_bounty(
        sender="employer",
        value=350,
        job_description="Build algorithmic market maker agent with order flow toxicity metric.",
        duration_blocks=100
    )

    # 1. Non-employer cannot reclaim
    with pytest.raises(PermissionError):
        sim.cancel_or_reclaim(sender="third_party", job_id=job_id, current_block=500)

    # 2. Employer cannot cancel before expiration block (created at 1, expires at 101)
    with pytest.raises(ValueError, match="duration has not yet expired"):
        sim.cancel_or_reclaim(sender="employer", job_id=job_id, current_block=50)

    # 3. Employer cancels after expiration block
    sim.cancel_or_reclaim(sender="employer", job_id=job_id, current_block=150)
    assert sim.jobs[job_id]["status"] == 5  # CANCELLED
    assert sim.jobs[job_id]["verdict"] == "CANCELLED"
    assert sim.balances["employer"] == 1000  # 100% refund restored
    assert sim.total_talent_locked == 0
