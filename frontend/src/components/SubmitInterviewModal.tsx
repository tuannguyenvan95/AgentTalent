import React, { useState } from 'react';
import { X, Send, AlertCircle, Link as LinkIcon, Sparkles, HelpCircle } from 'lucide-react';
import { JobBountyData } from '../config/genlayer';
import { formatGen, shortenAddress } from '../utils/helpers';

interface SubmitInterviewModalProps {
  job: JobBountyData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobId: string, solutionUrl: string) => Promise<void>;
  currentUserAddress: string;
}

const SAMPLE_SOLUTIONS = [
  {
    name: 'Top-Tier Agent Architecture (GitHub)',
    url: 'https://raw.githubusercontent.com/genlayer-talent/agent-spec/main/arbitrage_sentinel.py',
    note: 'Technical multi-hop reentrancy protection, slippage bounds & formal invariant checks.',
  },
  {
    name: 'Standard Agent Design (Pastebin)',
    url: 'https://pastebin.com/raw/agent_liquidity_v1',
    note: 'Reasonable baseline design with minor gaps in extreme volatility scenarios.',
  },
  {
    name: 'Substandard / Fluff Pitch',
    url: 'https://raw.githubusercontent.com/genlayer-talent/agent-spec/main/generic_pitch.txt',
    note: 'Superficial buzzwords without concrete code or implementation.',
  },
];

export const SubmitInterviewModal: React.FC<SubmitInterviewModalProps> = ({
  job,
  isOpen,
  onClose,
  onSubmit,
  currentUserAddress,
}) => {
  const [solutionUrl, setSolutionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !job) return null;

  const isEmployer = currentUserAddress.toLowerCase() === job.employer.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isEmployer) {
      setError('Employer cannot apply as candidate for their own job post.');
      return;
    }

    const cleanUrl = solutionUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setError('Please provide a valid public HTTP or HTTPS URL for your solution.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(job.job_id, cleanUrl);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit interview response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sapphire/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-xl rounded-2xl border border-borderline shadow-executive-hover overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-surface border-b border-borderline flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-champagne-soft flex items-center justify-center text-champagne-dark">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif-title text-sapphire">
                Submit Candidate Solution
              </h3>
              <p className="text-xs text-sapphire/60">
                Apply for {job.job_id} & claim {formatGen(job.bounty_amount)} GEN interview bounty
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-bordeaux-soft border border-bordeaux/30 text-bordeaux text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Job Overview */}
          <div className="p-4 rounded-xl bg-canvas border border-borderline space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sapphire">Employer:</span>
              <span className="font-mono text-sapphire/70">{shortenAddress(job.employer, 5)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sapphire">Locked Bounty:</span>
              <span className="font-mono font-bold text-champagne-dark">{formatGen(job.bounty_amount)} GEN</span>
            </div>
            <div className="pt-2 border-t border-borderline/60">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-sapphire/60 mb-1">
                Role Challenge Excerpt
              </span>
              <p className="text-xs text-sapphire/80 line-clamp-3 italic">
                "{job.job_description}"
              </p>
            </div>
          </div>

          {/* Quick Mock Sample Endpoints */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-2 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-champagne-dark" />
              <span>Quick Test Solution URLs</span>
            </label>
            <div className="space-y-1.5">
              {SAMPLE_SOLUTIONS.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSolutionUrl(s.url)}
                  className="w-full p-2.5 rounded-lg border border-borderline hover:border-champagne bg-surface hover:bg-canvas-warm text-left transition text-xs group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sapphire group-hover:text-champagne-dark">
                      {s.name}
                    </span>
                    <span className="font-mono text-[10px] text-sapphire/40 group-hover:text-sapphire/60">Use URL</span>
                  </div>
                  <p className="text-[11px] text-sapphire/60 mt-0.5">{s.note}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Solution URL Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-1.5 flex items-center space-x-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-sapphire" />
              <span>Live Solution / System Design URL</span>
            </label>
            <input
              type="url"
              value={solutionUrl}
              onChange={(e) => setSolutionUrl(e.target.value)}
              placeholder="https://raw.githubusercontent.com/... or https://pastebin.com/raw/..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-borderline focus:border-sapphire text-xs font-mono text-sapphire bg-surface"
              required
            />
            <p className="text-[11px] text-sapphire/50 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-sapphire/40" />
              Must be a publicly accessible endpoint. GenVM will scrape and analyze it live.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-borderline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-borderline text-sapphire text-xs font-medium hover:bg-canvas transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isEmployer}
              className="px-5 py-2.5 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold tracking-wide shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5 text-champagne" />
              <span>{isSubmitting ? 'Transmitting Solution...' : 'Submit Interview Response'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
