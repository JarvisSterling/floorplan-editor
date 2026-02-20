'use client';
import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlanObject, LayerType, ObjectType, BoothStatus } from '@/types/database';
import { BOOTH_STATUS_COLORS, BOOTH_STATUS_LABELS } from '@/lib/booth-helpers';
import CrossFloorLinkPanel from './CrossFloorLinkPanel';
import Tooltip from '@/components/ui/Tooltip';

const CATEGORIES: ObjectType[] = ['booth', 'wall', 'zone', 'furniture', 'infrastructure', 'annotation'];
const LAYER_OPTIONS: LayerType[] = ['background', 'structure', 'booths', 'zones', 'furniture', 'annotations', 'default'];
const BOOTH_STATUSES: BoothStatus[] = ['available', 'reserved', 'sold', 'blocked', 'premium'];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{children}</h4>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-slate-400 mb-1 text-xs">{children}</label>
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
      <div className="w-64 glass-panel border-l border-white/[0.06] p-4 overflow-y-auto dark-scrollbar">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Properties</h3>
        <p className="text-xs text-slate-500">Select an object to edit its properties</p>
      </div>
    );
  }

  if (selectedObjectIds.size > 1) {
    return (
      <div className="w-64 glass-panel border-l border-white/[0.06] p-4 overflow-y-auto dark-scrollbar">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Properties</h3>
        <p className="text-xs text-slate-400">{selectedObjectIds.size} objects selected</p>
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
    <div className="w-64 glass-panel border-l border-white/[0.06] p-3 overflow-y-auto dark-scrollbar text-xs">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Properties</h3>

      {/* Convert to Booth */}
      {!isBooth && (
        <div className="mb-3">
          <Tooltip content="Convert this object into a booth with status tracking">
            <button
              onClick={() => convertToBooth(id)}
              className="w-full bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 transition-colors duration-150 shadow-sm"
            >
              🏪 Convert to Booth
            </button>
          </Tooltip>
        </div>
      )}

      {/* Remove Booth */}
      {isBooth && booth && (
        <div className="mb-3">
          <Tooltip content="Remove booth data (keeps the shape)">
            <button
              onClick={() => removeBooth(id)}
              className="w-full bg-red-500/15 text-red-300 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-red-500/25 transition-colors duration-150"
            >
              ✕ Remove Booth
            </button>
          </Tooltip>
        </div>
      )}

      {/* Label */}
      <div className="mb-3">
        <Label>Label</Label>
        <input type="text" value={obj.label || ''} onChange={(e) => update({ label: e.target.value || null })}
          className="dark-input w-full" />
      </div>

      {/* Position */}
      <div className="mb-3">
        <Label>Position</Label>
        <div className="flex gap-2">
          <div>
            <span className="text-slate-500 text-[10px]">X</span>
            <input type="number" step="0.1" value={obj.x} onChange={(e) => update({ x: Number(e.target.value) })}
              className="dark-input w-full" />
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Y</span>
            <input type="number" step="0.1" value={obj.y} onChange={(e) => update({ y: Number(e.target.value) })}
              className="dark-input w-full" />
          </div>
        </div>
      </div>

      {/* Size */}
      {obj.width != null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <Label>Size</Label>
            <Tooltip content={lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}>
              <button onClick={() => setLockAspect(!lockAspect)} className={`text-xs px-1 rounded-md transition-all duration-150 ${lockAspect ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500'}`}>
                {lockAspect ? '🔒' : '🔓'}
              </button>
            </Tooltip>
          </div>
          <div className="flex gap-2">
            <div>
              <span className="text-slate-500 text-[10px]">W</span>
              <input type="number" step="0.1" value={obj.width ?? 0} onChange={(e) => setWidth(Number(e.target.value))}
                className="dark-input w-full" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px]">H</span>
              <input type="number" step="0.1" value={obj.height ?? 0} onChange={(e) => setHeight(Number(e.target.value))}
                className="dark-input w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Rotation */}
      <div className="mb-3">
        <Label>Rotation</Label>
        <input type="number" min="0" max="360" value={obj.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })}
          className="dark-input w-full" />
      </div>

      {/* Fill */}
      {!isBooth && (
        <div className="mb-3">
          <Label>Fill</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={style.fill || '#4A90D9'} onChange={(e) => updateStyle('fill', e.target.value)} className="w-8 h-8 rounded-md cursor-pointer bg-transparent border border-white/[0.1]" />
            <input type="range" min="0" max="1" step="0.05" value={style.opacity ?? 1} onChange={(e) => updateStyle('opacity', Number(e.target.value))}
              className="flex-1 dark-range" />
            <span className="text-slate-500 w-8">{Math.round((style.opacity ?? 1) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Border */}
      {!isBooth && (
        <div className="mb-3">
          <Label>Border</Label>
          <div className="flex gap-2 items-center mb-1">
            <input type="color" value={style.stroke || '#333333'} onChange={(e) => updateStyle('stroke', e.target.value)} className="w-8 h-8 rounded-md cursor-pointer bg-transparent border border-white/[0.1]" />
            <input type="number" min="0" max="10" step="0.5" value={style.strokeWidth ?? 1} onChange={(e) => updateStyle('strokeWidth', Number(e.target.value))}
              className="dark-input w-16" />
          </div>
          <select value={style.strokeStyle || 'solid'} onChange={(e) => updateStyle('strokeStyle', e.target.value)} className="dark-select w-full">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
        </div>
      )}

      {/* Category */}
      <div className="mb-3">
        <Label>Category</Label>
        <select value={obj.type} onChange={(e) => update({ type: e.target.value as ObjectType })} className="dark-select w-full">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Layer */}
      <div className="mb-3">
        <Label>Layer</Label>
        <select value={obj.layer} onChange={(e) => update({ layer: e.target.value as LayerType })} className="dark-select w-full">
          {LAYER_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Z-Index */}
      <div className="mb-3">
        <Label>Z-Index</Label>
        <input type="number" value={obj.z_index} onChange={(e) => update({ z_index: Number(e.target.value) })}
          className="dark-input w-full" />
      </div>

      {/* Lock */}
      <div className="mb-3 flex items-center gap-2">
        <input type="checkbox" checked={obj.locked} onChange={(e) => update({ locked: e.target.checked })} className="accent-indigo-500" />
        <label className="text-slate-400">Locked</label>
      </div>

      {/* ── Booth-specific section ── */}
      {isBooth && (
        <div className="border-t border-white/[0.06] pt-3 mt-3">
          <SectionTitle>🏪 Booth Info</SectionTitle>

          <div className="mb-2">
            <Label>Booth Number</Label>
            <input
              type="text"
              value={booth?.booth_number || metadata?.booth_number || ''}
              onChange={(e) => {
                if (booth) updateBoothNumber(id, e.target.value);
                else update({ metadata: { ...metadata, booth_number: e.target.value } });
              }}
              className="dark-input w-full font-mono"
            />
          </div>

          <div className="mb-2">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-1">
              {BOOTH_STATUSES.map((s) => {
                const current = booth?.status || metadata?.booth_status || 'available';
                const isActive = current === s;
                return (
                  <Tooltip key={s} content={`Set status to ${BOOTH_STATUS_LABELS[s]}`}>
                    <button
                      onClick={() => {
                        if (booth) updateBoothStatus(id, s);
                        else update({ metadata: { ...metadata, booth_status: s } });
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border transition-all duration-150 ${
                        isActive ? 'ring-2 ring-offset-1 ring-offset-[#1a1a2e] ring-white/30 scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: BOOTH_STATUS_COLORS[s],
                        color: s === 'reserved' || s === 'premium' ? '#333' : '#fff',
                        borderColor: BOOTH_STATUS_COLORS[s],
                      }}
                    >
                      {BOOTH_STATUS_LABELS[s]}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <div className="mb-2">
            <Label>Pricing Tier</Label>
            <select
              value={booth?.pricing_tier || ''}
              onChange={(e) => {
                const tier = e.target.value || null;
                if (booth) {
                  const { booths } = useEditorStore.getState();
                  const updated = { ...booth, pricing_tier: tier, updated_at: new Date().toISOString() };
                  useEditorStore.setState((s) => {
                    const m = new Map(s.booths);
                    m.set(id, updated);
                    return { booths: m };
                  });
                  fetch(`/api/booths/${booth.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pricing_tier: tier }),
                  }).catch((err) => console.error('Pricing tier sync error:', err));
                }
              }}
              className="dark-select w-full"
            >
              <option value="">— None —</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="mb-2">
            <Label>Exhibitor ID</Label>
            <input
              type="text"
              placeholder="exhibitor UUID..."
              value={booth?.exhibitor_id || metadata?.exhibitor_id || ''}
              onChange={(e) => {
                if (booth) updateBoothExhibitor(id, e.target.value || null);
                else update({ metadata: { ...metadata, exhibitor_id: e.target.value } });
              }}
              className="dark-input w-full font-mono"
            />
          </div>
          <div className="mb-2">
            <Label>Exhibitor Name</Label>
            <input
              type="text"
              placeholder="Company name..."
              value={metadata?.exhibitor_name || ''}
              onChange={(e) => {
                if (booth) updateBoothExhibitor(id, booth.exhibitor_id, e.target.value);
                else update({ metadata: { ...metadata, exhibitor_name: e.target.value } });
              }}
              className="dark-input w-full"
            />
          </div>
        </div>
      )}

      {/* ── Booth Profile section ── */}
      {isBooth && booth && (
        <div className="border-t border-white/[0.06] pt-3 mt-3">
          <SectionTitle>📋 Booth Profile</SectionTitle>

          <div className="mb-2">
            <Label>Logo URL</Label>
            <input
              type="url"
              placeholder="https://..."
              value={boothProfile?.logo_url || ''}
              onChange={(e) => updateBoothProfile(id, { logo_url: e.target.value || null })}
              className="dark-input w-full"
            />
          </div>

          <div className="mb-2">
            <Label>Description</Label>
            <textarea
              rows={2}
              placeholder="Booth description..."
              value={boothProfile?.description || ''}
              onChange={(e) => updateBoothProfile(id, { description: e.target.value || null })}
              className="dark-input w-full resize-none"
            />
          </div>

          <div className="mb-2">
            <Label>Products / Services (comma-separated)</Label>
            <input
              type="text"
              placeholder="product1, product2..."
              value={Array.isArray(boothProfile?.products) ? boothProfile.products.join(', ') : ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                updateBoothProfile(id, { products: tags });
              }}
              className="dark-input w-full"
            />
          </div>
        </div>
      )}

      {/* Custom Metadata */}
      <div className="border-t border-white/[0.06] pt-3 mt-3">
        <SectionTitle>Custom Metadata</SectionTitle>
        {Object.entries(obj.metadata || {}).filter(([k]) => !['booth_id', 'status', 'pricing_tier', 'booth_number', 'booth_status', 'exhibitor_id', 'exhibitor_name', 'boothCategory', 'sizeSqm', 'libraryItemId'].includes(k)).map(([key, value]) => (
          <div key={key} className="flex gap-1 mb-1 items-center">
            <input type="text" value={key} readOnly className="dark-input w-20 bg-white/[0.03]" />
            <input type="text" value={String(value ?? '')} onChange={(e) => update({ metadata: { ...obj.metadata, [key]: e.target.value } })} className="dark-input flex-1" />
            <Tooltip content="Remove metadata entry">
              <button onClick={() => { const m = { ...obj.metadata }; delete m[key]; update({ metadata: m }); }} className="text-red-400 hover:text-red-300 text-xs px-1 transition-colors">✕</button>
            </Tooltip>
          </div>
        ))}
        <MetadataAdder onAdd={(key, value) => update({ metadata: { ...obj.metadata, [key]: value } })} />
      </div>

      {/* Cross-Floor Link */}
      <CrossFloorLinkPanel />

      {/* ID */}
      <div className="border-t border-white/[0.06] pt-3 mt-3">
        <SectionTitle>ID</SectionTitle>
        <p className="text-xs text-slate-500 font-mono break-all">{obj.id}</p>
      </div>
    </div>
  );
}

function MetadataAdder({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-1 mt-1">
      <input type="text" placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} className="dark-input w-20" />
      <input type="text" placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} className="dark-input flex-1" />
      <Tooltip content="Add metadata entry">
        <button onClick={() => { if (key.trim()) { onAdd(key.trim(), value); setKey(''); setValue(''); } }} className="text-emerald-400 hover:text-emerald-300 text-xs px-1 font-bold transition-colors">+</button>
      </Tooltip>
    </div>
  );
}
