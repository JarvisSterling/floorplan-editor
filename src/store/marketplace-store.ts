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

export type SortField = 'price' | 'size' | 'booth_number' | 'proximity';
export type SortDir = 'asc' | 'desc';

interface MarketplaceState {
  floorPlans: FloorPlan[];
  selectedFloorPlanIndex: number;
  floorPlan: FloorPlan | null; // Current selected floor plan
  objects: FloorPlanObject[]; // Objects for current floor plan
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

  setData: (floorPlans: FloorPlan[], objects: FloorPlanObject[], booths: MarketplaceBooth[]) => void;
  setSelectedFloorPlan: (index: number, objects: FloorPlanObject[]) => void;
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

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  floorPlans: [],
  selectedFloorPlanIndex: 0,
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

  setData: (floorPlans, objects, booths) => set({ 
    floorPlans,
    selectedFloorPlanIndex: 0,
    floorPlan: floorPlans[0] || null, 
    objects, 
    booths, 
    loading: false, 
    error: null 
  }),
  setSelectedFloorPlan: (index, objects) => {
    const { floorPlans } = get();
    if (index >= 0 && index < floorPlans.length) {
      set({ 
        selectedFloorPlanIndex: index,
        floorPlan: floorPlans[index],
        objects
      });
    }
  },
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
export function getFilteredBooths(
  booths: MarketplaceBooth[], 
  filters: MarketplaceFilters, 
  sortField: SortField, 
  sortDir: SortDir,
  objects?: FloorPlanObject[]
): MarketplaceBooth[] {
  let result = booths.filter((b) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(b.status)) return false;
    if (filters.categories.length > 0 && b.category && !filters.categories.includes(b.category)) return false;
    if (filters.minSize != null && (b.size_sqm ?? 0) < filters.minSize) return false;
    if (filters.maxSize != null && (b.size_sqm ?? Infinity) > filters.maxSize) return false;
    if (filters.minPrice != null && (b.price ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice != null && (b.price ?? Infinity) > filters.maxPrice) return false;
    
    // Zone filter
    if (filters.zone != null && objects) {
      const boothObject = objects.find(obj => obj.id === b.object_id);
      if (boothObject) {
        // Find zone objects that contain this booth
        const containingZones = objects
          .filter(obj => obj.type === 'zone')
          .filter(zone => {
            // Check if booth center is inside zone bounds
            const boothCenterX = boothObject.x + (boothObject.width ?? 0) / 2;
            const boothCenterY = boothObject.y + (boothObject.height ?? 0) / 2;
            
            if (zone.shape === 'rect') {
              return boothCenterX >= zone.x &&
                     boothCenterX <= zone.x + (zone.width ?? 0) &&
                     boothCenterY >= zone.y &&
                     boothCenterY <= zone.y + (zone.height ?? 0);
            }
            
            if (zone.shape === 'circle') {
              const dx = boothCenterX - zone.x;
              const dy = boothCenterY - zone.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= (zone.width ?? 0) / 2; // width as diameter
            }
            
            // For polygon zones, implement point-in-polygon check
            if (zone.shape === 'polygon' && zone.points) {
              return isPointInPolygon(boothCenterX, boothCenterY, zone.points);
            }
            
            return false;
          });
        
        const isInSelectedZone = containingZones.some(zone => 
          (zone.label || zone.metadata?.name || 'Unnamed Zone') === filters.zone
        );
        
        if (!isInSelectedZone) return false;
      }
    }
    
    return true;
  });

  result.sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'price': cmp = (a.price ?? 0) - (b.price ?? 0); break;
      case 'size': cmp = (a.size_sqm ?? 0) - (b.size_sqm ?? 0); break;
      case 'booth_number': cmp = a.booth_number.localeCompare(b.booth_number); break;
      case 'proximity': 
        if (objects) {
          const entrances = objects.filter(obj => obj.type === 'infrastructure' && 
            (obj.metadata?.subtype === 'entrance' || obj.metadata?.subtype === 'door'));
          if (entrances.length > 0) {
            const distanceA = getMinDistanceToEntrances(a, objects, entrances);
            const distanceB = getMinDistanceToEntrances(b, objects, entrances);
            cmp = distanceA - distanceB;
          }
        }
        break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  return result;
}

/** Point-in-polygon algorithm using ray casting */
function isPointInPolygon(x: number, y: number, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i].y > y) !== (polygon[j].y > y)) &&
        (x < (polygon[j].x - polygon[i].x) * (y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
      inside = !inside;
    }
  }
  return inside;
}

/** Calculate minimum distance from a booth to any entrance */
function getMinDistanceToEntrances(
  booth: MarketplaceBooth, 
  objects: FloorPlanObject[], 
  entrances: FloorPlanObject[]
): number {
  const boothObject = objects.find(obj => obj.id === booth.object_id);
  if (!boothObject) return Infinity;
  
  const boothCenterX = boothObject.x + (boothObject.width ?? 0) / 2;
  const boothCenterY = boothObject.y + (boothObject.height ?? 0) / 2;
  
  let minDistance = Infinity;
  for (const entrance of entrances) {
    const entranceCenterX = entrance.x + (entrance.width ?? 0) / 2;
    const entranceCenterY = entrance.y + (entrance.height ?? 0) / 2;
    
    const dx = boothCenterX - entranceCenterX;
    const dy = boothCenterY - entranceCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}
