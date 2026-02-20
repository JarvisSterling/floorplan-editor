'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Line, Circle, Group, Arrow } from 'react-konva';
import type { NavNode } from '@/types/database';

interface RouteOverlayProps {
  routeNodes: NavNode[];
  visible: boolean;
  color?: string;
  animated?: boolean;
}

/**
 * Renders an animated route path on the Konva canvas.
 * Shows a dashed line with a moving "pulse" dot along the path.
 */
export default function RouteOverlay({
  routeNodes,
  visible,
  color = '#22D3EE',
  animated = true,
}: RouteOverlayProps) {
  const [dashOffset, setDashOffset] = useState(0);
  const [pulsePosition, setPulsePosition] = useState(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visible || !animated || routeNodes.length < 2) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let offset = 0;
    let pulse = 0;
    const totalSegments = routeNodes.length - 1;

    const animate = () => {
      offset = (offset + 0.5) % 20;
      pulse = (pulse + 0.003) % 1;
      setDashOffset(offset);
      setPulsePosition(pulse);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [visible, animated, routeNodes.length]);

  if (!visible || routeNodes.length < 2) return null;

  // Build flat points array
  const points: number[] = [];
  for (const node of routeNodes) {
    points.push(node.x, node.y);
  }

  // Calculate total path length and pulse dot position
  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 0; i < routeNodes.length - 1; i++) {
    const dx = routeNodes[i + 1].x - routeNodes[i].x;
    const dy = routeNodes[i + 1].y - routeNodes[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalLength += len;
  }

  // Find pulse dot position along path
  let pulseX = routeNodes[0].x;
  let pulseY = routeNodes[0].y;
  if (animated && totalLength > 0) {
    let targetDist = pulsePosition * totalLength;
    for (let i = 0; i < segmentLengths.length; i++) {
      if (targetDist <= segmentLengths[i]) {
        const t = targetDist / segmentLengths[i];
        pulseX = routeNodes[i].x + t * (routeNodes[i + 1].x - routeNodes[i].x);
        pulseY = routeNodes[i].y + t * (routeNodes[i + 1].y - routeNodes[i].y);
        break;
      }
      targetDist -= segmentLengths[i];
    }
  }

  return (
    <Group listening={false}>
      {/* Route path - glow effect */}
      <Line
        points={points}
        stroke={color}
        strokeWidth={6}
        opacity={0.3}
        lineCap="round"
        lineJoin="round"
      />

      {/* Route path - main line */}
      <Line
        points={points}
        stroke={color}
        strokeWidth={3}
        opacity={0.9}
        dash={[10, 5]}
        dashOffset={dashOffset}
        lineCap="round"
        lineJoin="round"
      />

      {/* Direction arrows at midpoints */}
      {routeNodes.length > 2 && routeNodes.slice(0, -1).map((node, i) => {
        const next = routeNodes[i + 1];
        const midX = (node.x + next.x) / 2;
        const midY = (node.y + next.y) / 2;
        return (
          <Arrow
            key={`arrow-${i}`}
            points={[
              midX - (next.x - node.x) * 0.05,
              midY - (next.y - node.y) * 0.05,
              midX + (next.x - node.x) * 0.05,
              midY + (next.y - node.y) * 0.05,
            ]}
            stroke={color}
            fill={color}
            strokeWidth={2}
            pointerLength={6}
            pointerWidth={6}
            opacity={0.7}
          />
        );
      })}

      {/* Start marker */}
      <Circle
        x={routeNodes[0].x}
        y={routeNodes[0].y}
        radius={8}
        fill="#10B981"
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* End marker */}
      <Circle
        x={routeNodes[routeNodes.length - 1].x}
        y={routeNodes[routeNodes.length - 1].y}
        radius={8}
        fill="#EF4444"
        stroke="#FFFFFF"
        strokeWidth={2}
      />

      {/* Animated pulse dot */}
      {animated && (
        <Circle
          x={pulseX}
          y={pulseY}
          radius={5}
          fill="#FFFFFF"
          stroke={color}
          strokeWidth={2}
          opacity={0.9}
        />
      )}
    </Group>
  );
}
