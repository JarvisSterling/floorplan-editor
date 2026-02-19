'use client';
import dynamic from 'next/dynamic';
import React from 'react';
import Toolbar from '@/components/toolbar/Toolbar';
import LayerPanel from '@/components/panels/LayerPanel';
import PropertiesPanel from '@/components/panels/PropertiesPanel';
import Rulers from '@/components/editor/Rulers';
import Minimap from '@/components/editor/Minimap';
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts';

const EditorCanvas = dynamic(() => import('@/components/editor/Canvas'), { ssr: false });

export default function EditorPage() {
  useKeyboardShortcuts();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
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
    </div>
  );
}
