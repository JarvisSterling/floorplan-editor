'use client';
import React from 'react';
import { useNavStore, type NavToolMode, type NavNodePlaceType } from '@/store/nav-store';
import { useEditorStore } from '@/store/editor-store';

const NODE_TYPES: { value: NavNodePlaceType; label: string; icon: string }[] = [
  { value: 'waypoint', label: 'Waypoint', icon: '📍' },
  { value: 'entrance', label: 'Entrance', icon: '🚪' },
  { value: 'exit', label: 'Exit', icon: '🚪' },
  { value: 'elevator', label: 'Elevator', icon: '🛗' },
  { value: 'stairs', label: 'Stairs', icon: '🪜' },
];

const TOOL_MODES: { value: NavToolMode; label: string; icon: string }[] = [
  { value: 'none', label: 'View', icon: '👁' },
  { value: 'place-node', label: 'Place Node', icon: '➕' },
  { value: 'connect-edge', label: 'Connect', icon: '🔗' },
  { value: 'delete', label: 'Delete', icon: '🗑' },
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
      <h3 className="font-semibold text-white text-base">Wayfinding</h3>

      {/* Tool modes */}
      <div className="flex gap-1">
        {TOOL_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setToolMode(mode.value)}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              toolMode === mode.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={mode.label}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* Node type selector (when placing) */}
      {toolMode === 'place-node' && (
        <div className="space-y-1">
          <label className="text-gray-400 text-xs">Node Type</label>
          <div className="grid grid-cols-2 gap-1">
            {NODE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setPlaceNodeType(t.value)}
                className={`px-2 py-1 rounded text-xs ${
                  placeNodeType === t.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-generate */}
      <div className="border-t border-gray-700 pt-2">
        <button
          onClick={() => generateGraph(floorPlanId)}
          disabled={isLoading || floorPlanId === 'demo'}
          className="w-full px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-xs font-medium transition-colors"
        >
          {isLoading ? '⏳ Generating...' : '⚡ Auto-Generate Graph'}
        </button>
        <button
          onClick={() => loadNavData(floorPlanId)}
          disabled={isLoading || floorPlanId === 'demo'}
          className="w-full mt-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:text-gray-500 text-gray-300 rounded text-xs transition-colors"
        >
          🔄 Reload
        </button>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-700 pt-2 text-gray-400 text-xs">
        <div>Nodes: {nodes.length} | Edges: {edges.length}</div>
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="border-t border-gray-700 pt-2 space-y-1">
          <h4 className="text-gray-300 font-medium text-xs">Selected Node</h4>
          <div className="text-gray-400 text-xs space-y-0.5">
            <div>Type: {selectedNode.type}</div>
            <div>Position: ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)})</div>
            <div>Accessible: {selectedNode.accessible ? '✅' : '❌'}</div>
          </div>
          <button
            onClick={() => { deleteNode(selectedNode.id); selectNode(null); }}
            className="w-full px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-xs mt-1"
          >
            Delete Node
          </button>
        </div>
      )}

      {/* Edge list (compact) */}
      {edges.length > 0 && (
        <div className="border-t border-gray-700 pt-2">
          <h4 className="text-gray-300 font-medium text-xs mb-1">Edges ({edges.length})</h4>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {edges.slice(0, 20).map((edge) => (
              <div key={edge.id} className="flex items-center justify-between text-xs text-gray-400">
                <span>{edge.distance_m.toFixed(1)}m {edge.accessible ? '♿' : ''}</span>
                {toolMode === 'delete' && (
                  <button
                    onClick={() => deleteEdge(edge.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {edges.length > 20 && (
              <div className="text-gray-500 text-xs">...and {edges.length - 20} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
