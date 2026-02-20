'use client';
import React, { useState, useEffect, useCallback } from 'react';
import type { PositioningAnchor, AnchorType } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <h3 className="font-semibold text-foreground text-base">Positioning Anchors</h3>

      {/* Stats */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>Total: {anchors.length}</span>
        <span>Active: {activeCount}</span>
        {lowBattery.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-yellow-600">⚠️ Low battery: {lowBattery.length}</span>
            </TooltipTrigger>
            <TooltipContent>{lowBattery.length} anchor(s) with battery below 20%</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Refresh */}
      <Button
        variant="secondary"
        size="sm"
        className="w-full text-xs"
        onClick={loadAnchors}
        disabled={loading}
      >
        {loading ? '⏳ Loading...' : '🔄 Refresh'}
      </Button>

      {/* Anchor list */}
      <ScrollArea className="max-h-64">
        <div className="space-y-1">
          {anchors.map((anchor) => {
            const typeInfo = ANCHOR_TYPES.find((t) => t.value === anchor.type);
            const isSelected = selectedAnchor === anchor.id;

            return (
              <div
                key={anchor.id}
                onClick={() => setSelectedAnchor(isSelected ? null : anchor.id)}
                className={`p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                  isSelected ? 'bg-accent border border-border' : 'hover:bg-accent/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground text-xs">
                        {typeInfo?.icon} {typeInfo?.label || anchor.type}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">{typeInfo?.desc || anchor.type}</TooltipContent>
                  </Tooltip>
                  <Badge variant={anchor.status === 'active' ? 'default' : 'secondary'} className={`text-[10px] h-4 px-1.5 ${anchor.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {anchor.status === 'active' ? '● Active' : '○ Inactive'}
                  </Badge>
                </div>

                {anchor.hardware_id && (
                  <div className="text-muted-foreground text-xs mt-0.5 font-mono truncate">
                    {anchor.hardware_id}
                  </div>
                )}

                {isSelected && (
                  <div className="mt-2 space-y-1 border-t border-border pt-2">
                    <div className="text-muted-foreground text-xs">
                      Position: ({anchor.x.toFixed(1)}, {anchor.y.toFixed(1)})
                    </div>
                    {anchor.battery_level !== null && (
                      <div className={`text-xs ${anchor.battery_level < 20 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                        🔋 {anchor.battery_level}%
                      </div>
                    )}
                    {anchor.last_seen && (
                      <div className="text-muted-foreground text-xs">
                        Last seen: {new Date(anchor.last_seen).toLocaleTimeString()}
                      </div>
                    )}
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={(e) => { e.stopPropagation(); toggleStatus(anchor); }}
                      >
                        {anchor.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); deleteAnchor(anchor.id); }}
                      >
                        🗑
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {anchors.length === 0 && !loading && (
        <div className="text-muted-foreground text-xs text-center py-4">
          No anchors placed on this floor.
          <br />
          Use the canvas tools to place beacons.
        </div>
      )}
    </div>
  );
}
