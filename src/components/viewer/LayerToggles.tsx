'use client';
import React from 'react';
import { useViewerStore, VIEWER_LAYERS } from '@/store/viewer-store';

const layerLabels: Record<string, string> = {
  background: 'Background',
  structure: 'Walls & Structure',
  booths: 'Booths',
  zones: 'Zones',
  furniture: 'Furniture',
  annotations: 'Annotations',
};

export default function LayerToggles() {
  const { layerVisibility, toggleLayer } = useViewerStore();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {VIEWER_LAYERS.map((layer) => (
        <label key={layer} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={layerVisibility[layer] !== false}
            onChange={() => toggleLayer(layer)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {layerLabels[layer] || layer}
        </label>
      ))}
    </div>
  );
}
