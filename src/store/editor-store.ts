import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FloorPlanObject, LayerType, ObjectType, ShapeType } from '@/types/database';

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

  // Helpers
  snapToGrid: (val: number) => number;
  getSelectedObjects: () => FloorPlanObject[];
  createObject: (shape: ShapeType, type: ObjectType, props: Partial<FloorPlanObject>) => FloorPlanObject;
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
      return { objects: m };
    });
  },
  updateObject: (id, updates) => {
    get().pushHistory();
    set((s) => {
      const m = new Map(s.objects);
      const existing = m.get(id);
      if (existing) m.set(id, { ...existing, ...updates, updated_at: new Date().toISOString() });
      return { objects: m };
    });
  },
  removeObjects: (ids) => {
    get().pushHistory();
    set((s) => {
      const m = new Map(s.objects);
      ids.forEach((id) => m.delete(id));
      return { objects: m, selectedObjectIds: new Set() };
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

  snapToGrid: (val) => {
    const { gridSize, snapEnabled } = get();
    if (!snapEnabled) return val;
    return Math.round(val / gridSize) * gridSize;
  },
  getSelectedObjects: () => {
    const { objects, selectedObjectIds } = get();
    return Array.from(selectedObjectIds).map((id) => objects.get(id)).filter(Boolean) as FloorPlanObject[];
  },
  createObject: (shape, type, props) => {
    const now = new Date().toISOString();
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
      layer: 'default' as LayerType,
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
