'use client';
import React, { useMemo } from 'react';
import { Rect, Group } from 'react-konva';
import type { AttendeePosition } from '@/types/database';

interface HeatmapOverlayProps {
  positions: AttendeePosition[];
  visible: boolean;
  gridSizePx?: number; // size of each heatmap cell in pixels
  maxOpacity?: number;
  width: number; // floor plan width in px
  height: number; // floor plan height in px
}

/**
 * Density heatmap overlay. Groups attendee positions into grid cells
 * and renders colored rectangles with opacity proportional to density.
 */
export default function HeatmapOverlay({
  positions,
  visible,
  gridSizePx = 50,
  maxOpacity = 0.6,
  width,
  height,
}: HeatmapOverlayProps) {
  const cells = useMemo(() => {
    if (!visible || positions.length === 0) return [];

    const cols = Math.ceil(width / gridSizePx);
    const rows = Math.ceil(height / gridSizePx);
    const grid = new Array(rows * cols).fill(0);

    // Count positions in each cell
    for (const pos of positions) {
      const col = Math.floor(pos.x / gridSizePx);
      const row = Math.floor(pos.y / gridSizePx);
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        grid[row * cols + col]++;
      }
    }

    // Find max density
    const maxDensity = Math.max(...grid, 1);

    // Build cell data (only non-zero cells)
    const result: Array<{ x: number; y: number; density: number }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const count = grid[r * cols + c];
        if (count > 0) {
          result.push({
            x: c * gridSizePx,
            y: r * gridSizePx,
            density: count / maxDensity,
          });
        }
      }
    }

    return result;
  }, [positions, visible, gridSizePx, width, height]);

  if (!visible || cells.length === 0) return null;

  return (
    <Group listening={false}>
      {cells.map((cell, i) => {
        // Color gradient: green → yellow → red
        const r = Math.round(255 * Math.min(cell.density * 2, 1));
        const g = Math.round(255 * Math.min((1 - cell.density) * 2, 1));
        const color = `rgb(${r}, ${g}, 0)`;

        return (
          <Rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={gridSizePx}
            height={gridSizePx}
            fill={color}
            opacity={cell.density * maxOpacity}
            cornerRadius={2}
          />
        );
      })}
    </Group>
  );
}
