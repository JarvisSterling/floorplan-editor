import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FloorPlan, FloorPlanObject, LayerType, ObjectType, ShapeType, Booth, BoothProfile, BoothStatus } from '@/types/database';
import { generateBoothNumber, BOOTH_STATUS_COLORS, BOOTH_STATUS_BORDER } from '@/lib/booth-helpers';

export type ToolType = 'select' | 'rect' | 'circle' | 'polygon' | 'line' | 'text' | 'dimension';
export type UnitType = 'm' | 'ft';

export const ALL_LAYERS: LayerType[] = [
  'background', 'structure', 'booths', 'zones', 'furniture', 'annotations',
];
export const EXTENDED_LAYERS = [...ALL_LAYERS, 'heatmap', 'wayfinding'] as const;
export type ExtendedLayer = (typeof EXTENDED_LAYERS)[number] | LayerType;

export interface LayerState {
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  points: Array<{ x: number; y: number }>;
}

export type HistoryEntry = {
  objects: Map<string, FloorPlanObject>;
};

export const GRID_SIZES = [0.5, 1, 2, 5] as const;

interface EditorState {
  // Canvas
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  gridVisible: boolean;
  snapEnabled: boolean;
  unit: UnitType;
  stageWidth: number;
  stageHeight: number;

  // Tool
  activeTool: ToolType;
  drawing: DrawingState;

  // Objects
  objects: Map<string, FloorPlanObject>;
  floorPlanId: string;

  // Selection
  selectedObjectIds: Set<string>;
  selectionBox: { x: number; y: number; width: number; height: number } | null;

  // Layers
  layers: Record<ExtendedLayer, LayerState>;

  // History
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  // Clipboard (F3)
  clipboard: FloorPlanObject[];

  // Background image (F1)
  backgroundImageUrl: string | null;
  backgroundOpacity: number;

  // Auto-save (F2)
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isDirty: boolean;

  // Space pan (F6)
  isSpacePanning: boolean;
  previousTool: ToolType | null;

  // Actions - Canvas
  setZoom: (zoom: number, centerX?: number, centerY?: number) => void;
  setPan: (x: number, y: number) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setUnit: (unit: UnitType) => void;
  setStageSize: (w: number, h: number) => void;

  // Actions - Tool
  setActiveTool: (tool: ToolType) => void;
  setDrawing: (d: Partial<DrawingState>) => void;
  resetDrawing: () => void;

  // Actions - Objects
  addObject: (obj: FloorPlanObject) => void;
  updateObject: (id: string, updates: Partial<FloorPlanObject>) => void;
  removeObjects: (ids: string[]) => void;
  setObjects: (objs: FloorPlanObject[]) => void;

  // Actions - Selection
  selectObject: (id: string, additive?: boolean) => void;
  selectObjects: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectionBox: (box: { x: number; y: number; width: number; height: number } | null) => void;

  // Actions - Layers
  setLayerVisibility: (layer: ExtendedLayer, visible: boolean) => void;
  setLayerLocked: (layer: ExtendedLayer, locked: boolean) => void;
  setLayerOpacity: (layer: ExtendedLayer, opacity: number) => void;

  // Actions - History
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Actions - Clipboard (F3)
  copySelection: () => void;
  pasteClipboard: (offsetX?: number, offsetY?: number) => void;

  // Actions - Background (F1)
  setBackgroundImage: (url: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;

  // Actions - Auto-save (F2)
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'error') => void;
  markDirty: () => void;
  markClean: () => void;

  // Actions - Space pan (F6)
  startSpacePan: () => void;
  endSpacePan: () => void;

  // Actions - Select all (F5)
  selectAll: () => void;

  // Booths
  booths: Map<string, Booth>;       // keyed by object_id
  boothProfiles: Map<string, BoothProfile>; // keyed by booth_id
  contextMenu: { x: number; y: number; objectId: string } | null;

  setContextMenu: (menu: { x: number; y: number; objectId: string } | null) => void;
  convertToBooth: (objectId: string, eventId?: string) => Promise<void>;
  updateBoothStatus: (objectId: string, status: BoothStatus) => void;
  updateBoothNumber: (objectId: string, number: string) => void;
  updateBoothExhibitor: (objectId: string, exhibitorId: string | null, exhibitorName?: string) => void;
  updateBoothProfile: (objectId: string, profile: Partial<BoothProfile>) => void;
  removeBooth: (objectId: string) => Promise<void>;
  loadBooths: (eventId: string) => Promise<void>;
  setBooth: (objectId: string, booth: Booth) => void;
  setBoothProfile: (boothId: string, profile: BoothProfile) => void;

  // Multi-floor
  floors: FloorPlan[];
  currentFloorId: string | null;
  eventId: string;
  loadFloors: (eventId: string) => Promise<void>;
  switchFloor: (floorId: string) => Promise<void>;
  addFloor: (floor: Partial<FloorPlan>) => Promise<FloorPlan | null>;
  deleteFloor: (floorId: string) => Promise<void>;
  duplicateFloor: (floorId: string) => Promise<FloorPlan | null>;
  updateFloor: (floorId: string, updates: Partial<FloorPlan>) => Promise<void>;
  reorderFloors: (floorIds: string[]) => Promise<void>;
  setDefaultFloor: (floorId: string) => Promise<void>;
  setFloors: (floors: FloorPlan[]) => void;

  // Sync error
  syncError: string | null;
  clearSyncError: () => void;

  // Helpers
  snapToGrid: (val: number) => number;
  getSelectedObjects: () => FloorPlanObject[];
  createObject: (shape: ShapeType, type: ObjectType, props: Partial<FloorPlanObject>) => FloorPlanObject;
  getLayerForObject: (type: ObjectType, shape: ShapeType) => LayerType;
}

const defaultDrawing: DrawingState = { isDrawing: false, startX: 0, startY: 0, currentX: 0, currentY: 0, points: [] };

const defaultLayerState = (): Record<ExtendedLayer, LayerState> => {
  const r: Record<string, LayerState> = {};
  for (const l of EXTENDED_LAYERS) r[l] = { visible: true, locked: false, opacity: 1 };
  return r as Record<ExtendedLayer, LayerState>;
};

export const useEditorStore = create<EditorState>((set, get) => ({
  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: 1,
  gridVisible: true,
  snapEnabled: true,
  unit: 'm',
  stageWidth: 1200,
  stageHeight: 800,
  activeTool: 'select',
  drawing: { ...defaultDrawing },
  objects: new Map(),
  floorPlanId: 'demo',
  selectedObjectIds: new Set(),
  selectionBox: null,
  layers: defaultLayerState(),
  undoStack: [],
  redoStack: [],
  clipboard: [],
  backgroundImageUrl: null,
  backgroundOpacity: 0.5,
  saveStatus: 'saved',
  isDirty: false,
  isSpacePanning: false,
  previousTool: null,
  booths: new Map(),
  boothProfiles: new Map(),
  contextMenu: null,
  syncError: null,
  floors: [],
  currentFloorId: null,
  eventId: 'demo',

  clearSyncError: () => set({ syncError: null }),
  setContextMenu: (menu) => set({ contextMenu: menu }),

  convertToBooth: async (objectId, eventId = 'demo') => {
    const { objects, booths, updateObject } = get();
    const obj = objects.get(objectId);
    if (!obj) return;
    if (booths.has(objectId)) return; // already a booth

    const existingNumbers = Array.from(booths.values()).map((b) => b.booth_number);
    const boothNumber = generateBoothNumber(existingNumbers);
    const sizeSqm = (obj.width ?? 1) * (obj.height ?? 1);

    // Save original style before converting, then update to booth type
    const originalStyle = { ...obj.style as Record<string, unknown> };
    const originalType = obj.type;
    const originalLayer = obj.layer;
    updateObject(objectId, {
      type: 'booth',
      layer: 'booths',
      style: { ...obj.style as Record<string, unknown>, fill: BOOTH_STATUS_COLORS.available, stroke: BOOTH_STATUS_BORDER.available, strokeWidth: 2 },
      metadata: { ...obj.metadata, booth_number: boothNumber, booth_status: 'available' as BoothStatus, _originalStyle: originalStyle, _originalType: originalType, _originalLayer: originalLayer },
    });

    // Create booth in API
    try {
      const res = await fetch('/api/booths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object_id: objectId,
          event_id: eventId,
          booth_number: boothNumber,
          status: 'available',
          category: (obj.metadata as Record<string, unknown>)?.boothCategory || 'standard',
          size_sqm: sizeSqm,
          amenities: [],
        }),
      });
      if (res.ok) {
        const booth = await res.json() as Booth;
        set((s) => {
          const m = new Map(s.booths);
          m.set(objectId, booth);
          return { booths: m };
        });
      }
    } catch {
      // Offline fallback — store locally
      const localBooth: Booth = {
        id: uuidv4(), object_id: objectId, event_id: eventId,
        booth_number: boothNumber, status: 'available', category: 'standard',
        size_sqm: sizeSqm, price: null, pricing_tier: null,
        exhibitor_id: null, max_capacity: null, amenities: [],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      set((s) => {
        const m = new Map(s.booths);
        m.set(objectId, localBooth);
        return { booths: m };
      });
    }
  },

  updateBoothStatus: (objectId, status) => {
    const { booths, updateObject, objects } = get();
    const booth = booths.get(objectId);
    const obj = objects.get(objectId);
    if (!booth || !obj) return;

    const updated = { ...booth, status, updated_at: new Date().toISOString() };
    set((s) => { const m = new Map(s.booths); m.set(objectId, updated); return { booths: m }; });

    updateObject(objectId, {
      style: { ...obj.style as Record<string, unknown>, fill: BOOTH_STATUS_COLORS[status], stroke: BOOTH_STATUS_BORDER[status] },
      metadata: { ...obj.metadata, booth_status: status },
    });

    // Sync to API — revert on failure
    const prevBooth = booth;
    const prevStyle = obj.style;
    const prevMetadata = obj.metadata;
    fetch(`/api/booths/${booth.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((res) => {
      if (!res.ok) throw new Error(`Booth status sync failed: ${res.status}`);
    }).catch((err) => {
      console.error('updateBoothStatus sync error:', err);
      set((s) => { const m = new Map(s.booths); m.set(objectId, prevBooth); return { booths: m, syncError: `Failed to sync booth status: ${err.message}` }; });
      get().updateObject(objectId, { style: prevStyle, metadata: prevMetadata });
    });
  },

  updateBoothNumber: (objectId, number) => {
    const { booths, updateObject, objects } = get();
    const booth = booths.get(objectId);
    const obj = objects.get(objectId);
    if (!booth || !obj) return;

    const prevBooth = booth;
    const prevMetadata = obj.metadata;
    const updated = { ...booth, booth_number: number, updated_at: new Date().toISOString() };
    set((s) => { const m = new Map(s.booths); m.set(objectId, updated); return { booths: m }; });
    updateObject(objectId, { metadata: { ...obj.metadata, booth_number: number } });

    fetch(`/api/booths/${booth.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booth_number: number }),
    }).then((res) => {
      if (!res.ok) throw new Error(`Booth number sync failed: ${res.status}`);
    }).catch((err) => {
      console.error('updateBoothNumber sync error:', err);
      set((s) => { const m = new Map(s.booths); m.set(objectId, prevBooth); return { booths: m, syncError: `Failed to sync booth number: ${err.message}` }; });
      get().updateObject(objectId, { metadata: prevMetadata });
    });
  },

  updateBoothExhibitor: (objectId, exhibitorId, exhibitorName) => {
    const { booths, updateObject, objects } = get();
    const booth = booths.get(objectId);
    const obj = objects.get(objectId);
    if (!booth || !obj) return;

    const prevBooth = booth;
    const prevMetadata = obj.metadata;
    const updated = { ...booth, exhibitor_id: exhibitorId, updated_at: new Date().toISOString() };
    set((s) => { const m = new Map(s.booths); m.set(objectId, updated); return { booths: m }; });
    updateObject(objectId, { metadata: { ...obj.metadata, exhibitor_id: exhibitorId, exhibitor_name: exhibitorName || '' } });

    fetch(`/api/booths/${booth.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exhibitor_id: exhibitorId }),
    }).then((res) => {
      if (!res.ok) throw new Error(`Booth exhibitor sync failed: ${res.status}`);
    }).catch((err) => {
      console.error('updateBoothExhibitor sync error:', err);
      set((s) => { const m = new Map(s.booths); m.set(objectId, prevBooth); return { booths: m, syncError: `Failed to sync exhibitor: ${err.message}` }; });
      get().updateObject(objectId, { metadata: prevMetadata });
    });
  },

  updateBoothProfile: (objectId, profileUpdates) => {
    const { booths, boothProfiles } = get();
    const booth = booths.get(objectId);
    if (!booth) return;

    const existing = boothProfiles.get(booth.id);
    if (existing) {
      const updated = { ...existing, ...profileUpdates, updated_at: new Date().toISOString() };
      set((s) => { const m = new Map(s.boothProfiles); m.set(booth.id, updated as BoothProfile); return { boothProfiles: m }; });
    }

    fetch(`/api/booths/${booth.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileUpdates),
    }).catch(() => {});
  },

  removeBooth: async (objectId) => {
    const { booths, boothProfiles, updateObject, objects } = get();
    const booth = booths.get(objectId);
    const obj = objects.get(objectId);
    if (!booth) return;

    // Revert object to original style (or default furniture style)
    if (obj) {
      const meta = obj.metadata as Record<string, unknown>;
      const restoredStyle = (meta?._originalStyle as Record<string, unknown>) || { fill: '#4A90D9', stroke: '#333333', strokeWidth: 1, opacity: 1 };
      const restoredType = (meta?._originalType as string) || 'furniture';
      const restoredLayer = (meta?._originalLayer as string) || 'furniture';
      // Remove booth-specific metadata keys
      const cleanMeta = { ...meta };
      delete cleanMeta.booth_number;
      delete cleanMeta.booth_status;
      delete cleanMeta.exhibitor_id;
      delete cleanMeta.exhibitor_name;
      delete cleanMeta._originalStyle;
      delete cleanMeta._originalType;
      delete cleanMeta._originalLayer;
      updateObject(objectId, {
        type: restoredType as FloorPlanObject['type'],
        layer: restoredLayer as FloorPlanObject['layer'],
        style: restoredStyle,
        metadata: cleanMeta,
      });
    }

    set((s) => {
      const bm = new Map(s.booths); bm.delete(objectId);
      const pm = new Map(s.boothProfiles); pm.delete(booth.id);
      return { booths: bm, boothProfiles: pm };
    });

    try {
      await fetch(`/api/booths/${booth.id}`, { method: 'DELETE' });
    } catch {}
  },

  loadBooths: async (eventId) => {
    try {
      const res = await fetch(`/api/booths?event_id=${eventId}`);
      if (!res.ok) return;
      const data = await res.json() as Array<Booth & { booth_profiles?: BoothProfile[] }>;
      const bm = new Map<string, Booth>();
      const pm = new Map<string, BoothProfile>();
      for (const item of data) {
        const { booth_profiles, ...booth } = item;
        bm.set(booth.object_id, booth);
        if (booth_profiles && booth_profiles.length > 0) {
          pm.set(booth.id, booth_profiles[0]);
        }
      }
      set({ booths: bm, boothProfiles: pm });
    } catch {}
  },

  setBooth: (objectId, booth) => set((s) => {
    const m = new Map(s.booths); m.set(objectId, booth); return { booths: m };
  }),

  setBoothProfile: (boothId, profile) => set((s) => {
    const m = new Map(s.boothProfiles); m.set(boothId, profile); return { boothProfiles: m };
  }),

  // Multi-floor actions
  loadFloors: async (eventId) => {
    try {
      const res = await fetch(`/api/floor-plans?event_id=${eventId}`);
      if (!res.ok) return;
      const data = (await res.json()) as FloorPlan[];
      const sorted = data.sort((a, b) => a.sort_order - b.sort_order);
      set({ floors: sorted, eventId });
      // If no current floor selected, select first
      const { currentFloorId } = get();
      if (!currentFloorId && sorted.length > 0) {
        await get().switchFloor(sorted[0].id);
      }
    } catch {
      console.error('Failed to load floors');
    }
  },

  switchFloor: async (floorId) => {
    // Save current floor objects first if dirty
    const { isDirty, floorPlanId, objects } = get();
    if (isDirty && floorPlanId !== 'demo') {
      try {
        await fetch(`/api/floor-plans/${floorPlanId}/objects/bulk`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objects: Array.from(objects.values()) }),
        });
      } catch { /* best effort */ }
    }

    // Load new floor's objects
    try {
      const res = await fetch(`/api/floor-plans/${floorId}`);
      if (!res.ok) return;
      const data = await res.json();
      const objs = (data.floor_plan_objects || []) as FloorPlanObject[];
      const m = new Map<string, FloorPlanObject>();
      objs.forEach((o) => m.set(o.id, o));
      set({
        currentFloorId: floorId,
        floorPlanId: floorId,
        objects: m,
        selectedObjectIds: new Set(),
        undoStack: [],
        redoStack: [],
        isDirty: false,
        saveStatus: 'saved',
        backgroundImageUrl: data.background_image_url || null,
        gridSize: data.grid_size_m || 1,
      });
    } catch {
      console.error('Failed to switch floor');
    }
  },

  addFloor: async (floorData) => {
    const { eventId, floors } = get();
    const maxSort = floors.reduce((max, f) => Math.max(max, f.sort_order), -1);
    const maxFloorNum = floors.reduce((max, f) => Math.max(max, f.floor_number), 0);
    const payload = {
      event_id: eventId,
      name: `Floor ${maxFloorNum + 1}`,
      floor_number: maxFloorNum + 1,
      width_m: 100,
      height_m: 100,
      grid_size_m: 1,
      scale_px_per_m: 10,
      metadata: {},
      sort_order: maxSort + 1,
      is_published: false,
      ...floorData,
    };
    try {
      const res = await fetch('/api/floor-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const newFloor = (await res.json()) as FloorPlan;
      set((s) => ({ floors: [...s.floors, newFloor] }));
      return newFloor;
    } catch {
      return null;
    }
  },

  deleteFloor: async (floorId) => {
    try {
      const res = await fetch(`/api/floor-plans/${floorId}`, { method: 'DELETE' });
      if (!res.ok) return;
      const { currentFloorId, floors } = get();
      const remaining = floors.filter((f) => f.id !== floorId);
      set({ floors: remaining });
      if (currentFloorId === floorId && remaining.length > 0) {
        await get().switchFloor(remaining[0].id);
      } else if (remaining.length === 0) {
        set({ currentFloorId: null, objects: new Map(), floorPlanId: 'demo' });
      }
    } catch { /* ignore */ }
  },

  duplicateFloor: async (floorId) => {
    try {
      const res = await fetch(`/api/floor-plans/${floorId}/duplicate`, { method: 'POST' });
      if (!res.ok) return null;
      const newFloor = (await res.json()) as FloorPlan;
      set((s) => ({ floors: [...s.floors, newFloor] }));
      return newFloor;
    } catch {
      return null;
    }
  },

  updateFloor: async (floorId, updates) => {
    try {
      const res = await fetch(`/api/floor-plans/${floorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as FloorPlan;
      set((s) => ({
        floors: s.floors.map((f) => (f.id === floorId ? updated : f)),
      }));
    } catch { /* ignore */ }
  },

  reorderFloors: async (floorIds) => {
    // Store original state for rollback
    const { floors } = get();
    const originalFloors = [...floors];
    
    // Optimistic update
    const reordered = floorIds
      .map((id, i) => {
        const f = floors.find((fl) => fl.id === id);
        return f ? { ...f, sort_order: i } : null;
      })
      .filter(Boolean) as FloorPlan[];
    set({ floors: reordered });

    try {
      const response = await fetch('/api/floor-plans/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor_ids: floorIds }),
      });
      
      if (!response.ok) {
        // Rollback on API failure
        set({ floors: originalFloors });
        throw new Error('Failed to reorder floors');
      }
    } catch (error) {
      // Rollback on network or other failure
      set({ floors: originalFloors });
      console.error('Floor reorder failed:', error);
      throw error;
    }
  },

  setDefaultFloor: async (floorId) => {
    const { floors } = get();
    try {
      // First, remove default flag from all floors
      const updates = floors.map(async (floor) => {
        const isDefault = floor.id === floorId;
        const metadata = { ...floor.metadata, is_default: isDefault };
        
        await fetch(`/api/floor-plans/${floor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata }),
        });
        
        return { ...floor, metadata };
      });
      
      const updatedFloors = await Promise.all(updates);
      set({ floors: updatedFloors });
    } catch (error) {
      console.error('Failed to set default floor:', error);
      throw error;
    }
  },

  setFloors: (floors) => set({ floors }),

  setZoom: (zoom, centerX, centerY) => {
    const clamped = Math.min(5, Math.max(0.1, zoom));
    set({ zoom: clamped });
  },
  setPan: (x, y) => set({ panX: x, panY: y }),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setUnit: (unit) => set({ unit }),
  setStageSize: (w, h) => set({ stageWidth: w, stageHeight: h }),

  setActiveTool: (tool) => {
    set({ activeTool: tool });
    if (tool !== 'select') get().clearSelection();
  },
  setDrawing: (d) => set((s) => ({ drawing: { ...s.drawing, ...d } })),
  resetDrawing: () => set({ drawing: { ...defaultDrawing } }),

  addObject: (obj) => {
    get().pushHistory();
    set((s) => {
      const m = new Map(s.objects);
      m.set(obj.id, obj);
      return { objects: m, isDirty: true, saveStatus: 'unsaved' as const };
    });
  },
  updateObject: (id, updates) => {
    get().pushHistory();
    set((s) => {
      const m = new Map(s.objects);
      const existing = m.get(id);
      if (existing) m.set(id, { ...existing, ...updates, updated_at: new Date().toISOString() });
      return { objects: m, isDirty: true, saveStatus: 'unsaved' as const };
    });
  },
  removeObjects: (ids) => {
    get().pushHistory();
    set((s) => {
      const m = new Map(s.objects);
      ids.forEach((id) => m.delete(id));
      return { objects: m, selectedObjectIds: new Set(), isDirty: true, saveStatus: 'unsaved' as const };
    });
  },
  setObjects: (objs) => {
    const m = new Map<string, FloorPlanObject>();
    objs.forEach((o) => m.set(o.id, o));
    set({ objects: m });
  },

  selectObject: (id, additive) => set((s) => {
    const sel = additive ? new Set(s.selectedObjectIds) : new Set<string>();
    if (sel.has(id) && additive) sel.delete(id); else sel.add(id);
    return { selectedObjectIds: sel };
  }),
  selectObjects: (ids) => set({ selectedObjectIds: new Set(ids) }),
  clearSelection: () => set({ selectedObjectIds: new Set(), selectionBox: null }),
  setSelectionBox: (box) => set({ selectionBox: box }),

  setLayerVisibility: (layer, visible) => set((s) => ({
    layers: { ...s.layers, [layer]: { ...s.layers[layer], visible } },
  })),
  setLayerLocked: (layer, locked) => set((s) => ({
    layers: { ...s.layers, [layer]: { ...s.layers[layer], locked } },
  })),
  setLayerOpacity: (layer, opacity) => set((s) => ({
    layers: { ...s.layers, [layer]: { ...s.layers[layer], opacity } },
  })),

  pushHistory: () => set((s) => {
    const entry: HistoryEntry = { objects: new Map(s.objects) };
    const stack = [...s.undoStack, entry].slice(-100);
    return { undoStack: stack, redoStack: [] };
  }),
  undo: () => set((s) => {
    if (s.undoStack.length === 0) return s;
    const stack = [...s.undoStack];
    const entry = stack.pop()!;
    return {
      undoStack: stack,
      redoStack: [...s.redoStack, { objects: new Map(s.objects) }],
      objects: entry.objects,
      selectedObjectIds: new Set(),
    };
  }),
  redo: () => set((s) => {
    if (s.redoStack.length === 0) return s;
    const stack = [...s.redoStack];
    const entry = stack.pop()!;
    return {
      redoStack: stack,
      undoStack: [...s.undoStack, { objects: new Map(s.objects) }],
      objects: entry.objects,
      selectedObjectIds: new Set(),
    };
  }),

  // F3: Copy/Paste
  copySelection: () => {
    const { objects, selectedObjectIds } = get();
    const copied = Array.from(selectedObjectIds)
      .map((id) => objects.get(id))
      .filter(Boolean) as FloorPlanObject[];
    set({ clipboard: copied.map((o) => ({ ...o, style: { ...o.style as Record<string, unknown> }, metadata: { ...o.metadata } })) });
  },
  pasteClipboard: (offsetX = 0.5, offsetY = 0.5) => {
    const { clipboard, addObject } = get();
    if (clipboard.length === 0) return;
    const newIds: string[] = [];
    const now = new Date().toISOString();
    clipboard.forEach((obj) => {
      const newId = uuidv4();
      newIds.push(newId);
      const newObj: FloorPlanObject = {
        ...obj,
        id: newId,
        x: obj.x + offsetX,
        y: obj.y + offsetY,
        style: { ...obj.style as Record<string, unknown> },
        metadata: { ...obj.metadata },
        created_at: now,
        updated_at: now,
      };
      // Use set directly to avoid multiple pushHistory calls
      set((s) => {
        const m = new Map(s.objects);
        m.set(newObj.id, newObj);
        return { objects: m, isDirty: true, saveStatus: 'unsaved' as const };
      });
    });
    set({ selectedObjectIds: new Set(newIds) });
  },

  // F1: Background image
  setBackgroundImage: (url) => set({ backgroundImageUrl: url, isDirty: true, saveStatus: 'unsaved' as const }),
  setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),

  // F2: Auto-save status
  setSaveStatus: (status) => set({ saveStatus: status }),
  markDirty: () => set({ isDirty: true, saveStatus: 'unsaved' }),
  markClean: () => set({ isDirty: false, saveStatus: 'saved' }),

  // F6: Space pan
  startSpacePan: () => {
    const { activeTool, isSpacePanning } = get();
    if (isSpacePanning) return;
    set({ isSpacePanning: true, previousTool: activeTool });
  },
  endSpacePan: () => {
    const { previousTool } = get();
    set({ isSpacePanning: false, previousTool: null, activeTool: previousTool || 'select' });
  },

  // F5: Select all
  selectAll: () => {
    const { objects, layers } = get();
    const ids: string[] = [];
    objects.forEach((obj) => {
      const layerKey = obj.layer === 'default' ? 'annotations' : obj.layer;
      const ls = layers[layerKey as keyof typeof layers];
      if (ls && !ls.visible) return;
      if (ls && ls.locked) return;
      if (obj.locked) return;
      if (!obj.visible) return;
      ids.push(obj.id);
    });
    set({ selectedObjectIds: new Set(ids) });
  },

  snapToGrid: (val) => {
    const { gridSize, snapEnabled } = get();
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  },
  getSelectedObjects: () => {
    const { objects, selectedObjectIds } = get();
    return Array.from(selectedObjectIds).map((id) => objects.get(id)).filter(Boolean) as FloorPlanObject[];
  },
  getLayerForObject: (type, shape) => {
    if (type === 'wall') return 'structure';
    if (type === 'booth') return 'booths';
    if (type === 'zone') return 'zones';
    if (type === 'annotation') return 'annotations';
    if (type === 'furniture' || type === 'infrastructure') return 'furniture';
    if (shape === 'text') return 'annotations';
    return 'furniture';
  },
  createObject: (shape, type, props) => {
    const now = new Date().toISOString();
    const defaultLayer = get().getLayerForObject(type, shape);
    return {
      id: uuidv4(),
      floor_plan_id: get().floorPlanId,
      type,
      shape,
      label: null,
      x: 0,
      y: 0,
      width: null,
      height: null,
      rotation: 0,
      points: null,
      style: { fill: '#4A90D9', stroke: '#333333', strokeWidth: 1, opacity: 1 },
      layer: defaultLayer,
      z_index: get().objects.size,
      locked: false,
      visible: true,
      metadata: {},
      parent_id: null,
      created_at: now,
      updated_at: now,
      ...props,
    };
  },
}));
