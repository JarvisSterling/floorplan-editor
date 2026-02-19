'use client';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';
import Toolbar from '@/components/toolbar/Toolbar';
import LayerPanel from '@/components/panels/LayerPanel';
import PropertiesPanel from '@/components/panels/PropertiesPanel';
import ObjectLibrary from '@/components/panels/ObjectLibrary';
import FloorPanel from '@/components/panels/FloorPanel';
import Rulers from '@/components/editor/Rulers';
import Minimap from '@/components/editor/Minimap';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';
import useAutoSave from '@/hooks/useAutoSave';
import ContextMenu from '@/components/editor/ContextMenu';
import { useEditorStore } from '@/store/editor-store';

const EditorCanvas = dynamic(() => import('@/components/editor/Canvas'), { ssr: false });

export default function EditorPage() {
  useKeyboardShortcuts();
  useAutoSave();

  const { loadFloors, currentFloorId, floors } = useEditorStore();

  // Load floors on mount (using event_id from URL or default)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event_id') || 'demo';
    loadFloors(eventId);
  }, [loadFloors]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
      <Toolbar />
      {/* Floor indicator bar */}
      {currentFloorId && floors.length > 1 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-1 flex items-center gap-2">
          <span className="text-xs text-blue-700 font-medium">
            📍 {floors.find((f) => f.id === currentFloorId)?.name || 'Unknown Floor'}
          </span>
          <span className="text-[10px] text-blue-500">
            ({floors.length} floors)
          </span>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <FloorPanel />
        <ObjectLibrary />
        <LayerPanel />
        <div className="flex-1 relative">
          <Rulers />
          <div className="absolute" style={{ top: 24, left: 24, right: 0, bottom: 0 }}>
            <EditorCanvas />
          </div>
          <Minimap />
        </div>
        <PropertiesPanel />
      </div>
      <ContextMenu />
    </div>
  );
}
