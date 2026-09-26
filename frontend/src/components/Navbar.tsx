import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet,
  Settings,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  LogOut,
  Copy,
  Check,
  User,
  ChevronDown,
} from 'lucide-react';
import { shortenAddress } from '../utils/helpers';
import { STUDIO_URL } from '../config/genlayer';

interface NavbarProps {
  account: string;
  balance: string;
  isConnecting: boolean;
  contractAddress: string;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onPostJobClick: () => void;
  onUpdateContractAddress: (addr: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  balance,
  isConnecting,
  contractAddress,
  onConnectWallet,
  onDisconnectWallet,
  onPostJobClick,
  onUpdateContractAddress,
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customAddress, setCustomAddress] = useState(contractAddress);

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAddress.trim().startsWith('0x')) {
      onUpdateContractAddress(customAddress.trim());
      setShowConfig(false);
    }
  };

  const handleCopy = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isZeroBalance = parseFloat(balance.replace(/,/g, '')) === 0 && account;

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-borderline shadow-executive">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Authority Seal */}
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-lg bg-sapphire flex items-center justify-center shadow-md border border-champagne/30">
              <span className="font-display-luxury font-bold text-champagne text-xl tracking-wider">AT</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display-luxury text-2xl font-bold tracking-tight text-sapphire">
                  Agent<span className="text-champagne-dark">Talent</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-champagne-soft text-champagne-dark border border-champagne/30 rounded-full">
                  Swiss Protocol
                </span>
              </div>
              <p className="text-xs text-sapphire/70 font-sans tracking-wide">
                Autonomous AI Agent Headhunting & Interview Bounty Escrow
              </p>
            </div>
          </div>

          {/* Network & Contract Indicators */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface border border-borderline text-sapphire/80 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">Studionet</span>
              <span className="text-sapphire/40">|</span>
              <span>61999</span>
            </div>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-canvas border border-borderline hover:border-champagne/60 text-sapphire/80 transition-colors"
              title="Configure Contract Address"
            >
              <Settings className="w-3.5 h-3.5 text-sapphire/60" />
              <span className="font-mono text-[11px]">{shortenAddress(contractAddress, 4)}</span>
            </button>
          </div>

          {/* Action CTAs & Wallet */}
          <div className="flex items-center space-x-3 relative">
            <button
              onClick={onPostJobClick}
              className="hidden sm:inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-sapphire hover:bg-sapphire-light text-white text-xs font-semibold tracking-wide transition shadow-sm border border-sapphire-light"
            >
              <Sparkles className="w-3.5 h-3.5 text-champagne" />
              <span>Post Hiring Bounty</span>
            </button>

            {account ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-1.5 pl-3 rounded-lg bg-canvas border border-borderline hover:border-champagne text-xs transition group cursor-pointer"
                >
                  <div className="flex flex-col text-right">
                    <span className="font-mono font-semibold text-sapphire">{balance} GEN</span>
                    <span className="font-mono text-[10px] text-sapphire/60">{shortenAddress(account, 3)}</span>
                  </div>
                  <div className="w-8 h-8 rounded-md bg-sapphire/10 group-hover:bg-sapphire/20 flex items-center justify-center text-sapphire transition">
                    <ShieldCheck className="w-4 h-4 text-sapphire" />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-sapphire/50 group-hover:text-sapphire transition" />
                </button>

                {/* Profile & Disconnect Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-surface rounded-xl border border-borderline shadow-executive-hover py-3 px-4 z-50 animate-slide-up">
                    <div className="flex items-center justify-between pb-3 border-b border-borderline/60">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-sapphire/10 flex items-center justify-center text-sapphire font-semibold text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-sapphire">Active Profile</span>
                          <span className="block text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Connected to Studionet
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-3 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-sapphire/50 tracking-wider">
                          Wallet Address
                        </span>
                        <div className="flex items-center justify-between mt-1 p-2 rounded-lg bg-canvas border border-borderline">
                          <span className="font-mono text-[11px] text-sapphire truncate mr-2">
                            {account}
                          </span>
                          <button
                            onClick={handleCopy}
                            className="p-1 rounded hover:bg-white text-sapphire/70 transition shrink-0"
                            title="Copy address"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-sage" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sapphire/60">Current Balance:</span>
                        <span className="font-mono font-bold text-sapphire">{balance} GEN</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-borderline/60 space-y-1">
                      <a
                        href={`https://genlayer-explorer.vercel.app/address/${account}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-sapphire/80 hover:bg-canvas transition"
                      >
                        <span>View on GenLayer Explorer</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-sapphire/50" />
                      </a>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onDisconnectWallet();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-bordeaux hover:bg-bordeaux-soft transition"
                      >
                        <span>Disconnect Wallet</span>
                        <LogOut className="w-3.5 h-3.5 text-bordeaux" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-champagne hover:bg-champagne-dark text-sapphire text-xs font-bold tracking-wider uppercase transition shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Faucet Guidance Banner if 0 GEN */}
        {isZeroBalance && (
          <div className="mb-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Your wallet balance is <strong>0.00 GEN</strong> on Studionet. Fund your account with testnet GEN in GenLayer Studio.
              </span>
            </div>
            <a
              href={STUDIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 font-semibold text-sapphire hover:underline"
            >
              <span>GenLayer Studio Accounts</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Contract Address Configuration Bar */}
        {showConfig && (
          <div className="py-3 px-4 mb-3 rounded-lg bg-canvas-warm border border-borderline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="font-semibold text-sapphire whitespace-nowrap">Contract Address:</span>
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 sm:w-80 px-2.5 py-1.5 rounded border border-borderline font-mono text-xs focus:outline-none focus:border-sapphire bg-white"
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleSaveContract}
                className="px-3 py-1.5 rounded bg-sapphire text-white text-xs font-medium hover:bg-sapphire-light transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="px-3 py-1.5 rounded bg-surface border border-borderline text-sapphire/80 text-xs hover:bg-canvas transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
