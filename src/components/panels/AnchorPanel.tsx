'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { PositioningAnchor, AnchorType } from '@/types/database';

interface AnchorPanelProps {
  floorPlanId: string;
}

const ANCHOR_TYPES: { value: AnchorType; label: string; icon: string }[] = [
  { value: 'ble', label: 'BLE Beacon', icon: '📡' },
  { value: 'uwb', label: 'UWB', icon: '📶' },
  { value: 'wifi', label: 'Wi-Fi AP', icon: '📶' },
  { value: 'qr', label: 'QR Code', icon: '📱' },
  { value: 'nfc', label: 'NFC Tag', icon: '🏷️' },
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
    setAnchors((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/positioning/anchors/${id}`, { method: 'DELETE' });
    } catch {}
  };

  const toggleStatus = async (anchor: PositioningAnchor) => {
    const newStatus = anchor.status === 'active' ? 'inactive' : 'active';
    setAnchors((prev) => prev.map((a) => a.id === anchor.id ? { ...a, status: newStatus } : a));
    try {
      await fetch(`/api/positioning/anchors/${anchor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
  };

  const activeCount = anchors.filter((a) => a.status === 'active').length;
  const lowBattery = anchors.filter((a) => a.battery_level !== null && a.battery_level < 20);

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <h3 className="font-semibold text-white text-base">Positioning Anchors</h3>

      {/* Stats */}
      <div className="flex gap-2 text-xs text-gray-400">
        <span>Total: {anchors.length}</span>
        <span>Active: {activeCount}</span>
        {lowBattery.length > 0 && (
          <span className="text-yellow-400">⚠️ Low battery: {lowBattery.length}</span>
        )}
      </div>

      {/* Refresh */}
      <button
        onClick={loadAnchors}
        disabled={loading}
        className="w-full px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
      >
        {loading ? '⏳ Loading...' : '🔄 Refresh'}
      </button>

      {/* Anchor list */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {anchors.map((anchor) => {
          const typeInfo = ANCHOR_TYPES.find((t) => t.value === anchor.type);
          const isSelected = selectedAnchor === anchor.id;

          return (
            <div
              key={anchor.id}
              onClick={() => setSelectedAnchor(isSelected ? null : anchor.id)}
              className={`p-2 rounded cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-200 text-xs">
                  {typeInfo?.icon} {typeInfo?.label || anchor.type}
                </span>
                <span className={`text-xs ${anchor.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                  {anchor.status === 'active' ? '●' : '○'}
                </span>
              </div>

              {anchor.hardware_id && (
                <div className="text-gray-500 text-xs mt-0.5 font-mono truncate">
                  {anchor.hardware_id}
                </div>
              )}

              {isSelected && (
                <div className="mt-2 space-y-1 border-t border-gray-700 pt-2">
                  <div className="text-gray-400 text-xs">
                    Position: ({anchor.x.toFixed(1)}, {anchor.y.toFixed(1)})
                  </div>
                  {anchor.battery_level !== null && (
                    <div className={`text-xs ${anchor.battery_level < 20 ? 'text-yellow-400' : 'text-gray-400'}`}>
                      🔋 {anchor.battery_level}%
                    </div>
                  )}
                  {anchor.last_seen && (
                    <div className="text-gray-500 text-xs">
                      Last seen: {new Date(anchor.last_seen).toLocaleTimeString()}
                    </div>
                  )}
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStatus(anchor); }}
                      className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs"
                    >
                      {anchor.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAnchor(anchor.id); }}
                      className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {anchors.length === 0 && !loading && (
        <div className="text-gray-500 text-xs text-center py-4">
          No anchors placed on this floor.
          <br />
          Use the canvas tools to place beacons.
        </div>
      )}
    </div>
  );
}
