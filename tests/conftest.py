import pytest
import json
from pathlib import Path

# Paths
CONTRACTS_DIR = Path(__file__).parent.parent / "contracts"
CONTRACT_PATH = CONTRACTS_DIR / "contract.py"


@pytest.fixture(scope="session")
def contract_source() -> str:
    """Load the AgentTalent intelligent contract source code."""
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def mock_hired_interview_response():
    """Mock web solution and LLM response for outstanding candidate agent (CANDIDATE_HIRED)."""
    return {
        "web_content": "EXECUTIVE ARCHITECTURE SPECIFICATION: Multi-Hop Rebalancer Agent. "
                       "1. Implemented slippage guard with dynamic flashloan routing. "
                       "2. Rigorous invariant analysis for zero-slippage arbitrage across Uniswap v3 and Curve. "
                       "3. End-to-end integration tests with sub-second execution latency.",
        "llm_response": json.dumps({
            "canary": "CANARY_AGENT_TALENT_V1",
            "verdict": "CANDIDATE_HIRED",
            "confidence": 95,
            "competency_score": 92,
            "reason": "Exceptional technical architecture and system design. Thoroughly addressed rebalancing edge cases, gas optimization, and formal verification."
        })
    }


@pytest.fixture
def mock_shortlisted_interview_response():
    """Mock web solution and LLM response for promising candidate agent with minor gaps (CANDIDATE_SHORTLISTED)."""
    return {
        "web_content": "AGENT PROPOSAL: Liquidity Management Bot. "
                       "Deploys automated tick range rebalancing. Basic safety stop-loss implemented, "
                       "though edge cases in high-volatility fee tier switching require manual fallback.",
        "llm_response": json.dumps({
            "canary": "CANARY_AGENT_TALENT_V1",
            "verdict": "CANDIDATE_SHORTLISTED",
            "confidence": 88,
            "competency_score": 68,
            "reason": "Competent baseline design and sound logic. Lacks formal multi-hop reentrancy protection, but qualifies for 50% partial interview stipend."
        })
    }


@pytest.fixture
def mock_rejected_interview_response():
    """Mock web solution and LLM response for hollow AI buzzword spam (CANDIDATE_REJECTED)."""
    return {
        "web_content": "AI is the future of blockchain synergies! We harness decentralized quantum neural networks "
                       "to synergize paradigm shifts and optimize web3 growth hacking.",
        "llm_response": json.dumps({
            "canary": "CANARY_AGENT_TALENT_V1",
            "verdict": "CANDIDATE_REJECTED",
            "confidence": 99,
            "competency_score": 15,
            "reason": "Off-topic superficial marketing buzzwords. Zero technical implementation or case study solution provided."
        })
    }
