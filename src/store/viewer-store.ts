import { create } from 'zustand';
import type { FloorPlanObject, FloorPlan, LayerType } from '@/types/database';

export const VIEWER_LAYERS: LayerType[] = [
  'background', 'structure', 'booths', 'zones', 'furniture', 'annotations',
];

interface ViewerState {
  floorPlan: FloorPlan | null;
  objects: FloorPlanObject[];
  loading: boolean;
  error: string | null;

  zoom: number;
  panX: number;
  panY: number;

  layerVisibility: Record<string, boolean>;
  hoveredObjectId: string | null;
  selectedObjectId: string | null;

  setFloorPlan: (fp: FloorPlan, objects: FloorPlanObject[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleLayer: (layer: string) => void;
  setHoveredObjectId: (id: string | null) => void;
  setSelectedObjectId: (id: string | null) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  floorPlan: null,
  objects: [],
  loading: true,
  error: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  layerVisibility: Object.fromEntries(VIEWER_LAYERS.map((l) => [l, true])),
  hoveredObjectId: null,
  selectedObjectId: null,

  setFloorPlan: (fp, objects) => set({ floorPlan: fp, objects, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setZoom: (zoom) => set({ zoom: Math.min(5, Math.max(0.1, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  toggleLayer: (layer) =>
    set((s) => ({
      layerVisibility: { ...s.layerVisibility, [layer]: !s.layerVisibility[layer] },
    })),
  setHoveredObjectId: (id) => set({ hoveredObjectId: id }),
  setSelectedObjectId: (id) => set((s) => ({ selectedObjectId: s.selectedObjectId === id ? null : id })),
}));
