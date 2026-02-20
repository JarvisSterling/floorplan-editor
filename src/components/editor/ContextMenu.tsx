'use client';
import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editor-store';

export default function ContextMenu() {
  const { contextMenu, setContextMenu, objects, booths, convertToBooth, removeBooth } = useEditorStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const obj = objects.get(contextMenu.objectId);
  if (!obj) return null;

  const isBooth = obj.type === 'booth' || booths.has(contextMenu.objectId);

  return (
    <div
      ref={ref}
      className="fixed bg-popover border border-border rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {!isBooth && (
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-popover-foreground hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            convertToBooth(contextMenu.objectId);
            setContextMenu(null);
          }}
        >
          🏪 Convert to Booth
        </button>
      )}
      {isBooth && (
        <button
          className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            removeBooth(contextMenu.objectId);
            setContextMenu(null);
          }}
        >
          ✕ Remove Booth
        </button>
      )}
      <button
        className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
      >
        Cancel
      </button>
    </div>
  );
}
