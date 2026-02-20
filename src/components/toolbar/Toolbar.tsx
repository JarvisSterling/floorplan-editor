'use client';
import React, { useRef } from 'react';
import { useEditorStore, GRID_SIZES, type ToolType } from '@/store/editor-store';
import Tooltip from '@/components/ui/Tooltip';

const tools: { id: ToolType; label: string; icon: string; shortcut?: string }[] = [
  { id: 'select', label: 'Select Tool', icon: '↖', shortcut: 'V' },
  { id: 'rect', label: 'Draw Rectangle', icon: '▭', shortcut: 'R' },
  { id: 'circle', label: 'Draw Circle', icon: '○', shortcut: 'C' },
  { id: 'polygon', label: 'Draw Polygon', icon: '⬠', shortcut: 'P' },
  { id: 'line', label: 'Draw Line/Wall', icon: '╱', shortcut: 'L' },
  { id: 'text', label: 'Add Text', icon: 'T', shortcut: 'T' },
  { id: 'dimension', label: 'Dimension Line', icon: '↔', shortcut: 'D' },
];

export default function Toolbar() {
  const {
    activeTool, setActiveTool,
    zoom, setZoom, setPan,
    gridSize, setGridSize, gridVisible, toggleGrid, snapEnabled, toggleSnap,
    unit, setUnit, undo, redo, undoStack, redoStack,
    removeObjects, selectedObjectIds,
    setBackgroundImage, backgroundOpacity, setBackgroundOpacity,
    saveStatus,
  } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-12 bg-[#1a1a2e] border-b border-white/[0.06] flex items-center px-3 gap-1 shrink-0 shadow-lg">
      {/* Tools */}
      <div className="flex items-center gap-0.5 border-r border-white/[0.08] pr-2 mr-2">
        {tools.map((t) => (
          <Tooltip key={t.id} content={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}>
            <button
              onClick={() => setActiveTool(t.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all duration-150
                ${activeTool === t.id
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'hover:bg-white/[0.08] text-slate-300 hover:text-white'}`}
            >
              {t.icon}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 border-r border-white/[0.08] pr-2 mr-2">
        <Tooltip content="Undo (Ctrl+Z)">
          <button onClick={undo} disabled={undoStack.length === 0} className="w-8 h-8 flex items-center justify-center rounded-md text-sm text-slate-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-150">↩</button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Y)">
          <button onClick={redo} disabled={redoStack.length === 0} className="w-8 h-8 flex items-center justify-center rounded-md text-sm text-slate-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all duration-150">↪</button>
        </Tooltip>
      </div>

      {/* Delete */}
      <Tooltip content="Delete Selected (Del)">
        <button
          onClick={() => { if (selectedObjectIds.size > 0) removeObjects(Array.from(selectedObjectIds)); }}
          disabled={selectedObjectIds.size === 0}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-30 transition-all duration-150 border-r border-white/[0.08] mr-2"
        >🗑</button>
      </Tooltip>

      {/* Zoom */}
      <div className="flex items-center gap-1 border-r border-white/[0.08] pr-2 mr-2">
        <Tooltip content="Zoom Out">
          <button onClick={() => setZoom(zoom / 1.2)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-150">−</button>
        </Tooltip>
        <span className="text-xs text-slate-400 w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <Tooltip content="Zoom In">
          <button onClick={() => setZoom(zoom * 1.2)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-150">+</button>
        </Tooltip>
        <Tooltip content="Reset View">
          <button onClick={() => { setZoom(1); setPan(0, 0); }} className="text-xs text-slate-400 hover:text-white px-1 transition-colors duration-150">⌂</button>
        </Tooltip>
      </div>

      {/* Grid */}
      <div className="flex items-center gap-1 border-r border-white/[0.08] pr-2 mr-2">
        <Tooltip content="Toggle Grid Visibility">
          <button onClick={toggleGrid} className={`text-xs px-2 py-1 rounded-md transition-all duration-150 ${gridVisible ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/[0.08] hover:text-white'}`}>Grid</button>
        </Tooltip>
        <Tooltip content="Toggle Snap to Grid">
          <button onClick={toggleSnap} className={`text-xs px-2 py-1 rounded-md transition-all duration-150 ${snapEnabled ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-white/[0.08] hover:text-white'}`}>Snap</button>
        </Tooltip>
        <Tooltip content="Grid Size">
          <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="dark-select text-xs py-0.5">
            {GRID_SIZES.map((s) => <option key={s} value={s}>{s}m</option>)}
          </select>
        </Tooltip>
      </div>

      {/* Unit */}
      <Tooltip content="Measurement Unit">
        <select value={unit} onChange={(e) => setUnit(e.target.value as 'm' | 'ft')} className="dark-select text-xs py-0.5">
          <option value="m">Meters</option>
          <option value="ft">Feet</option>
        </select>
      </Tooltip>

      {/* Background Image Upload */}
      <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2 ml-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setBackgroundImage(reader.result as string);
            reader.readAsDataURL(file);
            e.target.value = '';
          }}
        />
        <Tooltip content="Upload Background Blueprint (PNG, SVG, JPG)">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2 py-1 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all duration-150"
          >🖼 BG</button>
        </Tooltip>
        <Tooltip content={`Background Opacity: ${Math.round(backgroundOpacity * 100)}%`}>
          <input
            type="range" min="0" max="1" step="0.05"
            value={backgroundOpacity}
            onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
            className="w-16 dark-range"
          />
        </Tooltip>
      </div>

      {/* Save Status */}
      <div className="ml-auto flex items-center gap-1 text-xs">
        <Tooltip content={saveStatus === 'saved' ? 'All changes saved' : saveStatus === 'saving' ? 'Saving changes...' : saveStatus === 'error' ? 'Save failed' : 'Unsaved changes'}>
          <span className={`px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
            saveStatus === 'saved' ? 'text-emerald-300 bg-emerald-500/15' :
            saveStatus === 'saving' ? 'text-blue-300 bg-blue-500/15' :
            saveStatus === 'error' ? 'text-red-300 bg-red-500/15' :
            'text-amber-300 bg-amber-500/15'
          }`}>
            {saveStatus === 'saved' ? '✓ Saved' :
             saveStatus === 'saving' ? '⟳ Saving...' :
             saveStatus === 'error' ? '✕ Error' :
             '● Unsaved'}
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
