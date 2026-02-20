'use client';
import React, { useRef } from 'react';
import { useEditorStore, GRID_SIZES, type ToolType } from '@/store/editor-store';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className="h-12 bg-card border-b border-border flex items-center px-3 gap-1.5 shrink-0">
      {/* Tools */}
      <div className="flex items-center gap-0.5">
        {tools.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={activeTool === t.id}
                onPressedChange={() => setActiveTool(t.id)}
                className="w-8 h-8 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {t.icon}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>{t.label}{t.shortcut ? ` (${t.shortcut})` : ''}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={undoStack.length === 0}>
              <span className="text-sm">↩</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0}>
              <span className="text-sm">↪</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => { if (selectedObjectIds.size > 0) removeObjects(Array.from(selectedObjectIds)); }}
            disabled={selectedObjectIds.size === 0}
          >
            <span className="text-sm">🗑</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Selected (Del)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(zoom / 1.2)}>
              <span className="text-xs">−</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom Out</TooltipContent>
        </Tooltip>
        <span className="text-xs text-muted-foreground w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(zoom * 1.2)}>
              <span className="text-xs">+</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zoom In</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={() => { setZoom(1); setPan(0, 0); }}>
              <span className="text-xs">⌂</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Grid Controls */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle size="sm" pressed={gridVisible} onPressedChange={toggleGrid} className="h-7 px-2 text-xs">
              Grid
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Toggle Grid Visibility</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle size="sm" pressed={snapEnabled} onPressedChange={toggleSnap} className="h-7 px-2 text-xs">
              Snap
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Toggle Snap to Grid</TooltipContent>
        </Tooltip>
        <Select value={String(gridSize)} onValueChange={(v) => setGridSize(Number(v))}>
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRID_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}m</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Unit */}
      <Select value={unit} onValueChange={(v) => setUnit(v as 'm' | 'ft')}>
        <SelectTrigger className="h-7 w-20 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="m">Meters</SelectItem>
          <SelectItem value="ft">Feet</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Background Image Upload */}
      <div className="flex items-center gap-1.5">
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => fileInputRef.current?.click()}>
              🖼 BG
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload Background Blueprint</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-20">
              <Slider
                value={[backgroundOpacity]}
                onValueChange={([v]) => setBackgroundOpacity(v)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Background Opacity: {Math.round(backgroundOpacity * 100)}%</TooltipContent>
        </Tooltip>
      </div>

      {/* Save Status */}
      <div className="ml-auto">
        <Badge
          variant={
            saveStatus === 'saved' ? 'default' :
            saveStatus === 'saving' ? 'secondary' :
            saveStatus === 'error' ? 'destructive' :
            'outline'
          }
          className={`text-xs ${
            saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
            saveStatus === 'saving' ? 'bg-blue-50 text-blue-600 border-blue-200' :
            saveStatus === 'error' ? 'bg-red-50 text-red-600 border-red-200' :
            'bg-amber-50 text-amber-600 border-amber-200'
          }`}
        >
          {saveStatus === 'saved' ? '✓ Saved' :
           saveStatus === 'saving' ? '⟳ Saving...' :
           saveStatus === 'error' ? '✕ Error' :
           '● Unsaved'}
        </Badge>
      </div>
    </div>
  );
}
