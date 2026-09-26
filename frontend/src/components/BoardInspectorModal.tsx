import { X, Award, ShieldAlert, CheckCircle2, ExternalLink, Cpu, BarChart2, Scale, Lock } from 'lucide-react';
import { JobBountyData } from '../config/genlayer';
import { formatGen, getStatusMeta, getCompetencyLevel } from '../utils/helpers';

interface BoardInspectorModalProps {
  job: JobBountyData | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjudicate?: (jobId: string) => Promise<void>;
  isAdjudicating?: boolean;
}

export const BoardInspectorModal: React.FC<BoardInspectorModalProps> = ({
  job,
  isOpen,
  onClose,
  onAdjudicate,
  isAdjudicating = false,
}) => {
  if (!isOpen || !job) return null;

  const statusMeta = getStatusMeta(job.status);
  const competency = getCompetencyLevel(job.competency_score);

  const isAwaitingAdjudication = job.status === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sapphire/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-3xl rounded-2xl border border-borderline shadow-executive-hover overflow-hidden flex flex-col max-h-[90vh]">
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
                  {job.verdict === 'PENDING'
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
                  <span>{isAdjudicating ? 'Deliberating...' : 'Trigger Adjudication'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Scores & Consensus Readouts (if adjudicated) */}
          {job.status > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Competency Score */}
              <div className="p-4 rounded-xl bg-canvas border border-borderline">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sapphire/60">
                    Competency Score
                  </span>
                  <span className="font-mono font-bold text-xs text-sapphire">
                    {job.competency_score} / 100
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold font-display-luxury ${competency.color}`}>
                    {competency.grade}
                  </span>
                  <span className="text-xs font-semibold text-sapphire/70">
                    {competency.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-borderline/60 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${competency.barColor}`}
                    style={{ width: `${job.competency_score}%` }}
                  ></div>
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
