'use client';
import React from 'react';
import { useMarketplaceStore, getFilteredBooths } from '@/store/marketplace-store';
import { BOOTH_STATUS_COLORS, BOOTH_STATUS_LABELS } from '@/lib/booth-helpers';

export default function BoothList() {
  const { booths, filters, sortField, sortDir, setSelectedBoothId, setHoveredBoothId } = useMarketplaceStore();
  const filtered = getFilteredBooths(booths, filters, sortField, sortDir);

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 px-1 mb-2">{filtered.length} booth{filtered.length !== 1 ? 's' : ''}</div>
      {filtered.map((b) => (
        <button
          key={b.id}
          onClick={() => setSelectedBoothId(b.id)}
          onMouseEnter={() => setHoveredBoothId(b.id)}
          onMouseLeave={() => setHoveredBoothId(null)}
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium text-gray-900">{b.booth_number}</div>
            <div className="text-xs text-gray-500">
              {b.size_sqm ? `${b.size_sqm} sqm` : ''}{b.category ? ` · ${b.category}` : ''}
            </div>
          </div>
          <div className="text-right">
            {b.price != null && <div className="text-sm font-semibold text-gray-900">${b.price.toLocaleString()}</div>}
            <span
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: BOOTH_STATUS_COLORS[b.status] }}
            >
              {BOOTH_STATUS_LABELS[b.status]}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
