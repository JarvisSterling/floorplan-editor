'use client';
import React, { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editor-store';
import Tooltip from '@/components/ui/Tooltip';

const LINKABLE_LABELS = ['stairs', 'elevator', 'escalator'];

export default function CrossFloorLinkPanel() {
  const {
    objects, selectedObjectIds, floors, currentFloorId, updateObject,
  } = useEditorStore();

  const [targetFloorId, setTargetFloorId] = useState<string>('');
  const [targetObjectId, setTargetObjectId] = useState<string>('');
  const [showPanel, setShowPanel] = useState(false);

  const selectedObj = useMemo(() => {
    if (selectedObjectIds.size !== 1) return null;
    const id = Array.from(selectedObjectIds)[0];
    const obj = objects.get(id);
    if (!obj) return null;
    if (obj.type === 'infrastructure') return obj;
    const label = (obj.label || '').toLowerCase();
    if (LINKABLE_LABELS.some((l) => label.includes(l))) return obj;
    return null;
  }, [selectedObjectIds, objects]);

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

  const targetFloorObjects = useMemo(() => {
    if (!targetFloorId) return [];
    return Array.from(objects.values()).filter(obj => {
      if (obj.type === 'infrastructure') return true;
      const label = (obj.label || '').toLowerCase();
      return LINKABLE_LABELS.some((l) => label.includes(l));
    });
  }, [targetFloorId, objects]);

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
    <div className="border-t border-white/[0.06] p-3">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Cross-Floor Link
      </h4>

      {currentLink ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/15 rounded-md px-2 py-1.5">
            <span>🔗</span>
            <span>
              Linked to {floors.find((f) => f.id === currentLink.floorId)?.name || 'Unknown'}
            </span>
          </div>
          <Tooltip content="Remove the cross-floor link">
            <button
              onClick={handleUnlink}
              className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
            >
              Remove link
            </button>
          </Tooltip>
        </div>
      ) : showPanel ? (
        <div className="space-y-2">
          <select
            value={targetFloorId}
            onChange={(e) => { setTargetFloorId(e.target.value); setTargetObjectId(''); }}
            className="dark-select w-full"
          >
            <option value="">Select target floor...</option>
            {otherFloors.map((f) => (
              <option key={f.id} value={f.id}>{f.name} (L{f.floor_number})</option>
            ))}
          </select>
          {targetFloorId && (
            <select
              value={targetObjectId}
              onChange={(e) => setTargetObjectId(e.target.value)}
              className="dark-select w-full"
            >
              <option value="">Select target object...</option>
              {targetFloorObjects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.label || obj.type} ({obj.x.toFixed(1)}, {obj.y.toFixed(1)})
                </option>
              ))}
              {targetFloorObjects.length === 0 && (
                <option value="" disabled>No linkable objects found</option>
              )}
            </select>
          )}
          <div className="flex gap-1">
            <Tooltip content="Create cross-floor link">
              <button
                onClick={handleLink}
                disabled={!targetFloorId || !targetObjectId}
                className="text-xs bg-indigo-500 text-white px-2.5 py-1 rounded-md hover:bg-indigo-400 disabled:opacity-50 transition-all duration-150"
              >
                Link
              </button>
            </Tooltip>
            <button
              onClick={() => setShowPanel(false)}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <Tooltip content="Link this object to an object on another floor">
          <button
            onClick={() => setShowPanel(true)}
            disabled={otherFloors.length === 0}
            className="text-xs text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors"
          >
            + Link to another floor
          </button>
        </Tooltip>
      )}
    </div>
  );
}
