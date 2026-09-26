import React from 'react';
import { Lock, Award, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { ProtocolStats } from '../config/genlayer';
import { formatGen } from '../utils/helpers';

interface StatsBarProps {
  stats: ProtocolStats;
  activeCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, activeCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Metric 1: Total Escrow Locked */}
      <div className="p-5 rounded-xl bg-surface border border-borderline shadow-executive relative overflow-hidden group hover:border-champagne/60 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-champagne/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-sapphire/60">
            Escrow Locked
          </span>
          <div className="w-8 h-8 rounded-lg bg-champagne-soft flex items-center justify-center text-champagne-dark">
            <Lock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-serif-title text-sapphire tracking-tight">
            {formatGen(stats.total_talent_locked)}
          </span>
          <span className="text-xs font-bold text-champagne-dark">GEN</span>
        </div>
        <p className="mt-1 text-[11px] text-sapphire/60 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          Secured by GenLayer Intelligent Escrow
        </p>
      </div>

      {/* Metric 2: Hires Completed */}
      <div className="p-5 rounded-xl bg-surface border border-borderline shadow-executive relative overflow-hidden group hover:border-sage/50 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sage/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-sapphire/60">
            Hires Completed
          </span>
          <div className="w-8 h-8 rounded-lg bg-sage-soft flex items-center justify-center text-sage">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-serif-title text-sapphire tracking-tight">
            {stats.total_hires_completed}
          </span>
          <span className="text-xs font-semibold text-sapphire/50">Verified Agents</span>
        </div>
        <p className="mt-1 text-[11px] text-sapphire/60 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-sage" />
          100% On-Chain Competency Audited
        </p>
      </div>

      {/* Metric 3: Active Listings */}
      <div className="p-5 rounded-xl bg-surface border border-borderline shadow-executive relative overflow-hidden group hover:border-sapphire/40 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sapphire/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-sapphire/60">
            Active Recruitment
          </span>
          <div className="w-8 h-8 rounded-lg bg-sapphire/10 flex items-center justify-center text-sapphire">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-serif-title text-sapphire tracking-tight">
            {activeCount}
          </span>
          <span className="text-xs font-semibold text-sapphire/50">Roles Open</span>
        </div>
        <p className="mt-1 text-[11px] text-sapphire/60">
          Total Roles Posted: <strong>{stats.total_jobs}</strong>
        </p>
      </div>

      {/* Metric 4: AI Hiring Board Authority */}
      <div className="p-5 rounded-xl bg-surface border border-borderline shadow-executive relative overflow-hidden group hover:border-champagne/60 transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 bg-champagne/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-sapphire/60">
            Consensus Engine
          </span>
          <div className="w-8 h-8 rounded-lg bg-sapphire flex items-center justify-center text-champagne">
            <span className="text-xs font-bold font-display-luxury">AI</span>
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-serif-title text-sapphire tracking-tight">
            GenVM Nondet
          </span>
        </div>
        <p className="mt-1 text-[11px] text-sapphire/60">
          Live Web Scraping & Semantic Consensus
        </p>
      </div>
    </div>
  );
};
