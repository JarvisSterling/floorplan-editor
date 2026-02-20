'use client';
import React from 'react';
import { useNavStore, type NavToolMode, type NavNodePlaceType } from '@/store/nav-store';
import { useEditorStore } from '@/store/editor-store';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <h3 className="font-semibold text-foreground text-base">Wayfinding</h3>

      {/* Tool modes */}
      <div className="flex gap-1">
        {TOOL_MODES.map((mode) => (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={toolMode === mode.value}
                onPressedChange={() => setToolMode(mode.value)}
                className="flex-1 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {mode.icon} {mode.label}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>{mode.desc}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Node type selector */}
      {toolMode === 'place-node' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Node Type</Label>
          <div className="grid grid-cols-2 gap-1">
            {NODE_TYPES.map((t) => (
              <Tooltip key={t.value}>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={placeNodeType === t.value}
                    onPressedChange={() => setPlaceNodeType(t.value)}
                    className="text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {t.icon} {t.label}
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>{t.desc}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Auto-generate */}
      <Separator />
      <div className="space-y-1">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
          size="sm"
          onClick={() => generateGraph(floorPlanId)}
          disabled={isLoading || floorPlanId === 'demo'}
        >
          {isLoading ? '⏳ Generating...' : '⚡ Auto-Generate Graph'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-full text-xs"
          onClick={() => loadNavData(floorPlanId)}
          disabled={isLoading || floorPlanId === 'demo'}
        >
          🔄 Reload
        </Button>
      </div>

      {/* Stats */}
      <Separator />
      <div className="text-muted-foreground text-xs">
        Nodes: {nodes.length} | Edges: {edges.length}
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <>
          <Separator />
          <div className="space-y-1">
            <h4 className="text-foreground font-medium text-xs">Selected Node</h4>
            <div className="text-muted-foreground text-xs space-y-0.5">
              <div>Type: {selectedNode.type}</div>
              <div>Position: ({selectedNode.x.toFixed(1)}, {selectedNode.y.toFixed(1)})</div>
              <div>Accessible: {selectedNode.accessible ? '✅' : '❌'}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-destructive hover:bg-destructive/10"
              onClick={() => { deleteNode(selectedNode.id); selectNode(null); }}
            >
              Delete Node
            </Button>
          </div>
        </>
      )}

      {/* Edge list */}
      {edges.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-foreground font-medium text-xs mb-1">Edges ({edges.length})</h4>
            <ScrollArea className="max-h-32">
              <div className="space-y-0.5">
                {edges.slice(0, 20).map((edge) => (
                  <div key={edge.id} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{edge.distance_m.toFixed(1)}m {edge.accessible ? '♿' : ''}</span>
                    {toolMode === 'delete' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteEdge(edge.id)}
                      >
                        <span className="text-xs">✕</span>
                      </Button>
                    )}
                  </div>
                ))}
                {edges.length > 20 && (
                  <div className="text-muted-foreground text-xs">...and {edges.length - 20} more</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
