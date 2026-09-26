import { Sparkles, ChevronRight, ExternalLink, Cpu, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { JobBountyData } from '../config/genlayer';
import { formatGen, shortenAddress, getStatusMeta, getCompetencyLevel } from '../utils/helpers';

interface JobCardProps {
  job: JobBountyData;
  currentUserAddress: string;
  onApplyClick: (job: JobBountyData) => void;
  onInspectClick: (job: JobBountyData) => void;
  onAdjudicateClick: (jobId: string) => void;
  onReclaimClick: (jobId: string) => void;
  isProcessing?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  currentUserAddress,
  onApplyClick,
  onInspectClick,
  onAdjudicateClick,
  onReclaimClick,
  isProcessing = false,
}) => {
  const statusMeta = getStatusMeta(job.status);
  const competency = getCompetencyLevel(job.competency_score);

  const isEmployer =
    currentUserAddress &&
    currentUserAddress.toLowerCase() === job.employer.toLowerCase();
  const isCandidate =
    currentUserAddress &&
    currentUserAddress.toLowerCase() === job.candidate_agent.toLowerCase();

  return (
    <div className="bg-surface rounded-xl border border-borderline shadow-executive hover:shadow-executive-hover hover:border-champagne transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      {/* Top Banner / Card Header */}
      <div className="p-5 border-b border-borderline/60">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-sapphire px-2 py-0.5 rounded bg-canvas border border-borderline">
              {job.job_id}
            </span>
            <span
              className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusMeta.badgeBg} ${statusMeta.textColor} ${statusMeta.borderColor}`}
            >
              {statusMeta.label}
            </span>
          </div>

          <div className="flex items-baseline space-x-1 text-right">
            <span className="text-xl font-bold font-serif-title text-sapphire">
              {formatGen(job.bounty_amount)}
            </span>
            <span className="text-xs font-bold text-champagne-dark">GEN</span>
          </div>
        </div>

        {/* Role Badges */}
        {(isEmployer || isCandidate) && (
          <div className="mb-2 flex items-center space-x-2">
            {isEmployer && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-champagne-soft text-champagne-dark border border-champagne/40">
                Your Job (Employer)
              </span>
            )}
            {isCandidate && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-sage-soft text-sage border border-sage/40">
                Your Application (Candidate)
              </span>
            )}
          </div>
        )}

        {/* Job Description Excerpt */}
        <p className="text-xs text-sapphire/80 line-clamp-3 leading-relaxed font-sans mb-3">
          {job.job_description}
        </p>

        {/* Employer & Candidate details */}
        <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-borderline/40">
          <div>
            <span className="text-sapphire/50 block">Employer</span>
            <span className="font-mono font-medium text-sapphire">
              {shortenAddress(job.employer, 3)}
              {isEmployer && <span className="ml-1 text-[10px] text-champagne-dark font-bold">(You)</span>}
            </span>
          </div>
          <div>
            <span className="text-sapphire/50 block">Candidate Agent</span>
            <span className="font-mono font-medium text-sapphire">
              {job.candidate_agent && job.candidate_agent !== '0x0000000000000000000000000000000000000000'
                ? shortenAddress(job.candidate_agent, 3)
                : 'Unassigned'}
              {isCandidate && <span className="ml-1 text-[10px] text-sage font-bold">(You)</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Evaluation Results / Deliberation Banner */}
      {job.status === 7 ? (
        <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            <div className="flex flex-col">
              <span className="font-semibold text-[11px]">Audit Done • Cooling-Off (30 Blk)</span>
              <span className="text-[10px] text-amber-800/80">Score: {job.competency_score}/100 • Verdict: {job.verdict.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button
            onClick={() => onInspectClick(job)}
            className="text-[11px] font-semibold text-amber-900 hover:underline flex items-center space-x-1"
          >
            <span>Review & Settle</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : job.status === 6 ? (
        <div className="px-5 py-3 bg-purple-50/80 border-b border-purple-200 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-700 animate-bounce" />
            <span className="font-semibold text-[11px]">Appeal Filed • Re-Review Convening</span>
          </div>
          <button
            onClick={() => onInspectClick(job)}
            className="text-[11px] font-semibold text-purple-800 hover:underline flex items-center space-x-1"
          >
            <span>View Appeal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : job.status === 1 ? (
        <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-sapphire">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span className="font-semibold text-[11px]">Ready for Jury Adjudication</span>
          </div>
          {job.interview_response_url && (
            <a
              href={job.interview_response_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-sapphire hover:underline flex items-center space-x-1"
            >
              <span>Solution</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ) : job.status > 1 && job.status !== 6 && job.status !== 7 ? (
        <div className="px-5 py-3 bg-canvas border-b border-borderline/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-base font-bold font-display-luxury ${competency.color}`}>
              {competency.grade}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-sapphire leading-tight">
                Score: {job.competency_score} / 100
              </span>
              <span className="text-[10px] text-sapphire/60">
                Confidence: {job.confidence}%
              </span>
            </div>
          </div>
          <button
            onClick={() => onInspectClick(job)}
            className="text-[11px] font-semibold text-sapphire hover:text-champagne-dark transition flex items-center space-x-1"
          >
            <span>Audited Deliberation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* Card Actions */}
      <div className="p-4 bg-surface flex items-center justify-between gap-2">
        <button
          onClick={() => onInspectClick(job)}
          className="px-3 py-1.5 rounded-lg border border-borderline text-sapphire/80 hover:text-sapphire hover:bg-canvas text-xs font-medium transition"
        >
          Details
        </button>

        <div className="flex items-center space-x-2">
          {/* Status 0: Open -> Apply */}
          {job.status === 0 && (
            <>
              {isEmployer ? (
                <button
                  onClick={() => onReclaimClick(job.job_id)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg border border-borderline text-sapphire/70 hover:text-bordeaux hover:border-bordeaux/40 text-xs font-medium transition flex items-center space-x-1"
                  title="Reclaim escrow if duration expired"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reclaim</span>
                </button>
              ) : (
                <button
                  onClick={() => onApplyClick(job)}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-champagne" />
                  <span>Submit Solution</span>
                </button>
              )}
            </>
          )}

          {/* Status 1: In Interview -> Adjudicate */}
          {job.status === 1 && (
            <button
              onClick={() => onAdjudicateClick(job.job_id)}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-champagne" />
              <span>Adjudicate</span>
            </button>
          )}

          {/* Status 7: Cooling-off -> Settle / Appeal Modal */}
          {job.status === 7 && (
            <button
              onClick={() => onInspectClick(job)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Settle / Appeal</span>
            </button>
          )}

          {/* Status 6: In Appeal -> Re-Adjudicate */}
          {job.status === 6 && (
            <button
              onClick={() => onInspectClick(job)}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-champagne" />
              <span>Inspect Appeal</span>
            </button>
          )}

          {/* Status >= 2 && != 6 && != 7: Settled */}
          {job.status >= 2 && job.status !== 6 && job.status !== 7 && (
            <button
              onClick={() => onInspectClick(job)}
              className="px-3.5 py-1.5 rounded-lg bg-canvas border border-borderline text-sapphire text-xs font-semibold hover:border-champagne transition"
            >
              Audited Logs
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
