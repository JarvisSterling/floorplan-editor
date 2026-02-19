'use client';
import React, { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editor-store';

const LINKABLE_TYPES = ['infrastructure'] as const;
const LINKABLE_LABELS = ['stairs', 'elevator', 'escalator'];

export default function CrossFloorLinkPanel() {
  const {
    objects, selectedObjectIds, floors, currentFloorId, updateObject,
  } = useEditorStore();

  const [targetFloorId, setTargetFloorId] = useState<string>('');
  const [targetObjectId, setTargetObjectId] = useState<string>('');
  const [showPanel, setShowPanel] = useState(false);

  // Get selected object (only show if single linkable object selected)
  const selectedObj = useMemo(() => {
    if (selectedObjectIds.size !== 1) return null;
    const id = Array.from(selectedObjectIds)[0];
    const obj = objects.get(id);
    if (!obj) return null;
    // Check if it's a linkable type
    if (obj.type === 'infrastructure') return obj;
    const label = (obj.label || '').toLowerCase();
    if (LINKABLE_LABELS.some((l) => label.includes(l))) return obj;
    return null;
  }, [selectedObjectIds, objects]);

  // Get current link info
  const currentLink = useMemo(() => {
    if (!selectedObj) return null;
    const meta = selectedObj.metadata as Record<string, unknown>;
    if (meta.linked_floor_id && meta.linked_object_id) {
      return {
        floorId: meta.linked_floor_id as string,
        objectId: meta.linked_object_id as string,
      };
    }
    return null;
  }, [selectedObj]);

  const otherFloors = floors.filter((f) => f.id !== currentFloorId);

  if (!selectedObj) return null;

  const handleLink = () => {
    if (!targetFloorId || !targetObjectId) return;
    updateObject(selectedObj.id, {
      metadata: {
        ...selectedObj.metadata,
        linked_floor_id: targetFloorId,
        linked_object_id: targetObjectId,
      },
    });
    setShowPanel(false);
  };

  const handleUnlink = () => {
    const meta = { ...selectedObj.metadata } as Record<string, unknown>;
    delete meta.linked_floor_id;
    delete meta.linked_object_id;
    updateObject(selectedObj.id, { metadata: meta });
  };

  return (
    <div className="border-t border-gray-200 p-3 bg-white">
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
        Cross-Floor Link
      </h4>

      {currentLink ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1">
            <span>🔗</span>
            <span>
              Linked to {floors.find((f) => f.id === currentLink.floorId)?.name || 'Unknown'}
            </span>
          </div>
          <button
            onClick={handleUnlink}
            className="text-xs text-red-600 hover:text-red-700 underline"
          >
            Remove link
          </button>
        </div>
      ) : showPanel ? (
        <div className="space-y-2">
          <select
            value={targetFloorId}
            onChange={(e) => { setTargetFloorId(e.target.value); setTargetObjectId(''); }}
            className="w-full text-xs border rounded px-2 py-1"
          >
            <option value="">Select target floor...</option>
            {otherFloors.map((f) => (
              <option key={f.id} value={f.id}>{f.name} (L{f.floor_number})</option>
            ))}
          </select>
          {targetFloorId && (
            <input
              type="text"
              placeholder="Target object ID"
              value={targetObjectId}
              onChange={(e) => setTargetObjectId(e.target.value)}
              className="w-full text-xs border rounded px-2 py-1"
            />
          )}
          <div className="flex gap-1">
            <button
              onClick={handleLink}
              disabled={!targetFloorId || !targetObjectId}
              className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Link
            </button>
            <button
              onClick={() => setShowPanel(false)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-0.5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowPanel(true)}
          disabled={otherFloors.length === 0}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
        >
          + Link to another floor
        </button>
      )}
    </div>
  );
}
