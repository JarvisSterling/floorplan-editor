'use client';
import React, { useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlan } from '@/types/database';
import Tooltip from '@/components/ui/Tooltip';

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
  const [showMenu, setShowMenu] = useState(false);

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
          ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
      }`}
    >
      <Tooltip content="Drag to reorder" position="left">
        <span className="text-slate-600 group-hover:text-slate-400 cursor-grab text-xs select-none transition-colors">⠿</span>
      </Tooltip>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setName(floor.name); setEditing(false); }
            }}
            className="dark-input w-full text-xs font-medium"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center gap-1">
            <div className="text-xs font-medium text-slate-200 truncate">
              {floor.name}
            </div>
            {isDefault && (
              <Tooltip content="Default floor">
                <span className="text-yellow-400 text-xs">★</span>
              </Tooltip>
            )}
          </div>
        )}
        <div className="text-[10px] text-slate-500">
          L{floor.floor_number} • {floor.width_m}×{floor.height_m}m
          {hasLinks && (
            <Tooltip content="Has cross-floor links">
              <span className="ml-1">🔗</span>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 text-xs px-1 transition-all duration-150"
        >
          ⋯
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-6 z-50 bg-[#1e1e3a] border border-white/[0.1] rounded-lg shadow-xl py-1 min-w-[120px]"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              ✏️ Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              📋 Duplicate
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSetDefault(); setShowMenu(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                isDefault 
                  ? 'text-yellow-300 bg-yellow-500/10' 
                  : 'text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              {isDefault ? '★ Default' : '☆ Set as default'}
            </button>
            <hr className="my-1 border-white/[0.06]" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>
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
    <div className="w-52 glass-panel flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-slate-300">Floors</h3>
        <Tooltip content="Add a new floor">
          <button
            onClick={handleAdd}
            className="text-xs bg-indigo-500 text-white px-2.5 py-1 rounded-md hover:bg-indigo-400 transition-colors duration-150 shadow-sm shadow-indigo-500/20"
          >
            + Add
          </button>
        </Tooltip>
      </div>

      {/* Floor list */}
      <div className="flex-1 overflow-y-auto dark-scrollbar p-2 space-y-1">
        {floors.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">
            No floors yet.<br />Click &quot;+ Add&quot; to create one.
          </div>
        ) : (
          floors.map((floor, idx) => {
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
          })
        )}
      </div>

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
    <div className="border-t border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Floor Settings</h4>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="text-[10px] text-slate-500">
          Grid (m)
          <input
            type="number"
            value={floor.grid_size_m}
            min={0.1}
            step={0.1}
            onChange={(e) => updateFloor(floorId, { grid_size_m: Number(e.target.value) })}
            className="dark-input w-full mt-0.5"
          />
        </label>
        <label className="text-[10px] text-slate-500">
          Scale (px/m)
          <input
            type="number"
            value={floor.scale_px_per_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { scale_px_per_m: Number(e.target.value) })}
            className="dark-input w-full mt-0.5"
          />
        </label>
        <label className="text-[10px] text-slate-500">
          Width (m)
          <input
            type="number"
            value={floor.width_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { width_m: Number(e.target.value) })}
            className="dark-input w-full mt-0.5"
          />
        </label>
        <label className="text-[10px] text-slate-500">
          Height (m)
          <input
            type="number"
            value={floor.height_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { height_m: Number(e.target.value) })}
            className="dark-input w-full mt-0.5"
          />
        </label>
      </div>
      <label className="block text-[10px] text-slate-500">
        Background URL
        <input
          type="text"
          value={floor.background_image_url || ''}
          placeholder="https://..."
          onChange={(e) => updateFloor(floorId, { background_image_url: e.target.value || null })}
          className="dark-input w-full mt-0.5"
        />
      </label>
    </div>
  );
}
