'use client';
import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';
import { useEditorStore } from '@/store/editor-store';

import { PX_PER_METER } from '@/lib/constants';

const PIXELS_PER_METER = PX_PER_METER;

export const pxPerMeter = PIXELS_PER_METER;

export default function GridLayer() {
  const { zoom, panX, panY, gridSize, gridVisible, stageWidth, stageHeight } = useEditorStore();

  const lines = useMemo(() => {
    if (!gridVisible) return [];
    const result: React.ReactElement[] = [];
    const gridPx = gridSize * PIXELS_PER_METER;

    // Calculate visible area in world coordinates
    const left = -panX / zoom;
    const top = -panY / zoom;
    const right = left + stageWidth / zoom;
    const bottom = top + stageHeight / zoom;

    const startX = Math.floor(left / gridPx) * gridPx;
    const startY = Math.floor(top / gridPx) * gridPx;

    for (let x = startX; x <= right; x += gridPx) {
      const isMajor = Math.abs(x % (gridPx * 5)) < 0.01;
      result.push(
        <Line key={`v${x}`} points={[x, top, x, bottom]} stroke={isMajor ? '#ccc' : '#e8e8e8'} strokeWidth={(isMajor ? 1 : 0.5) / zoom} listening={false} />
      );
    }
    for (let y = startY; y <= bottom; y += gridPx) {
      const isMajor = Math.abs(y % (gridPx * 5)) < 0.01;
      result.push(
        <Line key={`h${y}`} points={[left, y, right, y]} stroke={isMajor ? '#ccc' : '#e8e8e8'} strokeWidth={(isMajor ? 1 : 0.5) / zoom} listening={false} />
      );
    }
    return result;
  }, [zoom, panX, panY, gridSize, gridVisible, stageWidth, stageHeight]);

  return <Group listening={false}>{lines}</Group>;
}
