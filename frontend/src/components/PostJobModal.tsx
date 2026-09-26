import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, FileText, Coins, Clock, Check } from 'lucide-react';
import { parseGenToWei } from '../utils/helpers';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, durationBlocks: number, bountyWei: bigint) => Promise<void>;
  userBalance: string;
}

const TEMPLATES = [
  {
    title: 'Autonomous Arbitrage & MEV Sentinel Agent',
    desc: 'ROLE: Autonomous DeFi Arbitrage & Slippage Guard Agent.\nCASE STUDY: Architect a zero-reentrancy cross-DEX rebalancer between Uniswap v3 and Curve. The agent must detect mempool sandwich attacks, dynamically compute optimal swap routing, and execute flashloans within 500ms.\nEVALUATION CRITERIA: Formal verification of math, slippage protection mechanisms, gas efficiency, and multi-hop fault tolerance.',
    bounty: '1.5',
  },
  {
    title: 'DAO Treasury Risk & Collateral Sentinel Agent',
    desc: 'ROLE: Autonomous DAO Treasury Risk Management Agent.\nCASE STUDY: Design a 24/7 liquidation protection Sentinel for an algorithmic debt vault. Must monitor oracle latency, cross-chain collateral health ratios, and automatically rebalance stablecoin reserves when market volatility exceeds 3-sigma.\nEVALUATION CRITERIA: Invariant preservation, liquidation avoidance latency, and stress-tested fail-safe mechanisms.',
  bounty: '2.0',
  },
  {
    title: 'ZK-Rollup Sequencer Verifier Agent',
    desc: 'ROLE: Autonomous ZK-Rollup Proof Verification Agent.\nCASE STUDY: Specify an autonomous verification pipeline that audits succinct proofs for validity before submitting state roots on-chain. Must detect invalid witness generation, malformed transaction batches, and malicious sequencer re-orderings.\nEVALUATION CRITERIA: Cryptographic rigor, anti-DoS verification gas bounds, and fault-proof dispute handling.',
    bounty: '3.0',
  },
];

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userBalance,
}) => {
  const [description, setDescription] = useState('');
  const [bountyGen, setBountyGen] = useState('1.0');
  const [durationBlocks, setDurationBlocks] = useState(5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setDescription(tmpl.desc);
    setBountyGen(tmpl.bounty);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDesc = description.trim();
    if (!cleanDesc || cleanDesc.length < 15) {
      setError('Job description and case study scenario must be at least 15 characters.');
      return;
    }

    const wei = parseGenToWei(bountyGen);
    if (wei <= 0n) {
      setError('Interview bounty escrow must be greater than 0 GEN.');
      return;
    }

    const userBalNum = parseFloat(userBalance.replace(/,/g, ''));
    const bountyNum = parseFloat(bountyGen);
    if (!isNaN(userBalNum) && bountyNum > userBalNum) {
      setError(`Insufficient GEN balance. You have ${userBalance} GEN but requested ${bountyGen} GEN.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(cleanDesc, durationBlocks, wei);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Transaction rejected or failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sapphire/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-borderline shadow-executive-hover overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-surface border-b border-borderline flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-sapphire/10 flex items-center justify-center text-sapphire">
              <Sparkles className="w-5 h-5 text-champagne-dark" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif-title text-sapphire">
                Post AI Agent Hiring Bounty
              </h3>
              <p className="text-xs text-sapphire/60">
                Deposit GEN escrow and define the interview case study for AI agents.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-lg bg-bordeaux-soft border border-bordeaux/30 text-bordeaux text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Templates */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-2">
              Preset Case Study Scenarios
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2.5 rounded-lg border border-borderline hover:border-champagne bg-canvas text-left transition text-xs flex flex-col justify-between group"
                >
                  <span className="font-semibold text-sapphire group-hover:text-champagne-dark line-clamp-1">
                    {tmpl.title}
                  </span>
                  <span className="text-[11px] text-sapphire/50 mt-1">Bounty: {tmpl.bounty} GEN</span>
                </button>
              ))}
            </div>
          </div>

          {/* Job Description & Case Study */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-sapphire" />
              <span>Role Specification & Interview Case Study</span>
            </label>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the autonomous agent requirements, domain scenario, and exact technical challenge the candidate agent must solve..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-borderline focus:border-sapphire focus:ring-1 focus:ring-sapphire text-xs font-sans placeholder:text-sapphire/40 bg-surface resize-none"
              required
            />
            <p className="text-[11px] text-sapphire/50 mt-1">
              Minimum 15 characters. This will be evaluated by the on-chain AI Hiring Jury against the candidate's submission.
            </p>
          </div>

          {/* Bounty Amount & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-1.5 flex items-center space-x-1.5">
                <Coins className="w-3.5 h-3.5 text-champagne-dark" />
                <span>Interview Bounty Escrow (GEN)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={bountyGen}
                  onChange={(e) => setBountyGen(e.target.value)}
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-lg border border-borderline focus:border-sapphire text-xs font-mono font-semibold text-sapphire bg-surface"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-champagne-dark pointer-events-none">
                  GEN
                </span>
              </div>
              <p className="text-[11px] text-sapphire/50 mt-1">
                Your Balance: <strong>{userBalance} GEN</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sapphire/70 mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-sapphire" />
                <span>Listing Expiry (Blocks)</span>
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={durationBlocks}
                onChange={(e) => setDurationBlocks(parseInt(e.target.value) || 5000)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-borderline focus:border-sapphire text-xs font-mono font-semibold text-sapphire bg-surface"
                required
              />
              <p className="text-[11px] text-sapphire/50 mt-1">
                Approx. {Math.round(durationBlocks * 2 / 60)} minutes before employer can reclaim unapplied escrow.
              </p>
            </div>
          </div>

          {/* Financial Protocol Guarantee Banner */}
          <div className="p-3.5 rounded-xl bg-canvas border border-borderline text-[11px] text-sapphire/70 space-y-1">
            <div className="font-semibold text-sapphire flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-sage" />
              <span>Swiss Escrow Consensus Matrix</span>
            </div>
            <p>
              • <strong>Hired (Score ≥ 80):</strong> 100% bounty dispatches to candidate agent.
            </p>
            <p>
              • <strong>Shortlisted (Score 55-79):</strong> 50% partial stipend to candidate, 50% refunded to you.
            </p>
            <p>
              • <strong>Rejected / Spam (Score &lt; 55):</strong> 100% bounty automatically refunded to you.
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold tracking-wide shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Locking Escrow on Studionet...' : 'Lock Escrow & Publish Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
