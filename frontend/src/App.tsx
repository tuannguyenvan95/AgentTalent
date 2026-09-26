import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { JobCard } from './components/JobCard';
import { PostJobModal } from './components/PostJobModal';
import { SubmitInterviewModal } from './components/SubmitInterviewModal';
import { BoardInspectorModal } from './components/BoardInspectorModal';
import {
  getSavedContractAddress,
  saveContractAddress,
  fetchStudionetBalance,
  fetchAllJobs,
  fetchStats,
  ensureStudionet,
  postJobBountyOnChain,
  submitInterviewResponseOnChain,
  adjudicateInterviewOnChain,
  cancelOrReclaimOnChain,
  appealVerdictOnChain,
  adjudicateAppealOnChain,
  finalizeSettlementOnChain,
  JobBountyData,
  ProtocolStats,
} from './config/genlayer';
import {
  Sparkles,
  Search,
  RefreshCw,
  Layers,
  AlertCircle,
  CheckCircle,
  Briefcase,
  Bot,
  Scale,
} from 'lucide-react';

export const App: React.FC = () => {
  // Wallet & Connection
  const [account, setAccount] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [contractAddress, setContractAddress] = useState<string>(getSavedContractAddress());

  // Protocol Data
  const [jobs, setJobs] = useState<JobBountyData[]>([]);
  const [stats, setStats] = useState<ProtocolStats>({
    total_jobs: 0,
    total_talent_locked: '0',
    total_hires_completed: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals & User Interaction
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobBountyData | null>(null);
  const [selectedJobForInspection, setSelectedJobForInspection] = useState<JobBountyData | null>(null);
  const [isProcessingTx, setIsProcessingTx] = useState<boolean>(false);
  const [txToast, setTxToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setTxToast({ message, type });
    setTimeout(() => setTxToast(null), 6000);
  };

  // Connect MetaMask and ensure Studionet
  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      showToast('MetaMask is not installed. Please install MetaMask to interact.', 'error');
      return;
    }

    try {
      setIsConnecting(true);
      await ensureStudionet();
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const bal = await fetchStudionetBalance(accounts[0]);
        setBalance(bal);
        showToast('Wallet connected to GenLayer Studionet.', 'success');
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      showToast(err?.message || 'Failed to connect MetaMask.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet Action
  const handleDisconnectWallet = () => {
    setAccount('');
    setBalance('0.00');
    showToast('Wallet disconnected.', 'info');
  };

  // Fetch contract jobs and aggregated stats directly from Studionet
  const loadProtocolData = useCallback(async () => {
    if (!contractAddress) return;
    try {
      setIsLoading(true);
      const [fetchedJobs, fetchedStats] = await Promise.all([
        fetchAllJobs(contractAddress),
        fetchStats(contractAddress),
      ]);
      setJobs(fetchedJobs);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Error loading protocol data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress]);

  // Handle Contract Address Updates
  const handleUpdateContractAddress = (newAddr: string) => {
    saveContractAddress(newAddr);
    setContractAddress(newAddr);
    showToast(`Contract address updated to ${newAddr}`, 'info');
  };

  // Post Job Action
  const handlePostJob = async (description: string, durationBlocks: number, bountyWei: bigint) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast('Deploying Job Bounty Escrow on Studionet...', 'info');
      await postJobBountyOnChain(contractAddress, account, description, durationBlocks, bountyWei);
      showToast('Hiring Bounty and Case Study published successfully!', 'success');
      await loadProtocolData();
      if (account) {
        const bal = await fetchStudionetBalance(account);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Failed to post job:', err);
      showToast(err?.message || 'Failed to post job bounty.', 'error');
      throw err;
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Submit Interview Solution Action
  const handleSubmitInterview = async (jobId: string, solutionUrl: string) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast(`Submitting candidate solution for ${jobId}...`, 'info');
      await submitInterviewResponseOnChain(contractAddress, account, jobId, solutionUrl);
      showToast('Interview response recorded! Ready for Executive Board review.', 'success');
      await loadProtocolData();
    } catch (err: any) {
      console.error('Failed to submit interview:', err);
      showToast(err?.message || 'Failed to submit interview solution.', 'error');
      throw err;
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Adjudicate Interview Action
  const handleAdjudicateInterview = async (jobId: string) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast(`Executive AI Hiring Board convening for ${jobId}... (Fetching code & running subjective consensus)`, 'info');
      await adjudicateInterviewOnChain(contractAddress, account, jobId);
      showToast('Interview adjudication finalized! Escrow settled on-chain.', 'success');
      await loadProtocolData();
      if (account) {
        const bal = await fetchStudionetBalance(account);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Failed to adjudicate interview:', err);
      showToast(err?.message || 'Failed to adjudicate interview.', 'error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Appeal Verdict Action (10% dispute bond staked by appellant)
  const handleAppealVerdict = async (jobId: string, newEvidenceUrl: string, bondWei: bigint) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast(`Staking 10% appeal bond & filing dispute for ${jobId}...`, 'info');
      await appealVerdictOnChain(contractAddress, account, jobId, newEvidenceUrl, bondWei);
      showToast('Formal dispute filed with 10% bond! Senior Executive Board convened.', 'success');
      await loadProtocolData();
      if (account) {
        const bal = await fetchStudionetBalance(account);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Failed to appeal verdict:', err);
      showToast(err?.message || 'Failed to appeal verdict.', 'error');
      throw err;
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Senior Executive Board Re-Adjudicates Appeal
  const handleAdjudicateAppeal = async (jobId: string) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast(`Senior Executive AI Appeals Board deliberating on ${jobId}...`, 'info');
      await adjudicateAppealOnChain(contractAddress, account, jobId);
      showToast('Appellate decision rendered! Escrow and bond settled on-chain.', 'success');
      await loadProtocolData();
      if (account) {
        const bal = await fetchStudionetBalance(account);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Failed to adjudicate appeal:', err);
      showToast(err?.message || 'Failed to adjudicate appeal.', 'error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Finalize Settlement after 30 blocks cooling-off period
  const handleFinalizeSettlement = async (jobId: string) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast(`Finalizing undisputed settlement for ${jobId}...`, 'info');
      await finalizeSettlementOnChain(contractAddress, account, jobId);
      showToast('Settlement finalized! Escrow released according to verdict.', 'success');
      await loadProtocolData();
      if (account) {
        const bal = await fetchStudionetBalance(account);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Failed to finalize settlement:', err);
      showToast(err?.message || 'Failed to finalize settlement.', 'error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Reclaim Escrow Action
  const handleReclaimEscrow = async (jobId: string) => {
    if (!account) {
      await handleConnectWallet();
      return;
    }
    try {
      setIsProcessingTx(true);
      showToast(`Reclaiming escrow for ${jobId}...`, 'info');
      await cancelOrReclaimOnChain(contractAddress, account, jobId);
      showToast('Escrow successfully reclaimed and refunded to your wallet.', 'success');
      await loadProtocolData();
      if (account) {
        const bal = await fetchStudionetBalance(account);
        setBalance(bal);
      }
    } catch (err: any) {
      console.error('Failed to reclaim escrow:', err);
      showToast(err?.message || 'Failed to reclaim bounty escrow.', 'error');
    } finally {
      setIsProcessingTx(false);
    }
  };

  // Initial load & account change listener
  useEffect(() => {
    loadProtocolData();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchStudionetBalance(accounts[0]).then(setBalance);
        } else {
          setAccount('');
          setBalance('0.00');
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccounts);
      (window as any).ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Auto-connect if already authorized
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            handleAccounts(accounts);
          }
        })
        .catch(() => {});
    }
  }, [loadProtocolData]);

  // Filtering Logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.job_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employer.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'MY_POSTED') {
      return account && job.employer.toLowerCase() === account.toLowerCase();
    }
    if (filterStatus === 'MY_APPLIED') {
      return account && job.candidate_agent.toLowerCase() === account.toLowerCase();
    }
    if (filterStatus === 'OPEN') return job.status === 0;
    if (filterStatus === 'IN_INTERVIEW') return job.status === 1;
    if (filterStatus === 'COOLING_OFF') return job.status === 7;
    if (filterStatus === 'IN_APPEAL') return job.status === 6;
    if (filterStatus === 'HIRED') return job.status === 2;
    if (filterStatus === 'SHORTLISTED') return job.status === 4;
    if (filterStatus === 'REJECTED') return job.status === 3;
    return true;
  });

  const activeJobCount = jobs.filter((j) => j.status === 0 || j.status === 1 || j.status === 6 || j.status === 7).length;

  return (
    <div className="min-h-screen bg-canvas text-sapphire flex flex-col font-sans selection:bg-champagne/20">
      {/* Toast Notification */}
      {txToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up">
          <div
            className={`p-4 rounded-xl border shadow-executive-hover flex items-center space-x-3 ${
              txToast.type === 'success'
                ? 'bg-sage-soft border-sage text-sage'
                : txToast.type === 'error'
                ? 'bg-bordeaux-soft border-bordeaux text-bordeaux'
                : 'bg-surface border-borderline text-sapphire'
            }`}
          >
            {txToast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {txToast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {txToast.type === 'info' && <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />}
            <span className="text-xs font-medium">{txToast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        account={account}
        balance={balance}
        isConnecting={isConnecting}
        contractAddress={contractAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onPostJobClick={() => setIsPostModalOpen(true)}
        onUpdateContractAddress={handleUpdateContractAddress}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Executive Hero Banner */}
        <div className="relative mb-8 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-sapphire via-sapphire to-sapphire-dark text-white shadow-executive overflow-hidden border border-sapphire-light">
          {/* Subtle geometric luxury patterns */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-champagne/10 blur-3xl pointer-events-none"></div>
          <div className="absolute right-12 bottom-0 w-64 h-64 border border-champagne/10 rounded-full pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-champagne/30 text-champagne text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-champagne" />
              <span>Future of Autonomous Agent Work • GenLayer Studionet</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold font-serif-title tracking-tight text-white leading-tight">
              Autonomous AI Agent Headhunting & Interview Bounty Escrow
            </h1>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-sans">
              Hire high-performance AI agents without fraud risk. Employers lock GEN bounty escrows; candidate agents submit live system designs; and GenLayer's on-chain Executive AI Jury audits candidate reasoning through subjective consensus with formal dispute protection.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="px-5 py-2.5 rounded-lg bg-champagne hover:bg-champagne-dark text-sapphire text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-sapphire" />
                <span>Post Role & Lock Bounty</span>
              </button>

              <button
                onClick={() => {
                  const openSection = document.getElementById('listings-section');
                  openSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold tracking-wide border border-white/20 transition flex items-center space-x-2"
              >
                <span>Browse Talent Registry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Aggregated Protocol Metrics */}
        <StatsBar stats={stats} activeCount={activeJobCount} />

        {/* Role-Based Quick Filter Bar */}
        <div className="mb-6 p-3 rounded-xl bg-surface border border-borderline shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sapphire text-[11px] uppercase tracking-wider">
              Role Views:
            </span>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filterStatus === 'ALL'
                  ? 'bg-sapphire text-white shadow-sm'
                  : 'bg-canvas hover:bg-canvas-warm text-sapphire/80'
              }`}
            >
              All Roles ({jobs.length})
            </button>
            {account && (
              <>
                <button
                  onClick={() => setFilterStatus('MY_POSTED')}
                  className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                    filterStatus === 'MY_POSTED'
                      ? 'bg-sapphire text-white shadow-sm'
                      : 'bg-canvas hover:bg-canvas-warm text-sapphire/80'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>My Posted Bounties ({jobs.filter((j) => j.employer.toLowerCase() === account.toLowerCase()).length})</span>
                </button>
                <button
                  onClick={() => setFilterStatus('MY_APPLIED')}
                  className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center space-x-1.5 ${
                    filterStatus === 'MY_APPLIED'
                      ? 'bg-sapphire text-white shadow-sm'
                      : 'bg-canvas hover:bg-canvas-warm text-sapphire/80'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>My Applications ({jobs.filter((j) => j.candidate_agent.toLowerCase() === account.toLowerCase()).length})</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-sapphire/60">
            <Scale className="w-3.5 h-3.5 text-champagne-dark" />
            <span>Subjective Consensus • 1-Appeal Dispute Protection</span>
          </div>
        </div>

        {/* Listings Registry Section */}
        <section id="listings-section" className="space-y-6">
          {/* Section Header & Search/Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-borderline">
            <div>
              <h2 className="text-xl font-bold font-serif-title text-sapphire">
                Executive Agent Registry
              </h2>
              <p className="text-xs text-sapphire/60">
                Live recruitment mandates, case study submissions, and on-chain jury deliberations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-sapphire/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search role, ID, or criteria..."
                  className="pl-9 pr-3 py-1.5 rounded-lg border border-borderline focus:border-sapphire text-xs bg-surface w-48 sm:w-64 placeholder:text-sapphire/40"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 rounded-lg bg-canvas-warm border border-borderline text-[11px] font-medium text-sapphire/70 overflow-x-auto">
                {['ALL', 'OPEN', 'IN_INTERVIEW', 'COOLING_OFF', 'IN_APPEAL', 'HIRED', 'SHORTLISTED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                      filterStatus === st
                        ? 'bg-surface text-sapphire font-bold shadow-sm'
                        : 'hover:text-sapphire'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All'
                      : st === 'IN_INTERVIEW'
                      ? 'In Review'
                      : st === 'COOLING_OFF'
                      ? 'Cooling-off'
                      : st === 'IN_APPEAL'
                      ? 'In Appeal'
                      : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadProtocolData}
                disabled={isLoading}
                className="p-2 rounded-lg border border-borderline bg-surface hover:bg-canvas text-sapphire/70 transition"
                title="Refresh listings"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Jobs Grid */}
          {isLoading && jobs.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-champagne-dark animate-spin mx-auto" />
              <p className="text-xs text-sapphire/60">Hydrating live mandates from GenLayer Studionet...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-surface rounded-2xl border border-borderline p-8">
              <div className="w-12 h-12 rounded-xl bg-champagne-soft text-champagne-dark flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif-title text-sapphire">
                  No Mandates Found
                </h3>
                <p className="text-xs text-sapphire/60 max-w-sm mx-auto mt-1">
                  {jobs.length === 0
                    ? 'No recruitment bounties have been published to this contract yet. Be the first to post a role!'
                    : 'No jobs match your current search and filter criteria.'}
                </p>
              </div>
              {jobs.length === 0 && (
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-sapphire text-white text-xs font-semibold shadow hover:bg-sapphire-light transition"
                >
                  Post First Hiring Bounty
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  currentUserAddress={account}
                  onApplyClick={(j) => setSelectedJobForApply(j)}
                  onInspectClick={(j) => setSelectedJobForInspection(j)}
                  onAdjudicateClick={handleAdjudicateInterview}
                  onReclaimClick={handleReclaimEscrow}
                  isProcessing={isProcessingTx}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-surface border-t border-borderline py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sapphire/60">
          <div className="flex items-center space-x-2">
            <span className="font-display-luxury font-bold text-sapphire">AgentTalent Protocol</span>
            <span>•</span>
            <span>Swiss Corporate Modern Autonomous Recruitment</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sapphire hover:underline"
            >
              GenLayer Studio
            </a>
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sapphire hover:underline"
            >
              Protocol Docs
            </a>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-canvas border border-borderline">
              studionet:61999
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PostJobModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handlePostJob}
        userBalance={balance}
      />

      <SubmitInterviewModal
        job={selectedJobForApply}
        isOpen={!!selectedJobForApply}
        onClose={() => setSelectedJobForApply(null)}
        onSubmit={handleSubmitInterview}
        currentUserAddress={account}
      />

      <BoardInspectorModal
        job={selectedJobForInspection}
        isOpen={!!selectedJobForInspection}
        onClose={() => setSelectedJobForInspection(null)}
        onAdjudicate={handleAdjudicateInterview}
        onAppealVerdict={handleAppealVerdict}
        onAdjudicateAppeal={handleAdjudicateAppeal}
        onFinalizeSettlement={handleFinalizeSettlement}
        isProcessing={isProcessingTx}
        currentUserAddress={account}
      />
    </div>
  );
};

export default App;
