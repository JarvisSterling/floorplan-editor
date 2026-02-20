'use client';
import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlanObject, LayerType, ObjectType, BoothStatus } from '@/types/database';
import { BOOTH_STATUS_COLORS, BOOTH_STATUS_LABELS } from '@/lib/booth-helpers';
import CrossFloorLinkPanel from './CrossFloorLinkPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES: ObjectType[] = ['booth', 'wall', 'zone', 'furniture', 'infrastructure', 'annotation'];
const LAYER_OPTIONS: LayerType[] = ['background', 'structure', 'booths', 'zones', 'furniture', 'annotations', 'default'];
const BOOTH_STATUSES: BoothStatus[] = ['available', 'reserved', 'sold', 'blocked', 'premium'];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{children}</h4>
);

export default function PropertiesPanel() {
  const {
    selectedObjectIds, objects, updateObject,
    booths, boothProfiles,
    convertToBooth, updateBoothStatus, updateBoothNumber, updateBoothExhibitor,
    updateBoothProfile, removeBooth,
  } = useEditorStore();
  const [lockAspect, setLockAspect] = useState(false);

  if (selectedObjectIds.size === 0) {
    return (
      <div className="w-64 bg-card border-l border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Properties</h3>
        <p className="text-xs text-muted-foreground">Select an object to edit its properties</p>
      </div>
    );
  }

  if (selectedObjectIds.size > 1) {
    return (
      <div className="w-64 bg-card border-l border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Properties</h3>
        <p className="text-xs text-muted-foreground">{selectedObjectIds.size} objects selected</p>
      </div>
    );
  }

  const id = Array.from(selectedObjectIds)[0];
  const obj = objects.get(id);
  if (!obj) return null;

  const style = (obj.style || {}) as Record<string, any>;
  const metadata = (obj.metadata || {}) as Record<string, any>;
  const booth = booths.get(id);
  const boothProfile = booth ? boothProfiles.get(booth.id) : undefined;
  const isBooth = obj.type === 'booth' || !!booth;

  const update = (updates: Partial<FloorPlanObject>) => updateObject(id, updates);
  const updateStyle = (key: string, value: any) => update({ style: { ...style, [key]: value } });

  const setWidth = (w: number) => {
    if (lockAspect && obj.width && obj.height) {
      const ratio = obj.height / obj.width;
      update({ width: w, height: w * ratio });
    } else {
      update({ width: w });
    }
  };

  const setHeight = (h: number) => {
    if (lockAspect && obj.width && obj.height) {
      const ratio = obj.width / obj.height;
      update({ height: h, width: h * ratio });
    } else {
      update({ height: h });
    }
  };

  return (
    <ScrollArea className="w-64 bg-card border-l border-border">
      <div className="p-3 text-xs">
        <h3 className="text-sm font-semibold text-foreground mb-3">Properties</h3>

        {/* Convert to Booth */}
        {!isBooth && (
          <div className="mb-3">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              size="sm"
              onClick={() => convertToBooth(id)}
            >
              🏪 Convert to Booth
            </Button>
          </div>
        )}

        {/* Remove Booth */}
        {isBooth && booth && (
          <div className="mb-3">
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
              size="sm"
              onClick={() => removeBooth(id)}
            >
              ✕ Remove Booth
            </Button>
          </div>
        )}

        {/* Label */}
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input type="text" value={obj.label || ''} onChange={(e) => update({ label: e.target.value || null })}
            className="h-7 text-xs mt-0.5" />
        </div>

        {/* Position */}
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Position</Label>
          <div className="flex gap-2 mt-0.5">
            <div>
              <span className="text-muted-foreground text-[10px]">X</span>
              <Input type="number" step="0.1" value={obj.x} onChange={(e) => update({ x: Number(e.target.value) })}
                className="h-7 text-xs" />
            </div>
            <div>
              <span className="text-muted-foreground text-[10px]">Y</span>
              <Input type="number" step="0.1" value={obj.y} onChange={(e) => update({ y: Number(e.target.value) })}
                className="h-7 text-xs" />
            </div>
          </div>
        </div>

        {/* Size */}
        {obj.width != null && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-0.5">
              <Label className="text-xs text-muted-foreground">Size</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-5 w-5 text-xs ${lockAspect ? 'text-foreground' : 'text-muted-foreground'}`}
                    onClick={() => setLockAspect(!lockAspect)}
                  >
                    {lockAspect ? '🔒' : '🔓'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <div>
                <span className="text-muted-foreground text-[10px]">W</span>
                <Input type="number" step="0.1" value={obj.width ?? 0} onChange={(e) => setWidth(Number(e.target.value))}
                  className="h-7 text-xs" />
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">H</span>
                <Input type="number" step="0.1" value={obj.height ?? 0} onChange={(e) => setHeight(Number(e.target.value))}
                  className="h-7 text-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Rotation */}
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Rotation</Label>
          <Input type="number" min="0" max="360" value={obj.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="h-7 text-xs mt-0.5" />
        </div>

        {/* Fill */}
        {!isBooth && (
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground">Fill</Label>
            <div className="flex gap-2 items-center mt-0.5">
              <input type="color" value={style.fill || '#4A90D9'} onChange={(e) => updateStyle('fill', e.target.value)}
                className="w-8 h-8 rounded-md cursor-pointer bg-transparent border border-border" />
              <div className="flex-1">
                <Slider
                  value={[style.opacity ?? 1]}
                  onValueChange={([v]) => updateStyle('opacity', v)}
                  min={0} max={1} step={0.05}
                />
              </div>
              <span className="text-muted-foreground w-8 text-[10px]">{Math.round((style.opacity ?? 1) * 100)}%</span>
            </div>
          </div>
        )}

        {/* Border */}
        {!isBooth && (
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground">Border</Label>
            <div className="flex gap-2 items-center mb-1 mt-0.5">
              <input type="color" value={style.stroke || '#333333'} onChange={(e) => updateStyle('stroke', e.target.value)}
                className="w-8 h-8 rounded-md cursor-pointer bg-transparent border border-border" />
              <Input type="number" min="0" max="10" step="0.5" value={style.strokeWidth ?? 1}
                onChange={(e) => updateStyle('strokeWidth', Number(e.target.value))}
                className="h-7 text-xs w-16" />
            </div>
            <Select value={style.strokeStyle || 'solid'} onValueChange={(v) => updateStyle('strokeStyle', v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category */}
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={obj.type} onValueChange={(v) => update({ type: v as ObjectType })}>
            <SelectTrigger className="h-7 text-xs mt-0.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Layer */}
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Layer</Label>
          <Select value={obj.layer} onValueChange={(v) => update({ layer: v as LayerType })}>
            <SelectTrigger className="h-7 text-xs mt-0.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LAYER_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Z-Index */}
        <div className="mb-3">
          <Label className="text-xs text-muted-foreground">Z-Index</Label>
          <Input type="number" value={obj.z_index} onChange={(e) => update({ z_index: Number(e.target.value) })}
            className="h-7 text-xs mt-0.5" />
        </div>

        {/* Lock */}
        <div className="mb-3 flex items-center gap-2">
          <input type="checkbox" checked={obj.locked} onChange={(e) => update({ locked: e.target.checked })}
            className="accent-primary rounded" />
          <span className="text-muted-foreground text-xs">Locked</span>
        </div>

        {/* ── Booth-specific section ── */}
        {isBooth && (
          <>
            <Separator className="my-3" />
            <SectionTitle>🏪 Booth Info</SectionTitle>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Booth Number</Label>
              <Input
                type="text"
                value={booth?.booth_number || metadata?.booth_number || ''}
                onChange={(e) => {
                  if (booth) updateBoothNumber(id, e.target.value);
                  else update({ metadata: { ...metadata, booth_number: e.target.value } });
                }}
                className="h-7 text-xs font-mono mt-0.5"
              />
            </div>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {BOOTH_STATUSES.map((s) => {
                  const current = booth?.status || metadata?.booth_status || 'available';
                  const isActive = current === s;
                  return (
                    <Tooltip key={s}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (booth) updateBoothStatus(id, s);
                            else update({ metadata: { ...metadata, booth_status: s } });
                          }}
                          className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all duration-150 ${
                            isActive ? 'ring-2 ring-offset-1 ring-offset-background ring-ring scale-105' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: BOOTH_STATUS_COLORS[s],
                            color: s === 'reserved' || s === 'premium' ? '#333' : '#fff',
                            borderColor: BOOTH_STATUS_COLORS[s],
                          }}
                        >
                          {BOOTH_STATUS_LABELS[s]}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Set status to {BOOTH_STATUS_LABELS[s]}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Pricing Tier</Label>
              <Select
                value={booth?.pricing_tier || ''}
                onValueChange={(tier) => {
                  if (booth) {
                    const updated = { ...booth, pricing_tier: tier || null, updated_at: new Date().toISOString() };
                    useEditorStore.setState((s) => {
                      const m = new Map(s.booths);
                      m.set(id, updated);
                      return { booths: m };
                    });
                    fetch(`/api/booths/${booth.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pricing_tier: tier || null }),
                    }).catch((err) => console.error('Pricing tier sync error:', err));
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs mt-0.5">
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Exhibitor ID</Label>
              <Input
                type="text"
                placeholder="exhibitor UUID..."
                value={booth?.exhibitor_id || metadata?.exhibitor_id || ''}
                onChange={(e) => {
                  if (booth) updateBoothExhibitor(id, e.target.value || null);
                  else update({ metadata: { ...metadata, exhibitor_id: e.target.value } });
                }}
                className="h-7 text-xs font-mono mt-0.5"
              />
            </div>
            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Exhibitor Name</Label>
              <Input
                type="text"
                placeholder="Company name..."
                value={metadata?.exhibitor_name || ''}
                onChange={(e) => {
                  if (booth) updateBoothExhibitor(id, booth.exhibitor_id, e.target.value);
                  else update({ metadata: { ...metadata, exhibitor_name: e.target.value } });
                }}
                className="h-7 text-xs mt-0.5"
              />
            </div>
          </>
        )}

        {/* ── Booth Profile section ── */}
        {isBooth && booth && (
          <>
            <Separator className="my-3" />
            <SectionTitle>📋 Booth Profile</SectionTitle>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Logo URL</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={boothProfile?.logo_url || ''}
                onChange={(e) => updateBoothProfile(id, { logo_url: e.target.value || null })}
                className="h-7 text-xs mt-0.5"
              />
            </div>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <textarea
                rows={2}
                placeholder="Booth description..."
                value={boothProfile?.description || ''}
                onChange={(e) => updateBoothProfile(id, { description: e.target.value || null })}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="mb-2">
              <Label className="text-xs text-muted-foreground">Products / Services</Label>
              <Input
                type="text"
                placeholder="product1, product2..."
                value={Array.isArray(boothProfile?.products) ? boothProfile.products.join(', ') : ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                  updateBoothProfile(id, { products: tags });
                }}
                className="h-7 text-xs mt-0.5"
              />
            </div>
          </>
        )}

        {/* Custom Metadata */}
        <Separator className="my-3" />
        <SectionTitle>Custom Metadata</SectionTitle>
        {Object.entries(obj.metadata || {}).filter(([k]) => !['booth_id', 'status', 'pricing_tier', 'booth_number', 'booth_status', 'exhibitor_id', 'exhibitor_name', 'boothCategory', 'sizeSqm', 'libraryItemId'].includes(k)).map(([key, value]) => (
          <div key={key} className="flex gap-1 mb-1 items-center">
            <Input type="text" value={key} readOnly className="h-7 text-xs w-20 bg-muted" />
            <Input type="text" value={String(value ?? '')} onChange={(e) => update({ metadata: { ...obj.metadata, [key]: e.target.value } })} className="h-7 text-xs flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:bg-destructive/10"
              onClick={() => { const m = { ...obj.metadata }; delete m[key]; update({ metadata: m }); }}
            >
              <span className="text-xs">✕</span>
            </Button>
          </div>
        ))}
        <MetadataAdder onAdd={(key, value) => update({ metadata: { ...obj.metadata, [key]: value } })} />

        {/* Cross-Floor Link */}
        <CrossFloorLinkPanel />

        {/* ID */}
        <Separator className="my-3" />
        <SectionTitle>ID</SectionTitle>
        <p className="text-xs text-muted-foreground font-mono break-all">{obj.id}</p>
      </div>
    </ScrollArea>
  );
}

function MetadataAdder({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-1 mt-1">
      <Input type="text" placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} className="h-7 text-xs w-20" />
      <Input type="text" placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} className="h-7 text-xs flex-1" />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-emerald-600 hover:bg-emerald-50"
        onClick={() => { if (key.trim()) { onAdd(key.trim(), value); setKey(''); setValue(''); } }}
      >
        <span className="text-xs font-bold">+</span>
      </Button>
    </div>
  );
}
