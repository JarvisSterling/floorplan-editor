'use client';
import React, { useState, useMemo } from 'react';
import { LIBRARY_CATEGORIES, LIBRARY_ITEMS, type LibraryItem } from '@/lib/object-library';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className={`w-56 bg-card border-r border-border flex flex-col overflow-hidden ${className ?? ''}`}>
      <div className="p-3 border-b border-border">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Object Library</h3>
        <Input
          type="text"
          placeholder="Search objects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      <ScrollArea className="flex-1">
        {LIBRARY_CATEGORIES.map((cat) => {
          const items = filtered.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground bg-muted/50 hover:bg-muted border-b border-border transition-colors duration-150"
              >
                <span>{cat}</span>
                <span className="text-muted-foreground">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed && (
                <div className="py-0.5">
                  {items.map((item) => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, item)}
                          className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md cursor-grab hover:bg-accent active:cursor-grabbing text-sm transition-all duration-150 group"
                        >
                          <span className="text-base flex-shrink-0 w-5 text-center group-hover:scale-110 transition-transform duration-150">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-xs text-foreground">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground">{item.widthM}×{item.heightM}m</div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.name} — {item.widthM}×{item.heightM}m · Drag to canvas</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
