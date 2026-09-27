import sys
import os
import json
import pytest

# Add contracts to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "contracts")))


class SimulatedAddress:
    def __init__(self, hex_addr: str):
        self.as_hex = hex_addr.lower()

    def __str__(self):
        return self.as_hex

    def __eq__(self, other):
        return str(self).lower() == str(other).lower()


def setup_gl_mock(mock_env):
    """Mocks GenLayer runtime primitives for unit test execution."""
    import types
    gl_module = types.ModuleType("genlayer")

    class UserError(Exception):
        pass

    class ContractStorageBase:
        def __new__(cls, *args, **kwargs):
            instance = super().__new__(cls)
            instance.jobs = {}
            instance.job_ids = []
            return instance

    mock_env.Contract = ContractStorageBase

    gl_module.UserError = UserError
    gl_module.Address = SimulatedAddress
    gl_module.bigint = lambda x: int(x)
    gl_module.u8 = lambda x: int(x)
    gl_module.u32 = lambda x: int(x)
    gl_module.u64 = lambda x: int(x)
    gl_module.u256 = lambda x: int(x)
    gl_module.TreeMap = dict
    gl_module.DynArray = list
    gl_module.allow_storage = lambda cls: cls
    gl_module.Contract = ContractStorageBase
    gl_module.gl = mock_env

    sys.modules["genlayer"] = gl_module

    if "contract" in sys.modules:
        del sys.modules["contract"]

    return gl_module


# =============================================================================
# STATIC CODE QUALITY & GENVM PROTOCOL CONFORMANCE TESTS
# =============================================================================

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
        "appeal_evidence_url: str",
        "status: u8",
        "verdict: str",
        "initial_verdict: str",
        "initial_status: u8",
        "reason: str",
        "confidence: u8",
        "competency_score: u8",
        "created_at_time: u256",
        "expires_at_time: u256",
        "interview_started_time: u256",
        "audit_completed_time: u256",
    ]
    for field in expected_fields:
        assert field in contract_source, f"Missing storage field in JobBounty: {field}"

    # Verify NO default assignments in dataclass (Pavel & Joaquin compliance)
    assert 'appeal_reason: str = ""' not in contract_source
    assert 'appeal_count: u8 = u8(0)' not in contract_source


def test_semantic_consensus_rule(contract_source):
    """Verify validator_fn implements Semantic Consensus on verdict instead of byte-equality."""
    assert 'mine["verdict"] == leader["verdict"]' in contract_source


def test_security_canary_token(contract_source):
    """Verify canary token security pattern is declared and verified."""
    assert 'CANARY_TOKEN = "CANARY_AGENT_TALENT_V1"' in contract_source
    assert 'canary' in contract_source


# =============================================================================
# TEST 1: Elapsed-Time Settlement and Manipulation-Resistant Lifecycle Clock
# =============================================================================

def test_elapsed_time_settlement_and_cooling_off_window(mock_gl_env):
    """
    Steward Requirement 1 & 3:
    Verifies that settlement strictly enforces the 5-minute cooling-off window.
    Premature settlement reverts; extraneous transactions cannot advance time;
    advancing time past 300 seconds allows settlement to disburse funds.
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    # 1. Post job
    mock_gl_env.message.sender_address = employer_addr
    bounty_val = 1_000_000_000_000_000_000  # 1 GEN
    mock_gl_env.message.value = bounty_val
    job_id = app.post_job_bounty("Architect high-frequency DEX arbitrage agent with sub-second execution", 86400)
    assert job_id == "talent-1"
    assert app.total_talent_locked == bounty_val

    # 2. Candidate applies
    mock_gl_env.message.sender_address = candidate_addr
    mock_gl_env.message.value = 0
    sol_url = "https://gist.githubusercontent.com/candidate/raw/solution.py"
    app.submit_interview_response(job_id, sol_url)

    job_pre = json.loads(app.get_job(job_id))
    assert job_pre["status"] == 1  # IN_INTERVIEW
    assert job_pre["interview_response_url"] == sol_url

    # 3. Adjudicate interview -> Status 7 (AUDIT_COMPLETED)
    app.adjudicate_interview(job_id)
    job_audited = json.loads(app.get_job(job_id))
    assert job_audited["status"] == 7  # AUDIT_COMPLETED
    assert job_audited["verdict"] == "CANDIDATE_HIRED"
    assert job_audited["initial_verdict"] == "CANDIDATE_HIRED"
    assert int(job_audited["audit_completed_time"]) > 0

    # 4. Premature finalize settlement MUST REVERT within 300s cooling-off window
    with pytest.raises(Exception, match="cooling-off window"):
        app.finalize_settlement(job_id)

    # 5. Extraneous transactions cannot advance time
    mock_gl_env.message.sender_address = employer_addr
    mock_gl_env.message.value = 500_000_000_000_000_000
    app.post_job_bounty("Extraneous job to test that state changes don't tick the clock", 86400)

    with pytest.raises(Exception, match="cooling-off window"):
        app.finalize_settlement(job_id)

    # 6. Advance consensus time by 301 seconds (past 300s / 5min window)
    mock_gl_env.advance_time(301)
    app.finalize_settlement(job_id)

    job_settled = json.loads(app.get_job(job_id))
    assert job_settled["status"] == 2  # HIRED_PAID
    assert job_settled["verdict"] == "CANDIDATE_HIRED"

    # Candidate received 100% of escrow
    transfers = mock_gl_env.get_contract_at(candidate_addr).transfers
    assert len(transfers) == 1
    assert transfers[0]["value"] == bounty_val


# =============================================================================
# TEST 2: RPC / Client Boundary Conformance
# =============================================================================

def test_rpc_client_boundary_schema(mock_gl_env):
    """
    Steward Requirement 3:
    Validates the RPC boundary returns valid JSON matching the exact client interface:
    JobBountyData schema fields including timestamp lifecycles and initial verdicts.
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0x1111111111111111111111111111111111111111")
    candidate_addr = SimulatedAddress("0x2222222222222222222222222222222222222222")

    mock_gl_env.message.sender_address = employer_addr
    mock_gl_env.message.value = 2_000_000_000_000_000_000
    job_id = app.post_job_bounty("Cross-chain liquidity aggregator and flashloan agent specification", 86400)

    # 1. get_job schema check
    job_raw = app.get_job(job_id)
    assert isinstance(job_raw, str)
    data = json.loads(job_raw)

    expected_keys = {
        "job_id", "employer", "candidate_agent", "dispute_initiator",
        "bounty_amount", "dispute_bond", "job_description",
        "interview_response_url", "appeal_evidence_url",
        "status", "verdict", "initial_verdict", "initial_status",
        "reason", "confidence", "competency_score",
        "created_at_time", "expires_at_time", "interview_started_time", "audit_completed_time"
    }
    for k in expected_keys:
        assert k in data, f"Missing key in get_job RPC response: {k}"

    assert isinstance(data["job_id"], str)
    assert isinstance(data["bounty_amount"], str)
    assert isinstance(data["status"], int)
    assert isinstance(data["confidence"], int)
    assert isinstance(data["competency_score"], int)

    # 2. get_all_jobs schema check
    all_jobs_raw = app.get_all_jobs()
    all_jobs = json.loads(all_jobs_raw)
    assert isinstance(all_jobs, list)
    assert len(all_jobs) == 1
    assert all_jobs[0]["job_id"] == job_id

    # 3. get_jobs_paginated
    page_raw = app.get_jobs_paginated(0, 10)
    page_jobs = json.loads(page_raw)
    assert len(page_jobs) == 1

    # 4. get_stats
    stats_raw = app.get_stats()
    stats = json.loads(stats_raw)
    assert stats["total_jobs"] == 1
    assert stats["total_talent_locked"] == "2000000000000000000"


# =============================================================================
# TEST 3: Both Appellant Identities & Preserving Initial Evidence
# =============================================================================

def test_both_appellant_identities_and_evidence_preservation(mock_gl_env):
    """
    Steward Requirement 2 & 3:
    Test both appellant identities (Candidate appeals, Employer appeals).
    Verify that calling appeal_verdict preserves original candidate interview_response_url
    and separately records appeal_evidence_url.
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    # Case A: Candidate Agent is Appellant
    mock_gl_env.message.sender_address = employer_addr
    bounty_val = 1_000_000_000_000_000_000
    mock_gl_env.message.value = bounty_val
    jid1 = app.post_job_bounty("Post job 1 for candidate appellant test scenario", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    original_url = "https://candidate.ai/original_solution.py"
    app.submit_interview_response(jid1, original_url)

    # Initial adjudication rejects candidate
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_REJECTED",
        "confidence": 90,
        "competency_score": 30,
        "reason": "Missing proof of reentrancy guard."
    })
    app.adjudicate_interview(jid1)

    j1 = json.loads(app.get_job(jid1))
    assert j1["verdict"] == "CANDIDATE_REJECTED"
    assert j1["initial_verdict"] == "CANDIDATE_REJECTED"

    # Candidate appeals, staking 10% bond
    mock_gl_env.message.sender_address = candidate_addr
    bond_val = 100_000_000_000_000_000  # 10% of 1 GEN
    mock_gl_env.message.value = bond_val
    appeal_url = "https://candidate.ai/appeal_formal_proof.py"
    app.appeal_verdict(jid1, appeal_url)

    j1_disputed = json.loads(app.get_job(jid1))
    assert j1_disputed["status"] == 6  # DISPUTED
    assert j1_disputed["dispute_initiator"] == str(candidate_addr)
    # CRITICAL: Candidate's original URL is PRESERVED, appeal proof stored separately
    assert j1_disputed["interview_response_url"] == original_url
    assert j1_disputed["appeal_evidence_url"] == appeal_url
    assert j1_disputed["dispute_bond"] == str(bond_val)

    # Case B: Employer is Appellant
    mock_gl_env.message.sender_address = employer_addr
    mock_gl_env.message.value = bounty_val
    jid2 = app.post_job_bounty("Post job 2 for employer appellant test scenario", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    mock_gl_env.message.value = 0
    candidate_url_2 = "https://candidate.ai/sol2.py"
    app.submit_interview_response(jid2, candidate_url_2)

    # Initial adjudication hires candidate
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_HIRED",
        "confidence": 95,
        "competency_score": 90,
        "reason": "Outstanding code."
    })
    app.adjudicate_interview(jid2)

    # Employer appeals initial hire, staking 10% bond
    mock_gl_env.message.sender_address = employer_addr
    mock_gl_env.message.value = bond_val
    employer_proof = "https://employer.ai/alleged_plagiarism.pdf"
    app.appeal_verdict(jid2, employer_proof)

    j2_disputed = json.loads(app.get_job(jid2))
    assert j2_disputed["status"] == 6
    assert j2_disputed["dispute_initiator"] == str(employer_addr)
    assert j2_disputed["interview_response_url"] == candidate_url_2
    assert j2_disputed["appeal_evidence_url"] == employer_proof


# =============================================================================
# TEST 4: Appeal Rejection Restores Initial HIRED Outcome & Slashes Bond
# =============================================================================

def test_appeal_rejected_restores_initial_hired_outcome(mock_gl_env):
    """
    Steward Requirement 2 & 3:
    Initial verdict was CANDIDATE_HIRED.
    Employer appeals with plagiarism claims.
    Appeal is rejected -> RESTORES CANDIDATE_HIRED (status 2).
    Candidate receives 100% escrow bounty + Employer's slashed dispute bond!
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    # 1. Post & Apply
    mock_gl_env.message.sender_address = employer_addr
    escrow_val = 1_000_000_000_000_000_000
    mock_gl_env.message.value = escrow_val
    job_id = app.post_job_bounty("MEV protection routing agent", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    app.submit_interview_response(job_id, "https://candidate.ai/sol.py")

    # 2. Adjudicate -> CANDIDATE_HIRED
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_HIRED",
        "confidence": 95,
        "competency_score": 92,
        "reason": "Superb solution."
    })
    app.adjudicate_interview(job_id)

    j = json.loads(app.get_job(job_id))
    assert j["initial_verdict"] == "CANDIDATE_HIRED"

    # 3. Employer appeals
    mock_gl_env.message.sender_address = employer_addr
    bond_val = 100_000_000_000_000_000
    mock_gl_env.message.value = bond_val
    app.appeal_verdict(job_id, "https://employer.ai/evidence.pdf")

    # 4. Appellate court rejects appeal
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "APPEAL_DISMISSED",
        "confidence": 90,
        "competency_score": 10,
        "reason": "Allegation unproven; candidate code verified original."
    })
    app.adjudicate_appeal(job_id)

    j_final = json.loads(app.get_job(job_id))
    assert j_final["status"] == 2  # HIRED_PAID restored!
    assert j_final["verdict"] == "CANDIDATE_HIRED"

    # Candidate receives 100% escrow (1 GEN) + Employer's dispute bond (0.1 GEN)
    candidate_transfers = mock_gl_env.get_contract_at(candidate_addr).transfers
    assert len(candidate_transfers) == 2
    assert candidate_transfers[0]["value"] == bond_val    # Dispute bond slashed to candidate
    assert candidate_transfers[1]["value"] == escrow_val  # 100% hiring bounty


# =============================================================================
# TEST 5: Appeal Rejection Restores Initial SHORTLISTED Outcome & Slashes Bond
# =============================================================================

def test_appeal_rejected_restores_initial_shortlisted_outcome(mock_gl_env):
    """
    Steward Requirement 2 & 3:
    Initial verdict was CANDIDATE_SHORTLISTED (50/50 split).
    Candidate appeals seeking full hire.
    Appeal is rejected -> RESTORES CANDIDATE_SHORTLISTED (status 4).
    Bounty is split 50% candidate / 50% employer, and Candidate's bond is slashed to Employer!
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    # 1. Post & Apply
    mock_gl_env.message.sender_address = employer_addr
    escrow_val = 1_000_000_000_000_000_000
    mock_gl_env.message.value = escrow_val
    job_id = app.post_job_bounty("Autonomous liquidity rebalancer agent", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    app.submit_interview_response(job_id, "https://candidate.ai/sol.py")

    # 2. Adjudicate -> CANDIDATE_SHORTLISTED
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_SHORTLISTED",
        "confidence": 88,
        "competency_score": 70,
        "reason": "Good baseline, minor gaps in gas optimization."
    })
    app.adjudicate_interview(job_id)

    j = json.loads(app.get_job(job_id))
    assert j["initial_verdict"] == "CANDIDATE_SHORTLISTED"

    # 3. Candidate appeals seeking full hire
    mock_gl_env.message.sender_address = candidate_addr
    bond_val = 100_000_000_000_000_000
    mock_gl_env.message.value = bond_val
    app.appeal_verdict(job_id, "https://candidate.ai/appeal.py")

    # 4. Appellate court rejects candidate's appeal
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "APPEAL_DISMISSED",
        "confidence": 91,
        "competency_score": 68,
        "reason": "No substantial gas optimizations demonstrated in appeal."
    })
    app.adjudicate_appeal(job_id)

    j_final = json.loads(app.get_job(job_id))
    assert j_final["status"] == 4  # SHORTLISTED_PARTIAL restored!
    assert j_final["verdict"] == "CANDIDATE_SHORTLISTED"

    # Dispute bond slashed to Employer (appellee)
    employer_transfers = mock_gl_env.get_contract_at(employer_addr).transfers
    candidate_transfers = mock_gl_env.get_contract_at(candidate_addr).transfers

    assert employer_transfers[0]["value"] == bond_val  # Slashed bond
    assert candidate_transfers[0]["value"] == escrow_val // 2  # 50% partial bounty
    assert employer_transfers[1]["value"] == escrow_val // 2  # 50% refund


# =============================================================================
# TEST 6: Appeal Rejection Restores Initial REJECTED Outcome & Slashes Bond
# =============================================================================

def test_appeal_rejected_restores_initial_rejected_outcome(mock_gl_env):
    """
    Steward Requirement 2 & 3:
    Initial verdict was CANDIDATE_REJECTED (100% refund).
    Candidate appeals.
    Appeal is rejected -> RESTORES CANDIDATE_REJECTED (status 3).
    Employer gets 100% bounty refund + Candidate's slashed dispute bond!
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    # 1. Post & Apply
    mock_gl_env.message.sender_address = employer_addr
    escrow_val = 1_000_000_000_000_000_000
    mock_gl_env.message.value = escrow_val
    job_id = app.post_job_bounty("Automated collateral monitor", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    app.submit_interview_response(job_id, "https://candidate.ai/sol.py")

    # 2. Adjudicate -> CANDIDATE_REJECTED
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_REJECTED",
        "confidence": 99,
        "competency_score": 20,
        "reason": "Superficial template response without working logic."
    })
    app.adjudicate_interview(job_id)

    j = json.loads(app.get_job(job_id))
    assert j["initial_verdict"] == "CANDIDATE_REJECTED"

    # 3. Candidate appeals
    mock_gl_env.message.sender_address = candidate_addr
    bond_val = 100_000_000_000_000_000
    mock_gl_env.message.value = bond_val
    app.appeal_verdict(job_id, "https://candidate.ai/appeal_proof.py")

    # 4. Appeal rejected
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "APPEAL_DISMISSED",
        "confidence": 95,
        "competency_score": 15,
        "reason": "Appeal evidence does not address the required specifications."
    })
    app.adjudicate_appeal(job_id)

    j_final = json.loads(app.get_job(job_id))
    assert j_final["status"] == 3  # REJECTED_REFUNDED restored!
    assert j_final["verdict"] == "CANDIDATE_REJECTED"

    # Employer receives dispute bond + 100% escrow refund
    employer_transfers = mock_gl_env.get_contract_at(employer_addr).transfers
    assert len(employer_transfers) == 2
    assert employer_transfers[0]["value"] == bond_val    # Slashed bond
    assert employer_transfers[1]["value"] == escrow_val  # 100% refund


# =============================================================================
# TEST 7: Symmetric Employer Appeal Upheld (Fraud proven -> NEW_VERDICT_REJECTED)
# =============================================================================

def test_employer_appeal_upheld_rejection(mock_gl_env):
    """
    Symmetric Appeal Handling:
    Initial verdict was CANDIDATE_HIRED.
    Employer appeals with plagiarism proof.
    Senior Board upholds Employer's appeal -> NEW_VERDICT_REJECTED.
    Employer won! Receives 100% bounty refund AND dispute bond refund.
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_gl_env.message.sender_address = employer_addr
    escrow_val = 1_000_000_000_000_000_000
    mock_gl_env.message.value = escrow_val
    job_id = app.post_job_bounty("Symmetric test job", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    app.submit_interview_response(job_id, "https://candidate.ai/sol.py")

    # Initial adjudication hired candidate
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_HIRED",
        "confidence": 95,
        "competency_score": 88,
        "reason": "Initial pass."
    })
    app.adjudicate_interview(job_id)

    # Employer appeals with fraud proof
    mock_gl_env.message.sender_address = employer_addr
    bond_val = 100_000_000_000_000_000
    mock_gl_env.message.value = bond_val
    app.appeal_verdict(job_id, "https://employer.ai/fraud_proof.pdf")

    # Senior Board upholds employer's claim: candidate is rejected
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "NEW_VERDICT_REJECTED",
        "confidence": 96,
        "competency_score": 15,
        "reason": "Plagiarism verified; candidate code stolen."
    })
    app.adjudicate_appeal(job_id)

    j_final = json.loads(app.get_job(job_id))
    assert j_final["status"] == 3  # REJECTED_REFUNDED
    assert j_final["verdict"] == "CANDIDATE_REJECTED"

    # Employer receives both bond refund AND 100% escrow refund!
    emp_transfers = mock_gl_env.get_contract_at(employer_addr).transfers
    assert len(emp_transfers) == 2
    assert emp_transfers[0]["value"] == bond_val    # Bond returned to winning appellant
    assert emp_transfers[1]["value"] == escrow_val  # 100% escrow refund to employer
    # Candidate received nothing
    cand_transfers = mock_gl_env.get_contract_at(candidate_addr).transfers
    assert len(cand_transfers) == 0


# =============================================================================
# TEST 8: Candidate Appeal Upheld (Competency proven -> NEW_VERDICT_HIRED)
# =============================================================================

def test_candidate_appeal_upheld_hired(mock_gl_env):
    """
    Symmetric Appeal Handling:
    Initial verdict was CANDIDATE_REJECTED.
    Candidate appeals with formal invariant proof.
    Senior Board upholds Candidate's appeal -> NEW_VERDICT_HIRED.
    Candidate won! Receives 100% bounty AND dispute bond refund.
    """
    setup_gl_mock(mock_gl_env)
    import contract
    contract.gl = mock_gl_env

    app = contract.Contract()
    employer_addr = SimulatedAddress("0xAAAA111122223333444455556666777788889999")
    candidate_addr = SimulatedAddress("0xBBBB111122223333444455556666777788889999")

    mock_gl_env.message.sender_address = employer_addr
    escrow_val = 1_000_000_000_000_000_000
    mock_gl_env.message.value = escrow_val
    job_id = app.post_job_bounty("Symmetric test job candidate win", 86400)

    mock_gl_env.message.sender_address = candidate_addr
    app.submit_interview_response(job_id, "https://candidate.ai/sol.py")

    # Initial adjudication rejected candidate
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "CANDIDATE_REJECTED",
        "confidence": 85,
        "competency_score": 40,
        "reason": "Missing invariant check."
    })
    app.adjudicate_interview(job_id)

    # Candidate appeals with invariant proof
    mock_gl_env.message.sender_address = candidate_addr
    bond_val = 100_000_000_000_000_000
    mock_gl_env.message.value = bond_val
    app.appeal_verdict(job_id, "https://candidate.ai/invariant_proof.py")

    # Senior Board upholds candidate's appeal
    mock_gl_env.exec_prompt_override = lambda p, rf: json.dumps({
        "canary": "CANARY_AGENT_TALENT_V1",
        "verdict": "NEW_VERDICT_HIRED",
        "confidence": 98,
        "competency_score": 95,
        "reason": "Formal invariant proof verified mathematically."
    })
    app.adjudicate_appeal(job_id)

    j_final = json.loads(app.get_job(job_id))
    assert j_final["status"] == 2  # HIRED_PAID
    assert j_final["verdict"] == "CANDIDATE_HIRED"

    # Candidate receives both bond refund AND 100% escrow bounty!
    cand_transfers = mock_gl_env.get_contract_at(candidate_addr).transfers
    assert len(cand_transfers) == 2
    assert cand_transfers[0]["value"] == bond_val    # Bond returned to winning candidate
    assert cand_transfers[1]["value"] == escrow_val  # 100% escrow bounty

