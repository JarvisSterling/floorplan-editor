import type { BoothStatus } from '@/types/database';

/** Color mapping for booth statuses */
export const BOOTH_STATUS_COLORS: Record<BoothStatus, string> = {
  available: '#4CAF50',  // green
  reserved: '#FFC107',   // yellow
  sold: '#2196F3',       // blue (PRD says blue for sold/confirmed)
  blocked: '#9E9E9E',    // gray
  premium: '#FFD700',    // gold
};

export const BOOTH_STATUS_BORDER: Record<BoothStatus, string> = {
  available: '#388E3C',
  reserved: '#F9A825',
  sold: '#1565C0',
  blocked: '#616161',
  premium: '#DAA520',
};

export const BOOTH_STATUS_LABELS: Record<BoothStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  blocked: 'Blocked',
  premium: 'Premium',
};

/** Generate next booth number given existing numbers */
export function generateBoothNumber(existingNumbers: string[]): string {
  let maxNum = 0;
  for (const num of existingNumbers) {
    const match = num.match(/^B(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `B${String(maxNum + 1).padStart(3, '0')}`;
}
