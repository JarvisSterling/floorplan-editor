'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { PositioningAnchor, AnchorType } from '@/types/database';
import Tooltip from '@/components/ui/Tooltip';

interface AnchorPanelProps {
  floorPlanId: string;
}

const ANCHOR_TYPES: { value: AnchorType; label: string; icon: string; desc: string }[] = [
  { value: 'ble', label: 'BLE Beacon', icon: '📡', desc: 'Bluetooth Low Energy beacon' },
  { value: 'uwb', label: 'UWB', icon: '📶', desc: 'Ultra-Wideband positioning' },
  { value: 'wifi', label: 'Wi-Fi AP', icon: '📶', desc: 'Wi-Fi access point' },
  { value: 'qr', label: 'QR Code', icon: '📱', desc: 'QR code marker' },
  { value: 'nfc', label: 'NFC Tag', icon: '🏷️', desc: 'Near Field Communication tag' },
];

export default function AnchorPanel({ floorPlanId }: AnchorPanelProps) {
  const [anchors, setAnchors] = useState<PositioningAnchor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);

  const loadAnchors = useCallback(async () => {
    if (floorPlanId === 'demo') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/positioning/anchors?floor_plan_id=${floorPlanId}`);
      if (res.ok) {
        const data = await res.json();
        setAnchors(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [floorPlanId]);

  useEffect(() => { loadAnchors(); }, [loadAnchors]);

  const deleteAnchor = async (id: string) => {
    const prev = anchors;
    setAnchors((p) => p.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/positioning/anchors/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setAnchors(prev);
        console.error('Failed to delete anchor:', res.statusText);
      }
    } catch {
      setAnchors(prev);
    }
  };

  const toggleStatus = async (anchor: PositioningAnchor) => {
    const newStatus = anchor.status === 'active' ? 'inactive' : 'active';
    const prev = anchors;
    setAnchors((p) => p.map((a) => a.id === anchor.id ? { ...a, status: newStatus } : a));
    try {
      const res = await fetch(`/api/positioning/anchors/${anchor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setAnchors(prev);
        console.error('Failed to toggle anchor status:', res.statusText);
      }
    } catch {
      setAnchors(prev);
    }
  };

  const activeCount = anchors.filter((a) => a.status === 'active').length;
  const lowBattery = anchors.filter((a) => a.battery_level !== null && a.battery_level < 20);

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <h3 className="font-semibold text-slate-200 text-base">Positioning Anchors</h3>

      {/* Stats */}
      <div className="flex gap-2 text-xs text-slate-500">
        <span>Total: {anchors.length}</span>
        <span>Active: {activeCount}</span>
        {lowBattery.length > 0 && (
          <Tooltip content={`${lowBattery.length} anchor(s) with battery below 20%`}>
            <span className="text-yellow-400">⚠️ Low battery: {lowBattery.length}</span>
          </Tooltip>
        )}
      </div>

      {/* Refresh */}
      <Tooltip content="Refresh anchor list from server">
        <button
          onClick={loadAnchors}
          disabled={loading}
          className="w-full px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 rounded-md text-xs transition-all duration-150"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </Tooltip>

      {/* Anchor list */}
      <div className="max-h-64 overflow-y-auto dark-scrollbar space-y-1">
        {anchors.map((anchor) => {
          const typeInfo = ANCHOR_TYPES.find((t) => t.value === anchor.type);
          const isSelected = selectedAnchor === anchor.id;

          return (
            <div
              key={anchor.id}
              onClick={() => setSelectedAnchor(isSelected ? null : anchor.id)}
              className={`p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                isSelected ? 'bg-indigo-500/15 border border-indigo-500/40' : 'bg-white/[0.04] hover:bg-white/[0.08] border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <Tooltip content={typeInfo?.desc || anchor.type} position="right">
                  <span className="text-slate-300 text-xs">
                    {typeInfo?.icon} {typeInfo?.label || anchor.type}
                  </span>
                </Tooltip>
                <Tooltip content={anchor.status === 'active' ? 'Active' : 'Inactive'}>
                  <span className={`text-xs ${anchor.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {anchor.status === 'active' ? '●' : '○'}
                  </span>
                </Tooltip>
              </div>

              {anchor.hardware_id && (
                <div className="text-slate-600 text-xs mt-0.5 font-mono truncate">
                  {anchor.hardware_id}
                </div>
              )}

              {isSelected && (
                <div className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
                  <div className="text-slate-500 text-xs">
                    Position: ({anchor.x.toFixed(1)}, {anchor.y.toFixed(1)})
                  </div>
                  {anchor.battery_level !== null && (
                    <div className={`text-xs ${anchor.battery_level < 20 ? 'text-yellow-400' : 'text-slate-500'}`}>
                      🔋 {anchor.battery_level}%
                    </div>
                  )}
                  {anchor.last_seen && (
                    <div className="text-slate-600 text-xs">
                      Last seen: {new Date(anchor.last_seen).toLocaleTimeString()}
                    </div>
                  )}
                  <div className="flex gap-1 mt-1">
                    <Tooltip content={anchor.status === 'active' ? 'Deactivate this anchor' : 'Activate this anchor'}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(anchor); }}
                        className="flex-1 px-2 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 rounded-md text-xs transition-all duration-150"
                      >
                        {anchor.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete this anchor permanently">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAnchor(anchor.id); }}
                        className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-xs transition-all duration-150"
                      >
                        🗑
                      </button>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {anchors.length === 0 && !loading && (
        <div className="text-slate-600 text-xs text-center py-4">
          No anchors placed on this floor.
          <br />
          Use the canvas tools to place beacons.
        </div>
      )}
    </div>
  );
}
