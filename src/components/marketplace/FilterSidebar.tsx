'use client';
import React, { useMemo } from 'react';
import { useMarketplaceStore, type SortField, type SortDir } from '@/store/marketplace-store';
import type { BoothStatus, BoothCategory } from '@/types/database';
import { BOOTH_STATUS_LABELS, BOOTH_STATUS_COLORS } from '@/lib/booth-helpers';

const ALL_STATUSES: BoothStatus[] = ['available', 'reserved', 'sold', 'blocked', 'premium'];
const ALL_CATEGORIES: BoothCategory[] = ['standard', 'island', 'corner', 'inline', 'peninsula'];

export default function FilterSidebar() {
  const { filters, setFilters, sortField, sortDir, setSort, objects } = useMarketplaceStore();
  
  // Get available zones from floor plan objects
  const availableZones = useMemo(() => {
    if (!objects) return [];
    return objects
      .filter(obj => obj.type === 'zone')
      .map(zone => {
        const name = zone.label || (zone.metadata as any)?.name || 'Unnamed Zone';
        return String(name);
      })
      .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
      .sort();
  }, [objects]);

  const toggleStatus = (s: BoothStatus) => {
    const cur = filters.statuses;
    setFilters({ statuses: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s] });
  };

  const toggleCategory = (c: BoothCategory) => {
    const cur = filters.categories;
    setFilters({ categories: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto shrink-0 space-y-5">
      <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Filters</h2>

      {/* Status */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-2">Status</h3>
        <div className="space-y-1">
          {ALL_STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.statuses.includes(s)}
                onChange={() => toggleStatus(s)}
                className="rounded border-gray-300"
              />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: BOOTH_STATUS_COLORS[s] }}
              />
              {BOOTH_STATUS_LABELS[s]}
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-2">Category</h3>
        <div className="space-y-1">
          {ALL_CATEGORIES.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
              <input
                type="checkbox"
                checked={filters.categories.includes(c)}
                onChange={() => toggleCategory(c)}
                className="rounded border-gray-300"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Size Range */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-2">Size (sqm)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minSize ?? ''}
            onChange={(e) => setFilters({ minSize: e.target.value ? Number(e.target.value) : null })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxSize ?? ''}
            onChange={(e) => setFilters({ maxSize: e.target.value ? Number(e.target.value) : null })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-2">Price ($)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ''}
            onChange={(e) => setFilters({ minPrice: e.target.value ? Number(e.target.value) : null })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ''}
            onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : null })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Zone Filter */}
      {availableZones.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Zone</h3>
          <select
            value={filters.zone ?? ''}
            onChange={(e) => setFilters({ zone: e.target.value || null })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Zones</option>
            {availableZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sort */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 mb-2">Sort By</h3>
        <select
          value={`${sortField}_${sortDir}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split('_') as [SortField, SortDir];
            setSort(f, d);
          }}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="booth_number_asc">Booth # (A→Z)</option>
          <option value="booth_number_desc">Booth # (Z→A)</option>
          <option value="price_asc">Price (Low→High)</option>
          <option value="price_desc">Price (High→Low)</option>
          <option value="size_asc">Size (Small→Large)</option>
          <option value="size_desc">Size (Large→Small)</option>
          <option value="proximity_asc">Closest to Entrance</option>
          <option value="proximity_desc">Furthest from Entrance</option>
        </select>
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          setFilters({ 
            statuses: ['available'], 
            categories: [], 
            minSize: null, 
            maxSize: null, 
            minPrice: null, 
            maxPrice: null, 
            zone: null 
          });
          setSort('booth_number', 'asc');
        }}
        className="w-full text-sm text-blue-600 hover:text-blue-800"
      >
        Reset Filters
      </button>
    </aside>
  );
}
