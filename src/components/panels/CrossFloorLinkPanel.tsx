'use client';
import React, { useState, useMemo } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <div className="pt-3">
      <Separator className="mb-3" />
      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Cross-Floor Link
      </h4>

      {currentLink ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 rounded-md px-2 py-1.5">
            <span>🔗</span>
            <span>
              Linked to {floors.find((f) => f.id === currentLink.floorId)?.name || 'Unknown'}
            </span>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-xs text-destructive p-0 h-auto"
            onClick={handleUnlink}
          >
            Remove link
          </Button>
        </div>
      ) : showPanel ? (
        <div className="space-y-2">
          <Select value={targetFloorId} onValueChange={(v) => { setTargetFloorId(v); setTargetObjectId(''); }}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select target floor..." />
            </SelectTrigger>
            <SelectContent>
              {otherFloors.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name} (L{f.floor_number})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {targetFloorId && (
            <Select value={targetObjectId} onValueChange={setTargetObjectId}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select target object..." />
              </SelectTrigger>
              <SelectContent>
                {targetFloorObjects.map((obj) => (
                  <SelectItem key={obj.id} value={obj.id}>
                    {obj.label || obj.type} ({obj.x.toFixed(1)}, {obj.y.toFixed(1)})
                  </SelectItem>
                ))}
                {targetFloorObjects.length === 0 && (
                  <SelectItem value="" disabled>No linkable objects found</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              className="text-xs h-7"
              onClick={handleLink}
              disabled={!targetFloorId || !targetObjectId}
            >
              Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowPanel(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs p-0 h-auto text-muted-foreground hover:text-foreground"
          onClick={() => setShowPanel(true)}
          disabled={otherFloors.length === 0}
        >
          + Link to another floor
        </Button>
      )}
    </div>
  );
}
