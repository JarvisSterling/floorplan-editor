'use client';
import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlanObject, LayerType, ObjectType, BoothStatus } from '@/types/database';
import { BOOTH_STATUS_COLORS, BOOTH_STATUS_LABELS } from '@/lib/booth-helpers';
import CrossFloorLinkPanel from './CrossFloorLinkPanel';

const CATEGORIES: ObjectType[] = ['booth', 'wall', 'zone', 'furniture', 'infrastructure', 'annotation'];
const LAYER_OPTIONS: LayerType[] = ['background', 'structure', 'booths', 'zones', 'furniture', 'annotations', 'default'];
const BOOTH_STATUSES: BoothStatus[] = ['available', 'reserved', 'sold', 'blocked', 'premium'];

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
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Properties</h3>
        <p className="text-xs text-gray-400">Select an object to edit its properties</p>
      </div>
    );
  }

  if (selectedObjectIds.size > 1) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Properties</h3>
        <p className="text-xs text-gray-400">{selectedObjectIds.size} objects selected</p>
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
    <div className="w-64 bg-white border-l border-gray-200 p-3 overflow-y-auto text-xs">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Properties</h3>

      {/* Convert to Booth button */}
      {!isBooth && (
        <div className="mb-3">
          <button
            onClick={() => convertToBooth(id)}
            className="w-full bg-green-500 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-green-600 transition-colors"
          >
            🏪 Convert to Booth
          </button>
        </div>
      )}

      {/* Remove Booth button */}
      {isBooth && booth && (
        <div className="mb-3">
          <button
            onClick={() => removeBooth(id)}
            className="w-full bg-red-100 text-red-600 rounded px-3 py-1.5 text-xs font-medium hover:bg-red-200 transition-colors"
          >
            ✕ Remove Booth
          </button>
        </div>
      )}

      {/* Label */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Label</label>
        <input type="text" value={obj.label || ''} onChange={(e) => update({ label: e.target.value || null })}
          className="w-full border rounded px-2 py-1" />
      </div>

      {/* Position */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Position</label>
        <div className="flex gap-2">
          <div>
            <span className="text-gray-400">X</span>
            <input type="number" step="0.1" value={obj.x} onChange={(e) => update({ x: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <span className="text-gray-400">Y</span>
            <input type="number" step="0.1" value={obj.y} onChange={(e) => update({ y: Number(e.target.value) })}
              className="w-full border rounded px-2 py-1" />
          </div>
        </div>
      </div>

      {/* Size */}
      {obj.width != null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-gray-500">Size</label>
            <button onClick={() => setLockAspect(!lockAspect)} className={`text-xs px-1 rounded ${lockAspect ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>
              {lockAspect ? '🔒' : '🔓'}
            </button>
          </div>
          <div className="flex gap-2">
            <div>
              <span className="text-gray-400">W</span>
              <input type="number" step="0.1" value={obj.width ?? 0} onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <span className="text-gray-400">H</span>
              <input type="number" step="0.1" value={obj.height ?? 0} onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full border rounded px-2 py-1" />
            </div>
          </div>
        </div>
      )}

      {/* Rotation */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Rotation</label>
        <input type="number" min="0" max="360" value={obj.rotation} onChange={(e) => update({ rotation: Number(e.target.value) })}
          className="w-full border rounded px-2 py-1" />
      </div>

      {/* Fill — hide for booths since color is status-driven */}
      {!isBooth && (
        <div className="mb-3">
          <label className="block text-gray-500 mb-1">Fill</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={style.fill || '#4A90D9'} onChange={(e) => updateStyle('fill', e.target.value)} className="w-8 h-8 border rounded cursor-pointer" />
            <input type="range" min="0" max="1" step="0.05" value={style.opacity ?? 1} onChange={(e) => updateStyle('opacity', Number(e.target.value))}
              className="flex-1" />
            <span className="text-gray-400 w-8">{Math.round((style.opacity ?? 1) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Border — hide for booths */}
      {!isBooth && (
        <div className="mb-3">
          <label className="block text-gray-500 mb-1">Border</label>
          <div className="flex gap-2 items-center mb-1">
            <input type="color" value={style.stroke || '#333333'} onChange={(e) => updateStyle('stroke', e.target.value)} className="w-8 h-8 border rounded cursor-pointer" />
            <input type="number" min="0" max="10" step="0.5" value={style.strokeWidth ?? 1} onChange={(e) => updateStyle('strokeWidth', Number(e.target.value))}
              className="w-16 border rounded px-2 py-1" />
          </div>
          <select value={style.strokeStyle || 'solid'} onChange={(e) => updateStyle('strokeStyle', e.target.value)} className="w-full border rounded px-2 py-1">
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
          </select>
        </div>
      )}

      {/* Category */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Category</label>
        <select value={obj.type} onChange={(e) => update({ type: e.target.value as ObjectType })} className="w-full border rounded px-2 py-1">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Layer */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Layer</label>
        <select value={obj.layer} onChange={(e) => update({ layer: e.target.value as LayerType })} className="w-full border rounded px-2 py-1">
          {LAYER_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Z-Index */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Z-Index</label>
        <input type="number" value={obj.z_index} onChange={(e) => update({ z_index: Number(e.target.value) })}
          className="w-full border rounded px-2 py-1" />
      </div>

      {/* Lock */}
      <div className="mb-3 flex items-center gap-2">
        <input type="checkbox" checked={obj.locked} onChange={(e) => update({ locked: e.target.checked })} />
        <label className="text-gray-500">Locked</label>
      </div>

      {/* ── Booth-specific section ── */}
      {isBooth && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">🏪 Booth Info</h4>

          {/* Booth Number */}
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Booth Number</label>
            <input
              type="text"
              value={booth?.booth_number || metadata?.booth_number || ''}
              onChange={(e) => {
                if (booth) updateBoothNumber(id, e.target.value);
                else update({ metadata: { ...metadata, booth_number: e.target.value } });
              }}
              className="w-full border rounded px-2 py-1 font-mono"
            />
          </div>

          {/* Status */}
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Status</label>
            <div className="flex flex-wrap gap-1">
              {BOOTH_STATUSES.map((s) => {
                const current = booth?.status || metadata?.booth_status || 'available';
                const isActive = current === s;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (booth) updateBoothStatus(id, s);
                      else update({ metadata: { ...metadata, booth_status: s } });
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
                      isActive ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: BOOTH_STATUS_COLORS[s],
                      color: s === 'reserved' || s === 'premium' ? '#333' : '#fff',
                      borderColor: BOOTH_STATUS_COLORS[s],
                    }}
                  >
                    {BOOTH_STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Tier */}
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Pricing Tier</label>
            <select
              value={booth?.pricing_tier || ''}
              onChange={(e) => {
                const tier = e.target.value || null;
                if (booth) {
                  // Update local booth state
                  const { booths } = useEditorStore.getState();
                  const updated = { ...booth, pricing_tier: tier, updated_at: new Date().toISOString() };
                  useEditorStore.setState((s) => {
                    const m = new Map(s.booths);
                    m.set(id, updated);
                    return { booths: m };
                  });
                  // Sync to API
                  fetch(`/api/booths/${booth.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pricing_tier: tier }),
                  }).catch((err) => console.error('Pricing tier sync error:', err));
                }
              }}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">— None —</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Exhibitor */}
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Exhibitor ID</label>
            <input
              type="text"
              placeholder="exhibitor UUID..."
              value={booth?.exhibitor_id || metadata?.exhibitor_id || ''}
              onChange={(e) => {
                if (booth) updateBoothExhibitor(id, e.target.value || null);
                else update({ metadata: { ...metadata, exhibitor_id: e.target.value } });
              }}
              className="w-full border rounded px-2 py-1 font-mono text-xs"
            />
          </div>
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Exhibitor Name</label>
            <input
              type="text"
              placeholder="Company name..."
              value={metadata?.exhibitor_name || ''}
              onChange={(e) => {
                if (booth) updateBoothExhibitor(id, booth.exhibitor_id, e.target.value);
                else update({ metadata: { ...metadata, exhibitor_name: e.target.value } });
              }}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      {/* ── Booth Profile section ── */}
      {isBooth && booth && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📋 Booth Profile</h4>

          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Logo URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={boothProfile?.logo_url || ''}
              onChange={(e) => updateBoothProfile(id, { logo_url: e.target.value || null })}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Booth description..."
              value={boothProfile?.description || ''}
              onChange={(e) => updateBoothProfile(id, { description: e.target.value || null })}
              className="w-full border rounded px-2 py-1 resize-none"
            />
          </div>

          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Products / Services (comma-separated)</label>
            <input
              type="text"
              placeholder="product1, product2..."
              value={Array.isArray(boothProfile?.products) ? boothProfile.products.join(', ') : ''}
              onChange={(e) => {
                const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                updateBoothProfile(id, { products: tags });
              }}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
      )}

      {/* F8: Custom Metadata Key-Value Editor */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">Custom Metadata</h4>
        {Object.entries(obj.metadata || {}).filter(([k]) => !['booth_id', 'status', 'pricing_tier', 'booth_number', 'booth_status', 'exhibitor_id', 'exhibitor_name', 'boothCategory', 'sizeSqm', 'libraryItemId'].includes(k)).map(([key, value]) => (
          <div key={key} className="flex gap-1 mb-1 items-center">
            <input type="text" value={key} readOnly className="w-20 border rounded px-1 py-0.5 bg-gray-50 text-xs" />
            <input type="text" value={String(value ?? '')} onChange={(e) => update({ metadata: { ...obj.metadata, [key]: e.target.value } })} className="flex-1 border rounded px-1 py-0.5 text-xs" />
            <button onClick={() => { const m = { ...obj.metadata }; delete m[key]; update({ metadata: m }); }} className="text-red-400 hover:text-red-600 text-xs px-1" title="Remove">✕</button>
          </div>
        ))}
        <MetadataAdder onAdd={(key, value) => update({ metadata: { ...obj.metadata, [key]: value } })} />
      </div>

      {/* Cross-Floor Link */}
      <CrossFloorLinkPanel />

      {/* ID */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <h4 className="text-xs font-semibold text-gray-500 mb-1">ID</h4>
        <p className="text-xs text-gray-400 font-mono break-all">{obj.id}</p>
      </div>
    </div>
  );
}

function MetadataAdder({ onAdd }: { onAdd: (key: string, value: string) => void }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-1 mt-1">
      <input type="text" placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} className="w-20 border rounded px-1 py-0.5 text-xs" />
      <input type="text" placeholder="value" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 border rounded px-1 py-0.5 text-xs" />
      <button onClick={() => { if (key.trim()) { onAdd(key.trim(), value); setKey(''); setValue(''); } }} className="text-green-500 hover:text-green-700 text-xs px-1 font-bold" title="Add">+</button>
    </div>
  );
}
