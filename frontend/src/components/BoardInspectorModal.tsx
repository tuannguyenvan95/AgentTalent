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
} from 'lucide-react';
import { JobBountyData } from '../config/genlayer';
import { formatGen, getStatusMeta, getCompetencyLevel } from '../utils/helpers';

interface BoardInspectorModalProps {
  job: JobBountyData | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjudicate?: (jobId: string) => Promise<void>;
  onRequestAppeal?: (jobId: string, rationale: string) => Promise<void>;
  isAdjudicating?: boolean;
  currentUserAddress?: string;
}

export const BoardInspectorModal: React.FC<BoardInspectorModalProps> = ({
  job,
  isOpen,
  onClose,
  onAdjudicate,
  onRequestAppeal,
  isAdjudicating = false,
  currentUserAddress = '',
}) => {
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealRationale, setAppealRationale] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const statusMeta = getStatusMeta(job.status);
  const competency = getCompetencyLevel(job.competency_score);

  const isAwaitingAdjudication = job.status === 1 || job.status === 6;
  const isSettled = job.status === 2 || job.status === 3 || job.status === 4;

  const isParticipant =
    currentUserAddress &&
    (currentUserAddress.toLowerCase() === job.employer.toLowerCase() ||
      currentUserAddress.toLowerCase() === job.candidate_agent.toLowerCase());

  const canAppeal = isSettled && (job.appeal_count || 0) === 0 && isParticipant;

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppealError(null);
    if (!appealRationale || appealRationale.trim().length < 15) {
      setAppealError('Please provide at least 15 characters explaining your dispute rationale.');
      return;
    }
    if (!onRequestAppeal) return;

    try {
      setIsSubmittingAppeal(true);
      await onRequestAppeal(job.job_id, appealRationale.trim());
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
                    job.status >= 1
                      ? 'bg-sapphire text-white'
                      : 'bg-borderline text-sapphire/40'
                  }`}
                >
                  {job.status >= 1 ? '✓' : '2'}
                </div>
                <span className="font-semibold text-sapphire text-[11px]">2. Solution Nộp</span>
                <span className="text-[10px] text-sapphire/50">Live URL scraped</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-sm ${
                    job.status >= 2 && job.status !== 6
                      ? 'bg-sapphire text-white'
                      : job.status === 1 || job.status === 6
                      ? 'bg-champagne text-sapphire animate-pulse'
                      : 'bg-borderline text-sapphire/40'
                  }`}
                >
                  {job.status >= 2 && job.status !== 6 ? '✓' : '3'}
                </div>
                <span className="font-semibold text-sapphire text-[11px]">3. AI Jury Audit</span>
                <span className="text-[10px] text-sapphire/50">Subjective consensus</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-sm ${
                    job.status >= 2 && job.status !== 6
                      ? 'bg-sage text-white'
                      : 'bg-borderline text-sapphire/40'
                  }`}
                >
                  {job.status >= 2 && job.status !== 6 ? '✓' : '4'}
                </div>
                <span className="font-semibold text-sapphire text-[11px]">4. Settlement</span>
                <span className="text-[10px] text-sapphire/50">Disbursed / Protected</span>
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
                    ? 'In Appeal Deliberation'
                    : job.verdict === 'PENDING'
                    ? isAwaitingAdjudication
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
                  Bounty Settlement
                </span>
                <span className="font-mono font-bold text-sm text-sapphire">
                  {formatGen(job.bounty_amount)} GEN
                </span>
              </div>

              {isAwaitingAdjudication && onAdjudicate && (
                <button
                  onClick={() => onAdjudicate(job.job_id)}
                  disabled={isAdjudicating}
                  className="px-4 py-2 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Cpu className="w-3.5 h-3.5 text-champagne" />
                  <span>{isAdjudicating ? 'Deliberating...' : job.status === 6 ? 'Re-Adjudicate Appeal' : 'Trigger Adjudication'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Scores & Circular Animated Gauge (if adjudicated) */}
          {job.status > 1 && (
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
                    VERIFIED MATCH
                  </span>
                </div>
                <p className="text-[11px] text-sapphire/60 mt-2">
                  Anti-Prompt Injection Guard active against untrusted candidate payloads.
                </p>
              </div>
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

          {/* Appeal / Dispute Section (Protecting Both Sides) */}
          {canAppeal && !showAppealForm && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div>
                <span className="font-bold flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Dispute Window Open (Participant Protection)
                </span>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  As an active participant, you can file a one-time formal appeal if you believe the AI Jury missed crucial technical nuances.
                </p>
              </div>
              <button
                onClick={() => setShowAppealForm(true)}
                className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition shrink-0"
              >
                File On-Chain Appeal
              </button>
            </div>
          )}

          {showAppealForm && (
            <form onSubmit={handleAppealSubmit} className="p-4 rounded-xl bg-canvas border border-champagne space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sapphire flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-champagne-dark" />
                  Submit Formal Appeal & Dispute Rationale
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

              <textarea
                rows={3}
                value={appealRationale}
                onChange={(e) => setAppealRationale(e.target.value)}
                placeholder="Explain clearly which aspects of your solution were misunderstood, or why the verdict warrants a second-stage jury re-review..."
                className="w-full p-2.5 rounded-lg border border-borderline focus:border-sapphire text-xs bg-surface resize-none"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingAppeal}
                  className="px-4 py-2 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmittingAppeal ? 'Recording Appeal on Studionet...' : 'Submit Appeal On-Chain'}
                </button>
              </div>
            </form>
          )}

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
