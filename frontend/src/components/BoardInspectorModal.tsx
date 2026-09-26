import React, { useState } from 'react';
import {
  X,
  Award,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Cpu,
  BarChart2,
  Scale,
  Lock,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Coins,
  Check,
  Clock,
} from 'lucide-react';
import { JobBountyData } from '../config/genlayer';
import { formatGen, getStatusMeta, getCompetencyLevel, shortenAddress } from '../utils/helpers';

interface BoardInspectorModalProps {
  job: JobBountyData | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjudicate?: (jobId: string) => Promise<void>;
  onAppealVerdict?: (jobId: string, newEvidenceUrl: string, bondWei: bigint) => Promise<void>;
  onAdjudicateAppeal?: (jobId: string) => Promise<void>;
  onFinalizeSettlement?: (jobId: string) => Promise<void>;
  isProcessing?: boolean;
  currentUserAddress?: string;
}

export const BoardInspectorModal: React.FC<BoardInspectorModalProps> = ({
  job,
  isOpen,
  onClose,
  onAdjudicate,
  onAppealVerdict,
  onAdjudicateAppeal,
  onFinalizeSettlement,
  isProcessing = false,
  currentUserAddress = '',
}) => {
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const statusMeta = getStatusMeta(job.status);
  const competency = getCompetencyLevel(job.competency_score);

  const isInitialAuditWaiting = job.status === 1;
  const isAuditCompleted = job.status === 7; // In 30-block cooling-off window
  const isDisputed = job.status === 6;
  const isSettled = job.status === 2 || job.status === 3 || job.status === 4;

  const isEmployer = currentUserAddress && currentUserAddress.toLowerCase() === job.employer.toLowerCase();
  const isCandidate = currentUserAddress && currentUserAddress.toLowerCase() === job.candidate_agent.toLowerCase();
  const isParticipant = isEmployer || isCandidate;

  // Calculate required 10% appeal bond in bigint
  const bountyBigInt = BigInt(job.bounty_amount || '0');
  const requiredBondWei = (bountyBigInt * 10n) / 100n > 0n ? (bountyBigInt * 10n) / 100n : 1n;

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppealError(null);
    const clean = newEvidenceUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setAppealError('Please provide a valid public HTTP or HTTPS URL for your appeal evidence.');
      return;
    }
    if (!onAppealVerdict) return;

    try {
      setIsSubmittingAppeal(true);
      await onAppealVerdict(job.job_id, clean, requiredBondWei);
      setShowAppealForm(false);
    } catch (err: any) {
      setAppealError(err?.message || 'Failed to submit appeal.');
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  // SVG Circular Meter calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (job.competency_score / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sapphire/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-3xl rounded-2xl border border-borderline shadow-executive-hover overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-surface border-b border-borderline flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sapphire flex items-center justify-center text-champagne border border-champagne/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold font-serif-title text-sapphire">
                  Executive AI Hiring Board Inspection
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-canvas border border-borderline text-sapphire/70">
                  {job.job_id}
                </span>
              </div>
              <p className="text-xs text-sapphire/60">
                On-Chain Subjective Consensus & Competency Forensic Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sapphire/50 hover:text-sapphire hover:bg-canvas transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Lifecycle Stepper */}
          <div className="p-4 rounded-xl bg-canvas border border-borderline">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-sapphire/50 mb-3">
              Recruitment & Adjudication Lifecycle
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-sapphire text-white flex items-center justify-center text-[10px] font-bold mb-1 shadow-sm">
                  ✓
                </div>
                <span className="font-semibold text-sapphire text-[11px]">1. Bounty Escrow</span>
                <span className="text-[10px] text-sapphire/50">Locked on-chain</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-sm ${
                    job.status >= 1 ? 'bg-sapphire text-white' : 'bg-borderline text-sapphire/40'
                  }`}
                >
                  {job.status >= 1 ? '✓' : '2'}
                </div>
                <span className="font-semibold text-sapphire text-[11px]">2. Solution Submitted</span>
                <span className="text-[10px] text-sapphire/50">Scraped via GenVM</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-sm ${
                    job.status === 7
                      ? 'bg-champagne text-sapphire font-extrabold animate-pulse'
                      : job.status === 6
                      ? 'bg-purple-700 text-white'
                      : isSettled
                      ? 'bg-sapphire text-white'
                      : 'bg-borderline text-sapphire/40'
                  }`}
                >
                  {isSettled ? '✓' : '3'}
                </div>
                <span className="font-semibold text-sapphire text-[11px]">3. Cooling-off (30 blk)</span>
                <span className="text-[10px] text-sapphire/50">
                  {job.status === 7 ? 'Challenge Window' : job.status === 6 ? 'In Dispute' : 'Audit Ready'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-sm ${
                    isSettled ? 'bg-sage text-white' : 'bg-borderline text-sapphire/40'
                  }`}
                >
                  {isSettled ? '✓' : '4'}
                </div>
                <span className="font-semibold text-sapphire text-[11px]">4. Settlement</span>
                <span className="text-[10px] text-sapphire/50">Disbursed Safely</span>
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${statusMeta.badgeBg} ${statusMeta.borderColor}`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {job.verdict === 'CANDIDATE_HIRED' && (
                  <CheckCircle2 className="w-5 h-5 text-sage shrink-0" />
                )}
                {job.verdict === 'CANDIDATE_SHORTLISTED' && (
                  <Award className="w-5 h-5 text-amber-700 shrink-0" />
                )}
                {job.verdict === 'CANDIDATE_REJECTED' && (
                  <ShieldAlert className="w-5 h-5 text-bordeaux shrink-0" />
                )}
                <span className={`text-base font-bold font-serif-title ${statusMeta.textColor}`}>
                  {job.status === 6
                    ? 'In Dispute / Appeal'
                    : job.status === 7
                    ? `Audit Completed • ${job.verdict.replace(/_/g, ' ')} (Cooling-off)`
                    : job.verdict === 'PENDING'
                    ? isInitialAuditWaiting
                      ? 'Executive Board Convening'
                      : 'Role Open'
                    : job.verdict.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-sapphire/70">{statusMeta.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-sapphire/50">
                  Bounty Escrow
                </span>
                <span className="font-mono font-bold text-sm text-sapphire">
                  {formatGen(job.bounty_amount)} GEN
                </span>
              </div>

              {/* Status 1: Initial Adjudication */}
              {isInitialAuditWaiting && onAdjudicate && (
                <button
                  onClick={() => onAdjudicate(job.job_id)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Cpu className="w-3.5 h-3.5 text-champagne" />
                  <span>{isProcessing ? 'Deliberating...' : 'Trigger Adjudication'}</span>
                </button>
              )}

              {/* Status 6: Disputed -> Senior Board Adjudicate Appeal */}
              {isDisputed && onAdjudicateAppeal && (
                <button
                  onClick={() => onAdjudicateAppeal(job.job_id)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-champagne" />
                  <span>{isProcessing ? 'Deliberating Appeal...' : 'Senior Board Adjudicate'}</span>
                </button>
              )}

              {/* Status 7: Cooling-off -> Finalize Settlement */}
              {isAuditCompleted && onFinalizeSettlement && (
                <button
                  onClick={() => onFinalizeSettlement(job.job_id)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-sage hover:bg-sage-light text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                  title="Finalize payout after 30 blocks cooling-off period"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Finalizing...' : 'Finalize Payout'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Scores & Circular Animated Gauge (if evaluated) */}
          {(job.status > 1 || job.status === 7) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Circular Animated Competency Gauge */}
              <div className="p-4 rounded-xl bg-canvas border border-borderline flex items-center space-x-4">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="7"
                      className="text-borderline"
                      fill="transparent"
                    />
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={`${competency.color} transition-all duration-1000 ease-out`}
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-mono font-bold text-base text-sapphire">
                      {job.competency_score}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-sapphire/50">/ 100</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sapphire/50 block">
                    Competency Grade
                  </span>
                  <span className={`text-2xl font-bold font-display-luxury ${competency.color}`}>
                    {competency.grade}
                  </span>
                  <p className="text-[11px] font-medium text-sapphire/80 leading-snug">
                    {competency.label}
                  </p>
                </div>
              </div>

              {/* Validator Consensus Confidence */}
              <div className="p-4 rounded-xl bg-canvas border border-borderline">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sapphire/60">
                    Consensus Confidence
                  </span>
                  <BarChart2 className="w-4 h-4 text-sapphire/40" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-3xl font-bold font-serif-title text-sapphire">
                    {job.confidence}%
                  </span>
                  <span className="text-xs font-semibold text-sapphire/60">Agreement</span>
                </div>
                <p className="text-[11px] text-sapphire/60 mt-2">
                  GenVM multi-validator consensus across subjective evaluators.
                </p>
              </div>

              {/* Security Canary & Integrity */}
              <div className="p-4 rounded-xl bg-canvas border border-borderline">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sapphire/60">
                    Canary Token
                  </span>
                  <Lock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CANARY_AGENT_TALENT_V1
                  </span>
                </div>
                <p className="text-[11px] text-sapphire/60 mt-2">
                  Anti-Prompt Injection Guard active against untrusted candidate payloads.
                </p>
              </div>
            </div>
          )}

          {/* Cooling-off Window Banner & Appeal Action (Status 7) */}
          {isAuditCompleted && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    30-Block Cooling-off Period Active
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Audit Block: {job.audit_completed_block || 'Active'}
                </span>
              </div>

              <p className="text-xs text-amber-900/80">
                Pavel & Joaquin Accounting Rule: Funds remain safely in escrow. If undisputed within 30 blocks, anyone can finalize the payout. If contested, either Employer or Candidate can stake a 10% bond to trigger Senior Board review.
              </p>

              {isParticipant && !showAppealForm && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800">
                    Required Dispute Bond: <strong>{formatGen(requiredBondWei.toString())} GEN (10%)</strong>
                  </span>
                  <button
                    onClick={() => setShowAppealForm(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Contest Verdict & Appeal</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Appeal Submission Form (Staking 10% Bond) */}
          {showAppealForm && (
            <form onSubmit={handleAppealSubmit} className="p-4 rounded-xl bg-canvas border border-champagne space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sapphire flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-champagne-dark" />
                  Stake 10% Bond & Submit New Appeal Evidence
                </span>
                <button
                  type="button"
                  onClick={() => setShowAppealForm(false)}
                  className="text-sapphire/50 hover:text-sapphire text-xs"
                >
                  Cancel
                </button>
              </div>

              {appealError && (
                <div className="p-2.5 rounded bg-bordeaux-soft border border-bordeaux/30 text-bordeaux text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{appealError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-sapphire/70 mb-1">
                  New Evidence / Clarified System Design URL:
                </label>
                <input
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/... or https://pastebin.com/raw/..."
                  className="w-full px-3 py-2 rounded-lg border border-borderline focus:border-sapphire text-xs bg-surface font-mono"
                  required
                />
              </div>

              <div className="p-2.5 rounded bg-surface border border-borderline text-[11px] text-sapphire/70">
                You will stake <strong>{formatGen(requiredBondWei.toString())} GEN</strong>. If your appeal is upheld, your bond is refunded. If dismissed, the bond is slashed to the counterparty.
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAppealForm(false)}
                  className="px-3 py-1.5 rounded border border-borderline text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAppeal}
                  className="px-4 py-1.5 rounded bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold shadow disabled:opacity-50"
                >
                  {isSubmittingAppeal ? 'Staking Bond...' : 'Stake 10% Bond & File Appeal'}
                </button>
              </div>
            </form>
          )}

          {/* Active Dispute Information (Status 6) */}
          {isDisputed && (
            <div className="p-4 rounded-xl bg-purple-50/90 border border-purple-200 text-xs text-purple-900 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-700" />
                  Active Dispute Under Review
                </span>
                <span className="font-mono text-purple-800">
                  Staked Bond: {formatGen(job.dispute_bond)} GEN
                </span>
              </div>
              <p className="text-[11px] text-purple-800/80">
                Appellant: <span className="font-mono">{shortenAddress(job.dispute_initiator, 4)}</span>. Senior Executive Board will review the new evidence URL via subjective consensus.
              </p>
            </div>
          )}

          {/* Transparent Score Breakdown & Financial Matrix */}
          <div className="p-4 rounded-xl bg-surface border border-borderline shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sapphire flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-sapphire" />
              <span>Multi-Criteria Adjudication Weights & Financial Settlement</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-canvas border border-borderline">
                <div className="flex justify-between font-semibold text-sapphire">
                  <span>1. Technical Competency</span>
                  <span className="text-champagne-dark font-mono">40%</span>
                </div>
                <p className="text-[11px] text-sapphire/60 mt-1">
                  Correctness of code, domain mastery, algorithm complexity & invariant rigor.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-canvas border border-borderline">
                <div className="flex justify-between font-semibold text-sapphire">
                  <span>2. System Design & Depth</span>
                  <span className="text-champagne-dark font-mono">30%</span>
                </div>
                <p className="text-[11px] text-sapphire/60 mt-1">
                  Feasibility in live production, fault tolerance, latency, and gas optimization.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-canvas border border-borderline">
                <div className="flex justify-between font-semibold text-sapphire">
                  <span>3. Anti-Fluff & Alignment</span>
                  <span className="text-champagne-dark font-mono">30%</span>
                </div>
                <p className="text-[11px] text-sapphire/60 mt-1">
                  Skepticism against generic marketing AI spam, buzzwords, and prompt injection.
                </p>
              </div>
            </div>
          </div>

          {/* Official AI Hiring Board Critique */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-2 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-sapphire" />
              <span>Official Executive Hiring Panel Deliberation</span>
            </h4>
            <div className="p-4 rounded-xl bg-surface border border-borderline shadow-sm">
              <p className="text-xs leading-relaxed text-sapphire font-sans whitespace-pre-wrap">
                {job.reason || 'No deliberation logs recorded.'}
              </p>
            </div>
          </div>

          {/* Candidate Response URL & Employer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-canvas border border-borderline space-y-2">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-sapphire/60">
                Candidate AI Agent
              </span>
              <div className="font-mono text-xs font-semibold text-sapphire">
                {job.candidate_agent && job.candidate_agent !== '0x0000000000000000000000000000000000000000'
                  ? job.candidate_agent
                  : 'Awaiting submission'}
              </div>
              {job.interview_response_url && (
                <div className="pt-2">
                  <a
                    href={job.interview_response_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-sapphire hover:text-champagne-dark transition underline underline-offset-2 break-all"
                  >
                    <span>View Live Solution Endpoint</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-borderline space-y-2">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-sapphire/60">
                Employer DAO / Recruiter
              </span>
              <div className="font-mono text-xs font-semibold text-sapphire">
                {job.employer}
              </div>
              <div className="text-[11px] text-sapphire/60 pt-2">
                Escrow Protected: <strong>{formatGen(job.bounty_amount)} GEN</strong>
              </div>
            </div>
          </div>

          {/* Case Study Full Criteria */}
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-sapphire/60 mb-1.5">
              Original Job Case Study & Criteria
            </span>
            <div className="p-3.5 rounded-xl bg-canvas-warm border border-borderline text-xs text-sapphire/80 whitespace-pre-wrap">
              {job.job_description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface border-t border-borderline flex items-center justify-between shrink-0">
          <span className="text-[11px] text-sapphire/50 font-mono">
            GenLayer Studionet • Chain ID 61999
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface border border-borderline text-sapphire text-xs font-medium hover:bg-canvas transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
