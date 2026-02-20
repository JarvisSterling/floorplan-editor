'use client';
import React from 'react';
import { useNavStore, type NavToolMode, type NavNodePlaceType } from '@/store/nav-store';
import { useEditorStore } from '@/store/editor-store';
import Tooltip from '@/components/ui/Tooltip';

const NODE_TYPES: { value: NavNodePlaceType; label: string; icon: string; desc: string }[] = [
  { value: 'waypoint', label: 'Waypoint', icon: '📍', desc: 'General navigation point' },
  { value: 'entrance', label: 'Entrance', icon: '🚪', desc: 'Building entrance' },
  { value: 'exit', label: 'Exit', icon: '🚪', desc: 'Building exit' },
  { value: 'elevator', label: 'Elevator', icon: '🛗', desc: 'Elevator access point' },
  { value: 'stairs', label: 'Stairs', icon: '🪜', desc: 'Staircase access point' },
];

const TOOL_MODES: { value: NavToolMode; label: string; icon: string; desc: string }[] = [
  { value: 'none', label: 'View', icon: '👁', desc: 'View navigation graph' },
  { value: 'place-node', label: 'Place Node', icon: '➕', desc: 'Place navigation nodes on the map' },
  { value: 'connect-edge', label: 'Connect', icon: '🔗', desc: 'Connect two nodes with an edge' },
  { value: 'delete', label: 'Delete', icon: '🗑', desc: 'Delete nodes and edges' },
];

export default function WayfindingPanel() {
  const {
    nodes, edges, toolMode, placeNodeType, selectedNodeId, isLoading,
    setToolMode, setPlaceNodeType, selectNode, deleteNode, deleteEdge,
    generateGraph, loadNavData,
  } = useNavStore();
  const floorPlanId = useEditorStore((s) => s.floorPlanId);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <h3 className="font-semibold text-slate-200 text-base">Wayfinding</h3>

      {/* Tool modes */}
      <div className="flex gap-1">
        {TOOL_MODES.map((mode) => (
          <Tooltip key={mode.value} content={mode.desc}>
            <button
              onClick={() => setToolMode(mode.value)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                toolMode === mode.value
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200'
              }`}
            >
              {mode.icon} {mode.label}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Node type selector */}
      {toolMode === 'place-node' && (
        <div className="space-y-1">
          <label className="text-slate-500 text-xs">Node Type</label>
          <div className="grid grid-cols-2 gap-1">
            {NODE_TYPES.map((t) => (
              <Tooltip key={t.value} content={t.desc}>
                <button
                  onClick={() => setPlaceNodeType(t.value)}
                  className={`px-2 py-1 rounded-md text-xs transition-all duration-150 ${
                    placeNodeType === t.value
                      ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Auto-generate */}
      <div className="border-t border-white/[0.06] pt-2">
        <Tooltip content="Automatically generate navigation graph from floor objects">
          <button
            onClick={() => generateGraph(floorPlanId)}
            disabled={isLoading || floorPlanId === 'demo'}
            className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/[0.06] disabled:text-slate-600 text-white rounded-md text-xs font-medium transition-all duration-150 shadow-sm"
          >
            {isLoading ? '⏳ Generating...' : '⚡ Auto-Generate Graph'}
          </button>
        </Tooltip>
        <Tooltip content="Reload navigation data from server">
          <button
            onClick={() => loadNavData(floorPlanId)}
            disabled={isLoading || floorPlanId === 'demo'}
            className="w-full mt-1 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] disabled:text-slate-600 text-slate-300 rounded-md text-xs transition-all duration-150"
          >
            🔄 Reload
          </button>
        </Tooltip>
      </div>

      {/* Stats */}
      <div className="border-t border-white/[0.06] pt-2 text-slate-500 text-xs">
        <div>Nodes: {nodes.length} | Edges: {edges.length}</div>
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="border-t border-white/[0.06] pt-2 space-y-1">
          <h4 className="text-slate-300 font-medium text-xs">Selected Node</h4>
          <div className="text-slate-500 text-xs space-y-0.5">
            <div>Type: {selectedNode.type}</div>
            <div>Position: ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)})</div>
            <div>Accessible: {selectedNode.accessible ? '✅' : '❌'}</div>
          </div>
          <Tooltip content="Permanently delete this node">
            <button
              onClick={() => { deleteNode(selectedNode.id); selectNode(null); }}
              className="w-full px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-xs mt-1 transition-all duration-150"
            >
              Delete Node
            </button>
          </Tooltip>
        </div>
      )}

      {/* Edge list */}
      {edges.length > 0 && (
        <div className="border-t border-white/[0.06] pt-2">
          <h4 className="text-slate-300 font-medium text-xs mb-1">Edges ({edges.length})</h4>
          <div className="max-h-32 overflow-y-auto dark-scrollbar space-y-0.5">
            {edges.slice(0, 20).map((edge) => (
              <div key={edge.id} className="flex items-center justify-between text-xs text-slate-500">
                <span>{edge.distance_m.toFixed(1)}m {edge.accessible ? '♿' : ''}</span>
                {toolMode === 'delete' && (
                  <Tooltip content="Delete this edge">
                    <button
                      onClick={() => deleteEdge(edge.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </Tooltip>
                )}
              </div>
            ))}
            {edges.length > 20 && (
              <div className="text-slate-600 text-xs">...and {edges.length - 20} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
