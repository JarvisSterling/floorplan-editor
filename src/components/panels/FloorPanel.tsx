'use client';
import React, { useState, useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlan } from '@/types/database';

function FloorItem({
  floor,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  dragHandlers,
}: {
  floor: FloorPlan;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
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

  // Cross-floor link indicator
  const hasLinks = !!(floor.metadata && (floor.metadata as Record<string, unknown>).has_cross_floor_links);

  return (
    <div
      draggable
      {...dragHandlers}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${
        isActive
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'bg-white border-gray-150 hover:bg-gray-50 hover:border-gray-250'
      }`}
    >
      {/* Drag handle */}
      <span className="text-gray-300 group-hover:text-gray-500 cursor-grab text-xs select-none">⠿</span>

      {/* Floor info */}
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
            className="w-full text-xs font-medium px-1 py-0.5 border rounded"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="text-xs font-medium text-gray-800 truncate">
            {floor.name}
          </div>
        )}
        <div className="text-[10px] text-gray-400">
          L{floor.floor_number} • {floor.width_m}×{floor.height_m}m
          {hasLinks && <span className="ml-1" title="Has cross-floor links">🔗</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 text-xs px-1"
        >
          ⋯
        </button>
        {showMenu && (
          <div
            className="absolute right-0 top-6 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
            onMouseLeave={() => setShowMenu(false)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              ✏️ Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              📋 Duplicate
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
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
    duplicateFloor, updateFloor, reorderFloors,
  } = useEditorStore();

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleAdd = useCallback(async () => {
    const newFloor = await addFloor({});
    if (newFloor) {
      await switchFloor(newFloor.id);
    }
  }, [addFloor, switchFloor]);

  const handleDelete = useCallback(async (floorId: string) => {
    if (floors.length <= 1) return; // don't delete last floor
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
    <div className="w-52 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
        <h3 className="text-xs font-semibold text-gray-700">Floors</h3>
        <button
          onClick={handleAdd}
          className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors"
          title="Add floor"
        >
          + Add
        </button>
      </div>

      {/* Floor list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {floors.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">
            No floors yet.<br />Click &quot;+ Add&quot; to create one.
          </div>
        ) : (
          floors.map((floor, idx) => (
            <FloorItem
              key={floor.id}
              floor={floor}
              isActive={floor.id === currentFloorId}
              onSelect={() => switchFloor(floor.id)}
              onDelete={() => handleDelete(floor.id)}
              onDuplicate={() => handleDuplicate(floor.id)}
              onRename={(name) => handleRename(floor.id, name)}
              dragHandlers={makeDragHandlers(idx)}
            />
          ))
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
    <div className="border-t border-gray-200 bg-white p-3 space-y-2">
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase">Floor Settings</h4>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="text-[10px] text-gray-500">
          Grid (m)
          <input
            type="number"
            value={floor.grid_size_m}
            min={0.1}
            step={0.1}
            onChange={(e) => updateFloor(floorId, { grid_size_m: Number(e.target.value) })}
            className="w-full mt-0.5 px-1.5 py-0.5 text-xs border rounded"
          />
        </label>
        <label className="text-[10px] text-gray-500">
          Scale (px/m)
          <input
            type="number"
            value={floor.scale_px_per_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { scale_px_per_m: Number(e.target.value) })}
            className="w-full mt-0.5 px-1.5 py-0.5 text-xs border rounded"
          />
        </label>
        <label className="text-[10px] text-gray-500">
          Width (m)
          <input
            type="number"
            value={floor.width_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { width_m: Number(e.target.value) })}
            className="w-full mt-0.5 px-1.5 py-0.5 text-xs border rounded"
          />
        </label>
        <label className="text-[10px] text-gray-500">
          Height (m)
          <input
            type="number"
            value={floor.height_m}
            min={1}
            onChange={(e) => updateFloor(floorId, { height_m: Number(e.target.value) })}
            className="w-full mt-0.5 px-1.5 py-0.5 text-xs border rounded"
          />
        </label>
      </div>
      <label className="block text-[10px] text-gray-500">
        Background URL
        <input
          type="text"
          value={floor.background_image_url || ''}
          placeholder="https://..."
          onChange={(e) => updateFloor(floorId, { background_image_url: e.target.value || null })}
          className="w-full mt-0.5 px-1.5 py-0.5 text-xs border rounded"
        />
      </label>
    </div>
  );
}
