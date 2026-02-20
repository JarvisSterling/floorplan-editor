'use client';
import React, { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlan } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function FloorItem({
  floor,
  isActive,
  isDefault,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  onSetDefault,
  dragHandlers,
}: {
  floor: FloorPlan;
  isActive: boolean;
  isDefault: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onSetDefault: () => void;
  dragHandlers: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(floor.name);

  const handleRename = () => {
    if (name.trim() && name !== floor.name) {
      onRename(name.trim());
    }
    setEditing(false);
  };

  const hasLinks = !!(floor.metadata && (floor.metadata as Record<string, unknown>).has_cross_floor_links);

  return (
    <div
      draggable
      {...dragHandlers}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all duration-150 ${
        isActive
          ? 'bg-accent border-border shadow-sm'
          : 'border-transparent hover:bg-accent/50'
      }`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-muted-foreground group-hover:text-foreground cursor-grab text-xs select-none transition-colors">⠿</span>
        </TooltipTrigger>
        <TooltipContent side="left">Drag to reorder</TooltipContent>
      </Tooltip>

      <div className="flex-1 min-w-0">
        {editing ? (
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setName(floor.name); setEditing(false); }
            }}
            className="h-6 text-xs"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-foreground truncate">
              {floor.name}
            </span>
            {isDefault && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-yellow-600 text-xs">★</span>
                </TooltipTrigger>
                <TooltipContent>Default floor</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground">
          L{floor.floor_number} • {floor.width_m}×{floor.height_m}m
          {hasLinks && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-1">🔗</span>
              </TooltipTrigger>
              <TooltipContent>Has cross-floor links</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs">⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            ✏️ Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            📋 Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetDefault(); }}>
            {isDefault ? '★ Default' : '☆ Set as default'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            🗑 Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function FloorPanel() {
  const {
    floors, currentFloorId, switchFloor, addFloor, deleteFloor,
    duplicateFloor, updateFloor, reorderFloors, setDefaultFloor,
  } = useEditorStore();

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleAdd = useCallback(async () => {
    const newFloor = await addFloor({});
    if (newFloor) {
      await switchFloor(newFloor.id);
    }
  }, [addFloor, switchFloor]);

  const handleDelete = useCallback(async (floorId: string) => {
    if (floors.length <= 1) return;
    if (!confirm('Delete this floor and all its objects?')) return;
    await deleteFloor(floorId);
  }, [floors.length, deleteFloor]);

  const handleDuplicate = useCallback(async (floorId: string) => {
    const newFloor = await duplicateFloor(floorId);
    if (newFloor) {
      await switchFloor(newFloor.id);
    }
  }, [duplicateFloor, switchFloor]);

  const handleRename = useCallback(async (floorId: string, name: string) => {
    await updateFloor(floorId, { name });
  }, [updateFloor]);

  const handleSetDefault = useCallback(async (floorId: string) => {
    try {
      await setDefaultFloor(floorId);
    } catch (error) {
      console.error('Failed to set default floor:', error);
    }
  }, [setDefaultFloor]);

  const makeDragHandlers = (index: number) => ({
    onDragStart: (e: React.DragEvent) => {
      setDragIdx(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === index) return;
      const newOrder = [...floors];
      const [moved] = newOrder.splice(dragIdx, 1);
      newOrder.splice(index, 0, moved);
      reorderFloors(newOrder.map((f) => f.id));
      setDragIdx(null);
    },
  });

  return (
    <div className="w-52 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Floors</h3>
        <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>
          + Add
        </Button>
      </div>

      {/* Floor list */}
      <ScrollArea className="flex-1 p-2">
        {floors.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">
            No floors yet.<br />Click &quot;+ Add&quot; to create one.
          </div>
        ) : (
          <div className="space-y-1">
            {floors.map((floor, idx) => {
              const isDefault = !!(floor.metadata && (floor.metadata as Record<string, unknown>).is_default);
              return (
                <FloorItem
                  key={floor.id}
                  floor={floor}
                  isActive={floor.id === currentFloorId}
                  isDefault={isDefault}
                  onSelect={() => switchFloor(floor.id)}
                  onDelete={() => handleDelete(floor.id)}
                  onDuplicate={() => handleDuplicate(floor.id)}
                  onRename={(name) => handleRename(floor.id, name)}
                  onSetDefault={() => handleSetDefault(floor.id)}
                  dragHandlers={makeDragHandlers(idx)}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Current floor info */}
      {currentFloorId && (
        <FloorSettings floorId={currentFloorId} />
      )}
    </div>
  );
}

function FloorSettings({ floorId }: { floorId: string }) {
  const { floors, updateFloor } = useEditorStore();
  const floor = floors.find((f) => f.id === floorId);
  if (!floor) return null;

  return (
    <div className="border-t border-border bg-muted/30 p-3 space-y-2">
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Floor Settings</h4>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground">Grid (m)</Label>
          <Input
            type="number"
            value={floor.grid_size_m}
            min={0.1}
            step={0.1}
            onChange={(e) => updateFloor(floorId, { grid_size_m: Number(e.target.value) })}
            className="h-7 text-xs mt-0.5"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Scale (px/m)</Label>
          <Input
            type="number"
            value={floor.scale_px_per_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { scale_px_per_m: Number(e.target.value) })}
            className="h-7 text-xs mt-0.5"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Width (m)</Label>
          <Input
            type="number"
            value={floor.width_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { width_m: Number(e.target.value) })}
            className="h-7 text-xs mt-0.5"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Height (m)</Label>
          <Input
            type="number"
            value={floor.height_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { height_m: Number(e.target.value) })}
            className="h-7 text-xs mt-0.5"
          />
        </div>
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground">Background URL</Label>
        <Input
          type="text"
          value={floor.background_image_url || ''}
          placeholder="https://..."
          onChange={(e) => updateFloor(floorId, { background_image_url: e.target.value || null })}
          className="h-7 text-xs mt-0.5"
        />
      </div>
    </div>
  );
}
