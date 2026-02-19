'use client';
import React from 'react';
import { useEditorStore, GRID_SIZES, type ToolType } from '@/store/editor-store';

const tools: { id: ToolType; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'rect', label: 'Rectangle', icon: '▭' },
  { id: 'circle', label: 'Circle', icon: '○' },
  { id: 'polygon', label: 'Polygon', icon: '⬠' },
  { id: 'line', label: 'Line/Wall', icon: '╱' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'dimension', label: 'Dimension', icon: '↔' },
];

export default function Toolbar() {
  const {
    activeTool, setActiveTool,
    zoom, setZoom, setPan,
    gridSize, setGridSize, gridVisible, toggleGrid, snapEnabled, toggleSnap,
    unit, setUnit, undo, redo, undoStack, redoStack,
    removeObjects, selectedObjectIds,
  } = useEditorStore();

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center px-3 gap-1 shrink-0">
      {/* Tools */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors
              ${activeTool === t.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-2">
        <button onClick={undo} disabled={undoStack.length === 0} className="w-8 h-8 flex items-center justify-center rounded text-sm hover:bg-gray-100 disabled:opacity-30" title="Undo">↩</button>
        <button onClick={redo} disabled={redoStack.length === 0} className="w-8 h-8 flex items-center justify-center rounded text-sm hover:bg-gray-100 disabled:opacity-30" title="Redo">↪</button>
      </div>

      {/* Delete */}
      <button
        onClick={() => { if (selectedObjectIds.size > 0) removeObjects(Array.from(selectedObjectIds)); }}
        disabled={selectedObjectIds.size === 0}
        className="w-8 h-8 flex items-center justify-center rounded text-sm hover:bg-red-50 text-red-500 disabled:opacity-30 border-r border-gray-200 mr-2"
        title="Delete"
      >🗑</button>

      {/* Zoom */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
        <button onClick={() => setZoom(zoom / 1.2)} className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-100">−</button>
        <span className="text-xs text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom * 1.2)} className="w-7 h-7 flex items-center justify-center rounded text-xs hover:bg-gray-100">+</button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} className="text-xs text-gray-500 hover:text-gray-700 px-1" title="Reset view">⌂</button>
      </div>

      {/* Grid */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
        <button onClick={toggleGrid} className={`text-xs px-2 py-1 rounded ${gridVisible ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Toggle grid">Grid</button>
        <button onClick={toggleSnap} className={`text-xs px-2 py-1 rounded ${snapEnabled ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`} title="Toggle snap">Snap</button>
        <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="text-xs border rounded px-1 py-0.5">
          {GRID_SIZES.map((s) => <option key={s} value={s}>{s}m</option>)}
        </select>
      </div>

      {/* Unit */}
      <select value={unit} onChange={(e) => setUnit(e.target.value as 'm' | 'ft')} className="text-xs border rounded px-1 py-0.5">
        <option value="m">Meters</option>
        <option value="ft">Feet</option>
      </select>
    </div>
  );
}
