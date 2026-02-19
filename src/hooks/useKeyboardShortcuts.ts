'use client';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/editor-store';

export default function useKeyboardShortcuts() {
  const {
    setActiveTool, undo, redo, removeObjects, selectedObjectIds, clearSelection,
    copySelection, pasteClipboard,
    selectAll,
    startSpacePan, endSpacePan,
    objects, updateObject, gridSize,
  } = useEditorStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      // F6: Space pan
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        startSpacePan();
        return;
      }

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedObjectIds.size > 0) removeObjects(Array.from(selectedObjectIds)); }
      if (e.key === 'Escape') { clearSelection(); setActiveTool('select'); }

      // F3: Copy/Paste
      if (ctrl && e.key === 'c') { e.preventDefault(); copySelection(); return; }
      if (ctrl && e.key === 'v') { e.preventDefault(); pasteClipboard(); return; }

      // F5: Select all
      if (ctrl && e.key === 'a') { e.preventDefault(); selectAll(); return; }

      // F4: Arrow key nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedObjectIds.size > 0) {
        e.preventDefault();
        const step = e.shiftKey ? gridSize * 10 : gridSize;
        const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
        const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;
        selectedObjectIds.forEach((id) => {
          const obj = objects.get(id);
          if (obj && !obj.locked) {
            updateObject(id, { x: obj.x + dx, y: obj.y + dy });
          }
        });
        return;
      }

      // Tool shortcuts (only without modifiers)
      if (ctrl) return;
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'r' || e.key === 'R') setActiveTool('rect');
      if (e.key === 'c' || e.key === 'C') setActiveTool('circle');
      if (e.key === 'p' || e.key === 'P') setActiveTool('polygon');
      if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'd' || e.key === 'D') setActiveTool('dimension');
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        endSpacePan();
      }
    };

    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [setActiveTool, undo, redo, removeObjects, selectedObjectIds, clearSelection,
      copySelection, pasteClipboard, selectAll, startSpacePan, endSpacePan,
      objects, updateObject, gridSize]);
}
