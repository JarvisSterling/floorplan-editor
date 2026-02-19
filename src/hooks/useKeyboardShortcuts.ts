'use client';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/editor-store';

export default function useKeyboardShortcuts() {
  const { setActiveTool, undo, redo, removeObjects, selectedObjectIds, clearSelection } = useEditorStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedObjectIds.size > 0) removeObjects(Array.from(selectedObjectIds)); }
      if (e.key === 'Escape') { clearSelection(); setActiveTool('select'); }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'r' || e.key === 'R') setActiveTool('rect');
      if (e.key === 'c' || e.key === 'C') setActiveTool('circle');
      if (e.key === 'p' || e.key === 'P') setActiveTool('polygon');
      if (e.key === 'l' || e.key === 'L') setActiveTool('line');
      if (e.key === 't' || e.key === 'T') setActiveTool('text');
      if (e.key === 'd' || e.key === 'D') setActiveTool('dimension');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTool, undo, redo, removeObjects, selectedObjectIds, clearSelection]);
}
