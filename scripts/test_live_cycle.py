#!/usr/bin/env python3
"""
Test Live On-Chain Execution Cycle on GenLayer Studionet for AgentTalent.
Steps:
1. Employer posts hiring bounty (post_job_bounty).
2. Candidate submits live interview solution URL (submit_interview_response).
3. Executive AI Jury adjudicates the candidate submission (adjudicate_interview).
4. Verify on-chain state, verdict, competency score, and rationale.
"""

import sys
import time
import json
from genlayer_py import create_client, create_account, studionet

CONTRACT_ADDR = "0x637ba7a7CA3a80C06A280b38432B82e59fd79308"

# Employer Account
EMPLOYER_PK = "0x1b807b1df022a40f872596b11565e6b6856547dc66996bd3d5a85b376ea3a0ef"
employer = create_account(EMPLOYER_PK)

# Candidate Account
CANDIDATE_PK = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7dc1a084016e4"
candidate = create_account(CANDIDATE_PK)

client = create_client(chain=studionet, account=employer)

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def main():
    log("=" * 70)
    log("   AGENTTALENT ON-CHAIN FULL TEST CYCLE (STUDIONET: 61999)   ")
    log("=" * 70)
    log(f"Contract Address : {CONTRACT_ADDR}")
    log(f"Employer Address : {employer.address}")
    log(f"Candidate Address: {candidate.address}")

    # Check Balances
    emp_bal = client.get_balance(employer.address) / 1e18
    cand_bal = client.get_balance(candidate.address) / 1e18
    log(f"Employer Balance : {emp_bal:.4f} GEN")
    log(f"Candidate Balance: {cand_bal:.4f} GEN")

    if cand_bal < 0.05:
        log("Funding candidate with faucet...")
        client.fund_account(candidate.address, int(0.5 * 1e18))
        time.sleep(3)
        cand_bal = client.get_balance(candidate.address) / 1e18
        log(f"Candidate Funded : {cand_bal:.4f} GEN")

    # Step 1: Employer Posts Job Bounty
    log("-" * 70)
    log("STEP 1: Employer deposits 0.05 GEN bounty & posts role requirements")
    job_desc = (
        "Senior MEV Arbitrage & Sentinel Agent: Autonomous AI agent capable of multi-hop "
        "cross-DEX spatial arbitrage across Uniswap V3 and Balancer with flash loans, "
        "sub-second mempool monitoring, private relay frontrunning protection, and atomic reversion invariant guards."
    )
    bounty_amount = int(0.05 * 1e18) # 0.05 GEN

    tx1 = client.write_contract(
        address=CONTRACT_ADDR,
        function_name="post_job_bounty",
        account=employer,
        value=bounty_amount,
        args=[job_desc, 5000],
        leader_only=False
    )
    log(f"Transaction 1 submitted (post_job_bounty): {tx1}")
    log("Waiting for receipt...")
    receipt1 = client.wait_for_transaction_receipt(tx1)
    log(f"Receipt 1 status: {receipt1.get('status')} | Result: {receipt1.get('result')}")

    # Read jobs to find created job_id
    jobs_raw = client.read_contract(address=CONTRACT_ADDR, function_name="get_all_jobs", args=[])
    jobs = json.loads(jobs_raw) if isinstance(jobs_raw, str) else jobs_raw
    log(f"Total jobs on-chain now: {len(jobs)}")
    if not jobs:
        log("ERROR: No jobs returned from contract!")
        sys.exit(1)

    latest_job = jobs[-1]
    job_id = latest_job["job_id"]
    log(f"Target Job Created: {job_id} (Status: {latest_job['status']})")

    # Step 2: Candidate Submits Solution URL
    log("-" * 70)
    log(f"STEP 2: Candidate {candidate.address} submits interview solution")
    solution_url = "https://raw.githubusercontent.com/tuannguyenvan95/AgentTalent/main/solutions/autonomous_arbitrage_agent_solution.md"
    log(f"Solution URL: {solution_url}")

    tx2 = client.write_contract(
        address=CONTRACT_ADDR,
        function_name="submit_interview_response",
        account=candidate,
        value=0,
        args=[job_id, solution_url],
        leader_only=False
    )
    log(f"Transaction 2 submitted (submit_interview_response): {tx2}")
    log("Waiting for receipt...")
    receipt2 = client.wait_for_transaction_receipt(tx2)
    log(f"Receipt 2 status: {receipt2.get('status')} | Result: {receipt2.get('result')}")

    # Verify status changed to 1 (IN_INTERVIEW)
    job_after_submit_raw = client.read_contract(address=CONTRACT_ADDR, function_name="get_job", args=[job_id])
    job_after_submit = json.loads(job_after_submit_raw) if isinstance(job_after_submit_raw, str) else job_after_submit_raw
    log(f"Job Status after submission: {job_after_submit.get('status')} (Expected: 1 = IN_INTERVIEW)")

    # Step 3: Trigger AI Jury Adjudication
    log("-" * 70)
    log(f"STEP 3: Executive AI Hiring Board convening for {job_id}")
    log("Fetching live markdown from GitHub via web.render() and executing subjective consensus...")

    tx3 = client.write_contract(
        address=CONTRACT_ADDR,
        function_name="adjudicate_interview",
        account=employer,
        value=0,
        args=[job_id],
        leader_only=False
    )
    log(f"Transaction 3 submitted (adjudicate_interview): {tx3}")
    log("Awaiting validator consensus and transaction finalization (this executes on-chain LLM)...")
    receipt3 = client.wait_for_transaction_receipt(tx3)
    log(f"Receipt 3 status: {receipt3.get('status')} | Result: {receipt3.get('result')}")

    # Step 4: Tra xét phán xử (Detailed Analysis of the AI Jury Verdict)
    log("-" * 70)
    log("STEP 4: INSPECTING ON-CHAIN ADJUDICATION RESULTS")
    job_final_raw = client.read_contract(address=CONTRACT_ADDR, function_name="get_job", args=[job_id])
    job_final = json.loads(job_final_raw) if isinstance(job_final_raw, str) else job_final_raw

    print("\n" + "=" * 70)
    print("           EXECUTIVE AI HIRING BOARD DELIBERATION RECORD         ")
    print("=" * 70)
    print(f"Job ID                : {job_final.get('job_id')}")
    print(f"Status Code           : {job_final.get('status')} (7 = AUDIT_COMPLETED, Cooling-off Active)")
    print(f"Verdict Rendered      : {job_final.get('verdict')}")
    print(f"Competency Score      : {job_final.get('competency_score')} / 100")
    print(f"Confidence Level      : {job_final.get('confidence')}%")
    print(f"Audit Completed Block : {job_final.get('audit_completed_block')}")
    print(f"Candidate Address     : {job_final.get('candidate_agent')}")
    print(f"Bounty Escrow         : {int(job_final.get('bounty_amount', 0)) / 1e18} GEN")
    print("-" * 70)
    print("Jury Technical Reasoning & Critique:")
    print(job_final.get('reason'))
    print("=" * 70 + "\n")

    # Step 5: Read Aggregated Stats
    stats_raw = client.read_contract(address=CONTRACT_ADDR, function_name="get_stats", args=[])
    stats = json.loads(stats_raw) if isinstance(stats_raw, str) else stats_raw
    log(f"Protocol Stats: Total Jobs: {stats.get('total_jobs')}, Total Locked: {int(stats.get('total_talent_locked', 0)) / 1e18} GEN, Hires: {stats.get('total_hires_completed')}")

if __name__ == "__main__":
    main()
