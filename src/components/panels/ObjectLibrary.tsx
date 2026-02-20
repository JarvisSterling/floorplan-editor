'use client';
import React, { useState, useMemo } from 'react';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, type LibraryItem } from '@/lib/object-library';
import Tooltip from '@/components/ui/Tooltip';

interface ObjectLibraryProps {
  className?: string;
}

export default function ObjectLibrary({ className }: ObjectLibraryProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return LIBRARY_ITEMS;
    const q = search.toLowerCase();
    return LIBRARY_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [search]);

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleDragStart = (e: React.DragEvent, item: LibraryItem) => {
    e.dataTransfer.setData('application/x-library-item', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={`w-56 glass-panel flex flex-col overflow-hidden ${className ?? ''}`}>
      <div className="p-3 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Object Library</h3>
        <input
          type="text"
          placeholder="Search objects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dark-input w-full"
        />
      </div>
      <div className="flex-1 overflow-y-auto dark-scrollbar">
        {LIBRARY_CATEGORIES.map((cat) => {
          const items = filtered.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 bg-white/[0.03] hover:bg-white/[0.06] border-b border-white/[0.04] transition-colors duration-150"
              >
                <span>{cat}</span>
                <span className="text-slate-500">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed && (
                <div className="py-0.5">
                  {items.map((item) => (
                    <Tooltip key={item.id} content={`${item.name} — ${item.widthM}×${item.heightM}m · Drag to canvas`} position="right">
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-grab hover:bg-indigo-500/15 active:cursor-grabbing text-sm transition-all duration-150 group"
                      >
                        <span className="text-base flex-shrink-0 w-5 text-center group-hover:scale-110 transition-transform duration-150">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-500">{item.widthM}×{item.heightM}m</div>
                        </div>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
