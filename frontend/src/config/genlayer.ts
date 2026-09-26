import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { formatGen } from '../utils/helpers';

export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_ID_HEX = '0xf22f'; // 61999 in hex
export const STUDIONET_RPC_URL = 'https://studio.genlayer.com/api';
export const STUDIO_URL = 'https://studio.genlayer.com';

// Default contract address (can be updated via UI or localStorage)
export const DEFAULT_CONTRACT_ADDRESS = '0x637ba7a7CA3a80C06A280b38432B82e59fd79308';

export function getSavedContractAddress(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('agenttalent_contract_address');
      if (stored && stored.trim().startsWith('0x')) {
        return stored.trim();
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_CONTRACT_ADDRESS;
}

export function saveContractAddress(address: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agenttalent_contract_address', address.trim());
  }
}

/**
 * Fetch real on-chain GEN balance directly from Studionet RPC endpoint or MetaMask
 */
export async function fetchStudionetBalance(address: string): Promise<string> {
  if (!address) return '0.00';

  // Priority 1: Direct RPC to Studionet node
  try {
    const res = await fetch(STUDIONET_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: Date.now(),
      }),
    });
    const json = await res.json();
    if (json && json.result !== undefined && json.result !== null) {
      return formatGen(json.result);
    }
  } catch (err) {
    console.warn('Direct Studionet RPC eth_getBalance error:', err);
  }

  // Priority 2: MetaMask provider if connected to Studionet
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    try {
      const currentChainHex = await (window as any).ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(currentChainHex, 16);
      if (currentChainId === STUDIONET_CHAIN_ID) {
        const balHex = await (window as any).ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        if (balHex) {
          return formatGen(balHex);
        }
      }
    } catch (e) {
      console.warn('MetaMask eth_getBalance error:', e);
    }
  }

  return '0.00';
}

export interface JobBountyData {
  job_id: string;
  employer: string;
  candidate_agent: string;
  dispute_initiator: string;
  bounty_amount: string;
  dispute_bond: string;
  job_description: string;
  interview_response_url: string;
  status: number; // 0: OPEN, 1: IN_INTERVIEW, 2: HIRED_PAID, 3: REJECTED_REFUNDED, 4: SHORTLISTED_PARTIAL, 5: CANCELLED, 6: DISPUTED, 7: AUDIT_COMPLETED
  verdict: string; // "PENDING", "CANDIDATE_HIRED", "CANDIDATE_SHORTLISTED", "CANDIDATE_REJECTED", "DISPUTED", "CANCELLED"
  reason: string;
  confidence: number;
  competency_score: number;
  created_at_block?: string;
  expires_at_block?: string;
  interview_started_block?: string;
  audit_completed_block?: string;
}

export interface ProtocolStats {
  total_jobs: number;
  total_talent_locked: string;
  total_hires_completed: number;
}

/**
 * Get GenLayer client. If account and provider are passed, can sign write transactions.
 */
export function getGenLayerClient(accountAddress?: string) {
  const config: any = {
    chain: studionet,
    endpoint: STUDIONET_RPC_URL,
  };

  if (typeof window !== 'undefined' && (window as any).ethereum && accountAddress) {
    config.provider = (window as any).ethereum;
    config.account = accountAddress as `0x${string}`;
  }

  return createClient(config);
}

/**
 * Switch or add GenLayer Studionet chain in MetaMask (Chain ID: 61999 / 0xf22f)
 */
export async function ensureStudionet(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use AgentTalent.');
  }

  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    if (
      switchError.code === 4902 ||
      switchError?.data?.originalError?.code === 4902 ||
      switchError?.message?.includes('Unrecognized chain') ||
      switchError?.message?.includes('wallet_addEthereumChain')
    ) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: STUDIONET_CHAIN_ID_HEX,
              chainName: 'GenLayer Studionet',
              nativeCurrency: {
                name: 'GEN',
                symbol: 'GEN',
                decimals: 18,
              },
              rpcUrls: [STUDIONET_RPC_URL],
              blockExplorerUrls: ['https://genlayer-explorer.vercel.app'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Studionet chain to MetaMask:', addError);
        throw addError;
      }
    }
    console.error('Failed to switch to Studionet chain:', switchError);
    throw switchError;
  }
}

/**
 * Fetch aggregated protocol stats from contract
 */
export async function fetchStats(contractAddress: string): Promise<ProtocolStats> {
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    return {
      total_jobs: 0,
      total_talent_locked: '0',
      total_hires_completed: 0,
    };
  }

  try {
    const client = getGenLayerClient();
    const raw = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_stats',
      args: [],
    });

    if (typeof raw === 'string') {
      return JSON.parse(raw);
    }
    return raw as unknown as ProtocolStats;
  } catch (err) {
    console.warn('fetchStats error:', err);
    return {
      total_jobs: 0,
      total_talent_locked: '0',
      total_hires_completed: 0,
    };
  }
}

/**
 * Fetch all Job Bounties registered in the contract
 */
export async function fetchAllJobs(contractAddress: string): Promise<JobBountyData[]> {
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    return [];
  }

  const client = getGenLayerClient();

  // Fast path: try get_all_jobs()
  try {
    const rawAll = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_all_jobs',
      args: [],
    });
    if (rawAll) {
      const parsed: JobBountyData[] = typeof rawAll === 'string' ? JSON.parse(rawAll) : rawAll;
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to sequential index reads
  }

  // Fallback path: count + get_job_id_by_index + get_job
  try {
    const countRaw = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_job_count',
      args: [],
    });

    const count = Number(countRaw);
    if (isNaN(count) || count <= 0) return [];

    const jobs: JobBountyData[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const jobId = (await client.readContract({
          address: contractAddress as `0x${string}`,
          functionName: 'get_job_id_by_index',
          args: [i],
        })) as string;

        if (jobId) {
          const rawJob = await client.readContract({
            address: contractAddress as `0x${string}`,
            functionName: 'get_job',
            args: [jobId],
          });

          const parsed: JobBountyData = typeof rawJob === 'string' ? JSON.parse(rawJob) : rawJob;
          jobs.push(parsed);
        }
      } catch (err) {
        console.error(`Error reading job index ${i}:`, err);
      }
    }

    return jobs;
  } catch (err) {
    console.warn('fetchAllJobs error:', err);
    return [];
  }
}

/**
 * Fetch a single job by ID
 */
export async function fetchJob(contractAddress: string, jobId: string): Promise<JobBountyData | null> {
  try {
    const client = getGenLayerClient();
    const rawJob = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_job',
      args: [jobId],
    });
    return typeof rawJob === 'string' ? JSON.parse(rawJob) : (rawJob as unknown as JobBountyData);
  } catch (e) {
    console.error(`Error loading job ${jobId}:`, e);
    return null;
  }
}

/**
 * Post job bounty and lock native GEN escrow (Employer)
 */
export async function postJobBountyOnChain(
  contractAddress: string,
  userAddress: string,
  jobDescription: string,
  durationBlocks: number,
  bountyWei: bigint
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'post_job_bounty',
    args: [jobDescription.trim(), durationBlocks],
    value: bountyWei,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * AI Agent candidate submits solution URL
 */
export async function submitInterviewResponseOnChain(
  contractAddress: string,
  userAddress: string,
  jobId: string,
  interviewResponseUrl: string
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'submit_interview_response',
    args: [jobId, interviewResponseUrl.trim()],
    value: 0n,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Trigger Executive AI Hiring Board interview adjudication
 */
export async function adjudicateInterviewOnChain(
  contractAddress: string,
  userAddress: string,
  jobId: string
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'adjudicate_interview',
    args: [jobId],
    value: 0n,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Reclaim escrowed bounty if expired or stalled (Employer only)
 */
export async function cancelOrReclaimOnChain(
  contractAddress: string,
  userAddress: string,
  jobId: string
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'cancel_or_reclaim',
    args: [jobId],
    value: 0n,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Appellant stakes 10% bond and files new evidence URL within 30 blocks
 */
export async function appealVerdictOnChain(
  contractAddress: string,
  userAddress: string,
  jobId: string,
  newEvidenceUrl: string,
  bondWei: bigint
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'appeal_verdict',
    args: [jobId, newEvidenceUrl.trim()],
    value: bondWei,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Senior Executive Board reviews appealed interview solution
 */
export async function adjudicateAppealOnChain(
  contractAddress: string,
  userAddress: string,
  jobId: string
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'adjudicate_appeal',
    args: [jobId],
    value: 0n,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Finalizes non-contested payout after 30 blocks appeal cooling-off window
 */
export async function finalizeSettlementOnChain(
  contractAddress: string,
  userAddress: string,
  jobId: string
): Promise<string> {
  await ensureStudionet();
  const client = getGenLayerClient(userAddress);

  const txHash = await client.writeContract({
    address: contractAddress as `0x${string}`,
    functionName: 'finalize_settlement',
    args: [jobId],
    value: 0n,
  });

  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}


