'use client';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

async function saveToApi(floorPlanId: string, objects: Map<string, any>) {
  const objectsArray = Array.from(objects.values());
  try {
    // Save objects in bulk
    await fetch(`/api/floor-plans/${floorPlanId}/objects/bulk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objects: objectsArray }),
    });
    return true;
  } catch {
    return false;
  }
}

export default function useAutoSave() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const doSave = async () => {
      const { isDirty, floorPlanId, objects, setSaveStatus, markClean } = useEditorStore.getState();
      if (!isDirty) return;
      setSaveStatus('saving');
      const ok = await saveToApi(floorPlanId, objects);
      if (ok) {
        markClean();
      } else {
        setSaveStatus('error');
      }
    };

    intervalRef.current = setInterval(doSave, AUTO_SAVE_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
