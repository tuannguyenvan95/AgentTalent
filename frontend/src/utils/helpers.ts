import { formatEther, parseEther } from 'viem';

/**
 * Format an Ethereum address safely (0x1234...abcd)
 */
export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return '';
  const clean = address.trim();
  if (clean.length <= chars * 2 + 2) return clean;
  return `${clean.substring(0, chars + 2)}...${clean.substring(clean.length - chars)}`;
}

/**
 * Convert Wei/BigInt to formatted GEN display string
 */
export function formatGen(wei: string | bigint | number, maxDecimals = 4): string {
  try {
    if (!wei || wei === '0') return '0.00';
    let bigintVal: bigint;
    if (typeof wei === 'bigint') {
      bigintVal = wei;
    } else if (typeof wei === 'string' && wei.startsWith('0x')) {
      bigintVal = BigInt(wei);
    } else {
      bigintVal = BigInt(wei.toString());
    }

    const etherStr = formatEther(bigintVal);
    const num = parseFloat(etherStr);
    if (isNaN(num)) return '0.00';
    if (num === 0) return '0.00';
    if (num < 0.0001) return '< 0.0001';

    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });
  } catch (e) {
    return '0.00';
  }
}

/**
 * Convert user GEN string to Wei bigint
 */
export function parseGenToWei(amount: string): bigint {
  try {
    const clean = amount.trim();
    if (!clean || isNaN(Number(clean)) || Number(clean) <= 0) {
      return 0n;
    }
    return parseEther(clean);
  } catch {
    return 0n;
  }
}

export type JobStatusNum = 0 | 1 | 2 | 3 | 4 | 5;

export interface StatusMeta {
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  description: string;
}

export const STATUS_MAP: Record<number, StatusMeta> = {
  0: {
    label: 'Open for Interview',
    badgeBg: 'bg-champagne-soft',
    textColor: 'text-champagne-dark',
    borderColor: 'border-champagne/40',
    description: 'Awaiting AI Agent candidate submission',
  },
  1: {
    label: 'In Executive Review',
    badgeBg: 'bg-blue-50',
    textColor: 'text-sapphire',
    borderColor: 'border-sapphire/30',
    description: 'AI Hiring Board evaluating solution live',
  },
  2: {
    label: 'Candidate Hired',
    badgeBg: 'bg-sage-soft',
    textColor: 'text-sage',
    borderColor: 'border-sage/40',
    description: '100% Interview Bounty paid out to candidate',
  },
  3: {
    label: 'Rejected & Refunded',
    badgeBg: 'bg-bordeaux-soft',
    textColor: 'text-bordeaux',
    borderColor: 'border-bordeaux/40',
    description: '100% Escrow refunded to employer',
  },
  4: {
    label: 'Shortlisted (Partial)',
    badgeBg: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    description: '50% stipend to candidate, 50% refund to employer',
  },
  5: {
    label: 'Cancelled',
    badgeBg: 'bg-gray-100',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300',
    description: 'Listing cancelled and escrow reclaimed',
  },
  6: {
    label: 'In Appeal Deliberation',
    badgeBg: 'bg-purple-50',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    description: 'Appeal filed by participant; executive re-review convening',
  },
};

export function getStatusMeta(status: number): StatusMeta {
  return (
    STATUS_MAP[status] || {
      label: 'Unknown',
      badgeBg: 'bg-gray-100',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
      description: 'Status unavailable',
    }
  );
}

export function getCompetencyLevel(score: number): {
  grade: string;
  label: string;
  color: string;
  barColor: string;
} {
  if (score >= 90) {
    return {
      grade: 'A+',
      label: 'Exceptional Mastery',
      color: 'text-sage',
      barColor: 'bg-sage',
    };
  }
  if (score >= 80) {
    return {
      grade: 'A',
      label: 'Executive Hire Ready',
      color: 'text-sage',
      barColor: 'bg-sage',
    };
  }
  if (score >= 68) {
    return {
      grade: 'B+',
      label: 'Promising Talent',
      color: 'text-amber-700',
      barColor: 'bg-amber-600',
    };
  }
  if (score >= 55) {
    return {
      grade: 'B',
      label: 'Shortlisted Candidate',
      color: 'text-amber-700',
      barColor: 'bg-amber-500',
    };
  }
  if (score >= 40) {
    return {
      grade: 'C',
      label: 'Substandard Reasoning',
      color: 'text-bordeaux',
      barColor: 'bg-bordeaux/80',
    };
  }
  return {
    grade: 'F',
    label: 'Unqualified / Spam',
    color: 'text-bordeaux',
    barColor: 'bg-bordeaux',
  };
}
