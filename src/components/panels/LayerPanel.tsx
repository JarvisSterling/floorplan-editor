'use client';
import React from 'react';
import { useEditorStore, EXTENDED_LAYERS, type ExtendedLayer } from '@/store/editor-store';
import Tooltip from '@/components/ui/Tooltip';

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
    <div className="w-56 glass-panel p-3 overflow-y-auto dark-scrollbar">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Layers</h3>
      <div className="space-y-1.5">
        {EXTENDED_LAYERS.map((layer) => {
          const s = layers[layer];
          const count = countForLayer(layer);
          return (
            <div key={layer} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 hover:bg-white/[0.05] transition-colors duration-150">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">{LAYER_LABELS[layer]}</span>
                <span className="text-xs text-slate-500">{count}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content={s.visible ? 'Hide Layer' : 'Show Layer'}>
                  <button
                    onClick={() => setLayerVisibility(layer, !s.visible)}
                    className={`text-xs px-1.5 py-0.5 rounded-md transition-all duration-150 ${s.visible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-slate-500'}`}
                  >
                    {s.visible ? '👁' : '👁‍🗨'}
                  </button>
                </Tooltip>
                <Tooltip content={s.locked ? 'Unlock Layer' : 'Lock Layer'}>
                  <button
                    onClick={() => setLayerLocked(layer, !s.locked)}
                    className={`text-xs px-1.5 py-0.5 rounded-md transition-all duration-150 ${s.locked ? 'bg-red-500/20 text-red-300' : 'bg-white/[0.06] text-slate-500'}`}
                  >
                    {s.locked ? '🔒' : '🔓'}
                  </button>
                </Tooltip>
                <Tooltip content={`Opacity: ${Math.round(s.opacity * 100)}%`}>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={s.opacity}
                    onChange={(e) => setLayerOpacity(layer, Number(e.target.value))}
                    className="flex-1 h-1 dark-range"
                  />
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
