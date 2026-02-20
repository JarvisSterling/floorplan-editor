'use client';
import React, { useCallback, useState } from 'react';
import { Circle, Line, Group, Text } from 'react-konva';
import { useNavStore } from '@/store/nav-store';
import { useEditorStore } from '@/store/editor-store';
import { PX_PER_METER } from '@/lib/constants';
import type { NavNode } from '@/types/database';

const NODE_COLORS: Record<NavNode['type'], string> = {
  waypoint: '#3B82F6',
  entrance: '#10B981',
  exit: '#EF4444',
  elevator: '#8B5CF6',
  stairs: '#F59E0B',
};

const NODE_RADIUS = 8;

export default function NavOverlay() {
  const {
    nodes, edges, toolMode, selectedNodeId, connectFromNodeId,
    selectNode, setConnectFromNode, createNode, createEdge,
    deleteNode, updateNodePosition,
  } = useNavStore();
  const { floorPlanId, layers, zoom } = useEditorStore();

  const wayfindingLayer = layers.wayfinding;
  if (!wayfindingLayer?.visible) return null;

  const handleNodeClick = useCallback((nodeId: string) => {
    if (toolMode === 'delete') {
      deleteNode(nodeId);
      return;
    }

    if (toolMode === 'connect-edge') {
      if (!connectFromNodeId) {
        setConnectFromNode(nodeId);
      } else if (connectFromNodeId !== nodeId) {
        // Calculate distance between nodes
        const fromNode = nodes.find((n) => n.id === connectFromNodeId);
        const toNode = nodes.find((n) => n.id === nodeId);
        if (fromNode && toNode) {
          const dx = fromNode.x - toNode.x;
          const dy = fromNode.y - toNode.y;
          const distPx = Math.sqrt(dx * dx + dy * dy);
          const distM = distPx / PX_PER_METER;
          createEdge(connectFromNodeId, nodeId, Math.max(0.1, distM));
        }
        setConnectFromNode(null);
      }
      return;
    }

    selectNode(nodeId === selectedNodeId ? null : nodeId);
  }, [toolMode, connectFromNodeId, selectedNodeId, nodes, selectNode, setConnectFromNode, createEdge, deleteNode]);

  const handleNodeDragEnd = useCallback((nodeId: string, x: number, y: number) => {
    updateNodePosition(nodeId, x, y);
  }, [updateNodePosition]);

  const handleStageClick = useCallback((x: number, y: number) => {
    if (toolMode === 'place-node' && floorPlanId !== 'demo') {
      createNode(floorPlanId, x, y);
    }
  }, [toolMode, floorPlanId, createNode]);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inverseScale = 1 / zoom;

  return (
    <Group
      listening={toolMode !== 'none'}
      onMouseMove={(e) => {
        if (connectFromNodeId) {
          const stage = e.target.getStage();
          if (!stage) return;
          const pos = stage.getPointerPosition();
          if (!pos) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const point = transform.point(pos);
          setMousePos(point);
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const stage = e.target.getStage();
          if (!stage) return;
          const pos = stage.getPointerPosition();
          if (!pos) return;
          const transform = stage.getAbsoluteTransform().copy().invert();
          const point = transform.point(pos);
          handleStageClick(point.x, point.y);
        }
      }}
    >
      {/* Edges */}
      {edges.map((edge) => {
        const from = nodeMap.get(edge.from_node_id);
        const to = nodeMap.get(edge.to_node_id);
        if (!from || !to) return null;
        return (
          <Line
            key={edge.id}
            points={[from.x, from.y, to.x, to.y]}
            stroke={edge.accessible ? '#3B82F680' : '#EF444480'}
            strokeWidth={2 * inverseScale}
            dash={edge.bidirectional ? undefined : [6 * inverseScale, 3 * inverseScale]}
            listening={false}
          />
        );
      })}

      {/* Connect preview line — follows mouse cursor */}
      {connectFromNodeId && mousePos && (() => {
        const fromNode = nodeMap.get(connectFromNodeId);
        if (!fromNode) return null;
        return (
          <Line
            points={[fromNode.x, fromNode.y, mousePos.x, mousePos.y]}
            stroke="#FBBF2480"
            strokeWidth={2 * inverseScale}
            dash={[4 * inverseScale, 4 * inverseScale]}
            listening={false}
          />
        );
      })()}

      {/* Nodes */}
      {nodes.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const isConnectSource = node.id === connectFromNodeId;
        const color = NODE_COLORS[node.type] || '#3B82F6';

        return (
          <Group key={node.id}>
            <Circle
              x={node.x}
              y={node.y}
              radius={NODE_RADIUS * inverseScale}
              fill={color}
              stroke={isSelected ? '#FFFFFF' : isConnectSource ? '#FBBF24' : '#00000040'}
              strokeWidth={(isSelected || isConnectSource ? 3 : 1) * inverseScale}
              opacity={wayfindingLayer.opacity}
              draggable={toolMode !== 'connect-edge' && toolMode !== 'delete'}
              onClick={(e) => {
                e.cancelBubble = true;
                handleNodeClick(node.id);
              }}
              onDragEnd={(e) => {
                handleNodeDragEnd(node.id, e.target.x(), e.target.y());
              }}
              cursor={toolMode === 'delete' ? 'pointer' : toolMode === 'connect-edge' ? 'crosshair' : 'move'}
            />
            {/* Label for non-waypoint nodes */}
            {node.type !== 'waypoint' && (
              <Text
                x={node.x + NODE_RADIUS * inverseScale + 2}
                y={node.y - 6 * inverseScale}
                text={node.type}
                fontSize={10 * inverseScale}
                fill={color}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
