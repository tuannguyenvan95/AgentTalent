import pytest
import json
import calendar
from datetime import datetime, timezone, timedelta
from pathlib import Path

CONTRACTS_DIR = Path(__file__).parent.parent / "contracts"
CONTRACT_PATH = CONTRACTS_DIR / "contract.py"


@pytest.fixture(scope="session")
def contract_source() -> str:
    """Load the AgentTalent intelligent contract source code."""
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        return f.read()


class MockReturn:
    def __init__(self, calldata):
        self.calldata = calldata


class MockMessage:
    def __init__(self, sender_address="0x1111111111111111111111111111111111111111", value=0):
        self.sender_address = sender_address
        self.value = value


class MockTransferContract:
    def __init__(self, address):
        self.address = address
        self.transfers = []

    def emit_transfer(self, value):
        self.transfers.append({"to": self.address, "value": value})
        return True


class MockWeb:
    def __init__(self, mock_responses=None):
        self.mock_responses = mock_responses or {}

    def render(self, url, mode="text"):
        if url in self.mock_responses:
            return self.mock_responses[url]
        return """
EXECUTIVE SOLUTION: High-Frequency Cross-DEX Arbitrage Agent
- Full invariant verification across Uniswap v3 and Curve
- Dynamic flashloan routing with zero slippage
- Sub-second latency execution
"""


class MockGenVM:
    Return = MockReturn

    def run_nondet(self, leader_fn, validator_fn):
        leader_res = leader_fn()
        ret = MockReturn(leader_res)
        valid = validator_fn(ret)
        if not valid:
            raise RuntimeError("Consensus validator rejected leader output")
        return leader_res


class MockPublicWrite:
    def __call__(self, fn):
        return fn

    @property
    def payable(self):
        return lambda fn: fn


class MockPublic:
    def __init__(self):
        self.write = MockPublicWrite()
        self.view = lambda fn: fn


class MockContractBase:
    pass


class MockGenLayerEnv:
    def __init__(self):
        self.Contract = MockContractBase
        self.public = MockPublic()
        self.message = MockMessage()
        self.current_dt = datetime(2026, 9, 27, 12, 0, 0, tzinfo=timezone.utc)
        self.message_raw = {"datetime": self.current_dt.isoformat()}
        self.nondet = type("NonDet", (), {})()
        self.vm = MockGenVM()
        self.contracts = {}
        self.UserError = Exception

        self.nondet.web = MockWeb()
        self.exec_prompt_override = None

        def exec_prompt_fn(prompt, response_format=None):
            if self.exec_prompt_override:
                return self.exec_prompt_override(prompt, response_format)
            
            # Default intelligent response based on prompt contents
            if "INITIAL VERDICT UNDER REVIEW" in prompt:
                # Appellate court
                return json.dumps({
                    "canary": "CANARY_AGENT_TALENT_V1",
                    "verdict": "APPEAL_DISMISSED",
                    "confidence": 92,
                    "competency_score": 25,
                    "reason": "Appellate review found new evidence insufficient to overturn initial ruling."
                })
            else:
                # Initial interview evaluation
                return json.dumps({
                    "canary": "CANARY_AGENT_TALENT_V1",
                    "verdict": "CANDIDATE_HIRED",
                    "confidence": 95,
                    "competency_score": 90,
                    "reason": "Outstanding technical architecture and verified invariant checks."
                })

        self.nondet.exec_prompt = exec_prompt_fn

    def advance_time(self, seconds: int):
        self.current_dt += timedelta(seconds=seconds)
        self.message_raw = {"datetime": self.current_dt.isoformat()}

    def get_contract_at(self, address):
        addr_key = str(address)
        if addr_key not in self.contracts:
            self.contracts[addr_key] = MockTransferContract(address)
        return self.contracts[addr_key]


@pytest.fixture
def mock_gl_env():
    return MockGenLayerEnv()
