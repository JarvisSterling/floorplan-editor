'use client';
import React, { useState, useMemo } from 'react';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, type LibraryItem } from '@/lib/object-library';

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
    <div className={`w-56 bg-white border-r border-gray-200 flex flex-col overflow-hidden ${className ?? ''}`}>
      <div className="p-2 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Object Library</h3>
        <input
          type="text"
          placeholder="Search objects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {LIBRARY_CATEGORIES.map((cat) => {
          const items = filtered.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border-b border-gray-200"
              >
                <span>{cat}</span>
                <span className="text-gray-400">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed && (
                <div className="py-0.5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className="flex items-center gap-2 px-2 py-1 mx-1 rounded cursor-grab hover:bg-blue-50 active:cursor-grabbing text-sm"
                      title={`${item.name} (${item.widthM}×${item.heightM}m)`}
                    >
                      <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs text-gray-800">{item.name}</div>
                        <div className="text-[10px] text-gray-400">{item.widthM}×{item.heightM}m</div>
                      </div>
                    </div>
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
