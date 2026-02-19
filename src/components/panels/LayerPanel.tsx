'use client';
import React from 'react';
import { useEditorStore, EXTENDED_LAYERS, type ExtendedLayer } from '@/store/editor-store';

const LAYER_LABELS: Record<string, string> = {
  background: '🖼 Background',
  structure: '🏗 Structure',
  booths: '🏪 Booths',
  zones: '🔲 Zones',
  furniture: '🪑 Furniture',
  annotations: '📝 Annotations',
  heatmap: '🌡 Heatmap',
  wayfinding: '🧭 Wayfinding',
};

export default function LayerPanel() {
  const { layers, setLayerVisibility, setLayerLocked, setLayerOpacity, objects } = useEditorStore();

  const countForLayer = (layer: ExtendedLayer) => {
    let c = 0;
    objects.forEach((o) => {
      const ol = o.layer === 'default' ? 'annotations' : o.layer;
      if (ol === layer) c++;
    });
    return c;
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Layers</h3>
      <div className="space-y-1.5">
        {EXTENDED_LAYERS.map((layer) => {
          const s = layers[layer];
          const count = countForLayer(layer);
          return (
            <div key={layer} className="rounded border border-gray-100 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{LAYER_LABELS[layer]}</span>
                <span className="text-xs text-gray-400">{count}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLayerVisibility(layer, !s.visible)}
                  className={`text-xs px-1.5 py-0.5 rounded ${s.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                  title={s.visible ? 'Hide' : 'Show'}
                >
                  {s.visible ? '👁' : '👁‍🗨'}
                </button>
                <button
                  onClick={() => setLayerLocked(layer, !s.locked)}
                  className={`text-xs px-1.5 py-0.5 rounded ${s.locked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}
                  title={s.locked ? 'Unlock' : 'Lock'}
                >
                  {s.locked ? '🔒' : '🔓'}
                </button>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={s.opacity}
                  onChange={(e) => setLayerOpacity(layer, Number(e.target.value))}
                  className="flex-1 h-1"
                  title={`Opacity: ${Math.round(s.opacity * 100)}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
