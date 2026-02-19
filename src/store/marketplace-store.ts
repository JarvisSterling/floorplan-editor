import { create } from 'zustand';
import type { MarketplaceBooth, FloorPlan, FloorPlanObject, BoothCategory, BoothStatus } from '@/types/database';

export interface MarketplaceFilters {
  statuses: BoothStatus[];
  categories: BoothCategory[];
  minSize: number | null;
  maxSize: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  zone: string | null;
}

export type SortField = 'price' | 'size' | 'booth_number';
export type SortDir = 'asc' | 'desc';

interface MarketplaceState {
  floorPlan: FloorPlan | null;
  objects: FloorPlanObject[];
  booths: MarketplaceBooth[];
  loading: boolean;
  error: string | null;

  filters: MarketplaceFilters;
  sortField: SortField;
  sortDir: SortDir;

  selectedBoothId: string | null;
  hoveredBoothId: string | null;

  zoom: number;
  panX: number;
  panY: number;

  setData: (fp: FloorPlan, objects: FloorPlanObject[], booths: MarketplaceBooth[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setFilters: (f: Partial<MarketplaceFilters>) => void;
  setSort: (field: SortField, dir: SortDir) => void;
  setSelectedBoothId: (id: string | null) => void;
  setHoveredBoothId: (id: string | null) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
}

const defaultFilters: MarketplaceFilters = {
  statuses: ['available'],
  categories: [],
  minSize: null,
  maxSize: null,
  minPrice: null,
  maxPrice: null,
  zone: null,
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  floorPlan: null,
  objects: [],
  booths: [],
  loading: true,
  error: null,
  filters: { ...defaultFilters },
  sortField: 'booth_number',
  sortDir: 'asc',
  selectedBoothId: null,
  hoveredBoothId: null,
  zoom: 1,
  panX: 0,
  panY: 0,

  setData: (fp, objects, booths) => set({ floorPlan: fp, objects, booths, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setSort: (sortField, sortDir) => set({ sortField, sortDir }),
  setSelectedBoothId: (selectedBoothId) => set({ selectedBoothId }),
  setHoveredBoothId: (hoveredBoothId) => set({ hoveredBoothId }),
  setZoom: (zoom) => set({ zoom: Math.min(5, Math.max(0.1, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
}));

/** Filter and sort booths based on current store state */
export function getFilteredBooths(booths: MarketplaceBooth[], filters: MarketplaceFilters, sortField: SortField, sortDir: SortDir): MarketplaceBooth[] {
  let result = booths.filter((b) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(b.status)) return false;
    if (filters.categories.length > 0 && b.category && !filters.categories.includes(b.category)) return false;
    if (filters.minSize != null && (b.size_sqm ?? 0) < filters.minSize) return false;
    if (filters.maxSize != null && (b.size_sqm ?? Infinity) > filters.maxSize) return false;
    if (filters.minPrice != null && (b.price ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice != null && (b.price ?? Infinity) > filters.maxPrice) return false;
    return true;
  });

  result.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'price': cmp = (a.price ?? 0) - (b.price ?? 0); break;
      case 'size': cmp = (a.size_sqm ?? 0) - (b.size_sqm ?? 0); break;
      case 'booth_number': cmp = a.booth_number.localeCompare(b.booth_number); break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  return result;
}
