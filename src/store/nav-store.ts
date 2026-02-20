import { create } from 'zustand';
import type { NavNode, NavEdge } from '@/types/database';

export type NavToolMode = 'none' | 'place-node' | 'connect-edge' | 'delete';
export type NavNodePlaceType = NavNode['type'];

interface NavState {
  // Data
  nodes: NavNode[];
  edges: NavEdge[];

  // UI state
  toolMode: NavToolMode;
  placeNodeType: NavNodePlaceType;
  selectedNodeId: string | null;
  connectFromNodeId: string | null;
  isLoading: boolean;

  // Actions
  setToolMode: (mode: NavToolMode) => void;
  setPlaceNodeType: (type: NavNodePlaceType) => void;
  selectNode: (id: string | null) => void;
  setConnectFromNode: (id: string | null) => void;
  setNodes: (nodes: NavNode[]) => void;
  setEdges: (edges: NavEdge[]) => void;
  addNode: (node: NavNode) => void;
  updateNode: (id: string, updates: Partial<NavNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: NavEdge) => void;
  removeEdge: (id: string) => void;

  // API operations
  loadNavData: (floorPlanId: string) => Promise<void>;
  createNode: (floorPlanId: string, x: number, y: number, type?: NavNodePlaceType) => Promise<NavNode | null>;
  deleteNode: (id: string) => Promise<void>;
  createEdge: (fromId: string, toId: string, distanceM: number) => Promise<NavEdge | null>;
  deleteEdge: (id: string) => Promise<void>;
  updateNodePosition: (id: string, x: number, y: number) => Promise<void>;
  generateGraph: (floorPlanId: string, replaceExisting?: boolean) => Promise<void>;
}

export const useNavStore = create<NavState>((set, get) => ({
  nodes: [],
  edges: [],
  toolMode: 'none',
  placeNodeType: 'waypoint',
  selectedNodeId: null,
  connectFromNodeId: null,
  isLoading: false,

  setToolMode: (mode) => set({ toolMode: mode, connectFromNodeId: null }),
  setPlaceNodeType: (type) => set({ placeNodeType: type }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setConnectFromNode: (id) => set({ connectFromNodeId: id }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  updateNode: (id, updates) => set((s) => ({
    nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
  })),
  removeNode: (id) => set((s) => ({
    nodes: s.nodes.filter((n) => n.id !== id),
    edges: s.edges.filter((e) => e.from_node_id !== id && e.to_node_id !== id),
    selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
  })),
  addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
  removeEdge: (id) => set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),

  loadNavData: async (floorPlanId) => {
    set({ isLoading: true });
    try {
      const [nodesRes, edgesRes] = await Promise.all([
        fetch(`/api/nav-nodes?floor_plan_id=${floorPlanId}`),
        fetch(`/api/nav-edges?floor_plan_id=${floorPlanId}`),
      ]);
      if (nodesRes.ok) {
        const nodes = await nodesRes.json();
        set({ nodes });
      }
      if (edgesRes.ok) {
        const edges = await edgesRes.json();
        set({ edges });
      }
    } catch (err) {
      console.error('Failed to load nav data:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createNode: async (floorPlanId, x, y, type) => {
    const nodeType = type || get().placeNodeType;
    try {
      const res = await fetch('/api/nav-nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor_plan_id: floorPlanId, x, y, type: nodeType, accessible: true }),
      });
      if (!res.ok) return null;
      const node = await res.json() as NavNode;
      get().addNode(node);
      return node;
    } catch {
      return null;
    }
  },

  deleteNode: async (id) => {
    // Snapshot state for rollback
    const prevNodes = get().nodes;
    const prevEdges = get().edges;
    const prevSelectedId = get().selectedNodeId;
    get().removeNode(id);
    try {
      const res = await fetch(`/api/nav-nodes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        // Rollback on API failure
        set({ nodes: prevNodes, edges: prevEdges, selectedNodeId: prevSelectedId });
        console.error('Failed to delete node:', res.statusText);
      }
    } catch (err) {
      // Rollback on network failure
      set({ nodes: prevNodes, edges: prevEdges, selectedNodeId: prevSelectedId });
      console.error('Failed to delete node:', err);
    }
  },

  createEdge: async (fromId, toId, distanceM) => {
    try {
      const res = await fetch('/api/nav-edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_node_id: fromId,
          to_node_id: toId,
          distance_m: distanceM,
          bidirectional: true,
          accessible: true,
        }),
      });
      if (!res.ok) return null;
      const edge = await res.json() as NavEdge;
      get().addEdge(edge);
      return edge;
    } catch {
      return null;
    }
  },

  deleteEdge: async (id) => {
    const prevEdges = get().edges;
    get().removeEdge(id);
    try {
      const res = await fetch(`/api/nav-edges/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        set({ edges: prevEdges });
        console.error('Failed to delete edge:', res.statusText);
      }
    } catch (err) {
      set({ edges: prevEdges });
      console.error('Failed to delete edge:', err);
    }
  },

  updateNodePosition: async (id, x, y) => {
    get().updateNode(id, { x, y });
    try {
      await fetch(`/api/nav-nodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
      });
    } catch {}
  },

  generateGraph: async (floorPlanId, replaceExisting = true) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/nav-nodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor_plan_id: floorPlanId, replace_existing: replaceExisting }),
      });
      if (res.ok) {
        // Reload data
        await get().loadNavData(floorPlanId);
      }
    } catch (err) {
      console.error('Failed to generate nav graph:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
