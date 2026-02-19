'use client';
import React, { useState } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlanObject, LayerType, ObjectType } from '@/types/database';

const CATEGORIES: ObjectType[] = ['booth', 'wall', 'zone', 'furniture', 'infrastructure', 'annotation'];
const LAYER_OPTIONS: LayerType[] = ['background', 'structure', 'booths', 'zones', 'furniture', 'annotations', 'default'];

export default function PropertiesPanel() {
  const { selectedObjectIds, objects, updateObject } = useEditorStore();
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

      {/* Fill */}
      <div className="mb-3">
        <label className="block text-gray-500 mb-1">Fill</label>
        <div className="flex gap-2 items-center">
          <input type="color" value={style.fill || '#4A90D9'} onChange={(e) => updateStyle('fill', e.target.value)} className="w-8 h-8 border rounded cursor-pointer" />
          <input type="range" min="0" max="1" step="0.05" value={style.opacity ?? 1} onChange={(e) => updateStyle('opacity', Number(e.target.value))}
            className="flex-1" />
          <span className="text-gray-400 w-8">{Math.round((style.opacity ?? 1) * 100)}%</span>
        </div>
      </div>

      {/* Border */}
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

      {/* Booth-specific */}
      {obj.type === 'booth' && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Booth Info</h4>
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Booth ID</label>
            <input type="text" value={(obj.metadata as any)?.booth_id || ''} onChange={(e) => update({ metadata: { ...obj.metadata, booth_id: e.target.value } })}
              className="w-full border rounded px-2 py-1" />
          </div>
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Status</label>
            <select value={(obj.metadata as any)?.status || 'available'} onChange={(e) => update({ metadata: { ...obj.metadata, status: e.target.value } })}
              className="w-full border rounded px-2 py-1">
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-gray-500 mb-1">Pricing Tier</label>
            <input type="text" value={(obj.metadata as any)?.pricing_tier || ''} onChange={(e) => update({ metadata: { ...obj.metadata, pricing_tier: e.target.value } })}
              className="w-full border rounded px-2 py-1" />
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t border-gray-200 pt-3 mt-3">
        <h4 className="text-xs font-semibold text-gray-500 mb-1">ID</h4>
        <p className="text-xs text-gray-400 font-mono break-all">{obj.id}</p>
      </div>
    </div>
  );
}
