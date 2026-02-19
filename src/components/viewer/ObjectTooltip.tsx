'use client';
import React from 'react';
import type { FloorPlanObject } from '@/types/database';

interface Props {
  obj: FloorPlanObject | null;
  position: { x: number; y: number };
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-red-100 text-red-800',
  blocked: 'bg-gray-100 text-gray-800',
  premium: 'bg-purple-100 text-purple-800',
};

export default function ObjectTooltip({ obj, position }: Props) {
  if (!obj) return null;

  const meta = obj.metadata as Record<string, unknown>;
  const boothNumber = meta?.booth_number as string | undefined;
  const boothStatus = meta?.booth_status as string | undefined;
  const exhibitorName = meta?.exhibitor_name as string | undefined;

  return (
    <div
      className="fixed z-50 pointer-events-none bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-sm max-w-xs"
      style={{ left: position.x + 12, top: position.y + 12 }}
    >
      {obj.label && <div className="font-semibold text-gray-900">{obj.label}</div>}
      <div className="text-gray-500 text-xs capitalize">{obj.type} · {obj.shape}</div>

      {obj.type === 'booth' && (
        <div className="mt-1 space-y-0.5">
          {boothNumber && <div className="text-xs">Booth #{boothNumber}</div>}
          {boothStatus && (
            <span className={`inline-block text-xs px-1.5 py-0.5 rounded ${statusColors[boothStatus] || 'bg-gray-100 text-gray-700'}`}>
              {boothStatus}
            </span>
          )}
          {exhibitorName && <div className="text-xs text-gray-700">{exhibitorName}</div>}
        </div>
      )}

      {obj.width && obj.height && (
        <div className="text-xs text-gray-400 mt-1">
          {obj.width.toFixed(1)}m × {obj.height.toFixed(1)}m
        </div>
      )}
    </div>
  );
}
