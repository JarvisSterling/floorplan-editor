'use client';
import React from 'react';
import { Rect, Ellipse, Line, Text, Group, Circle } from 'react-konva';
import type { FloorPlanObject } from '@/types/database';
import { useEditorStore } from '@/store/editor-store';
import { pxPerMeter } from '../editor/GridLayer';

interface Props {
  obj: FloorPlanObject;
}

export default function ShapeRenderer({ obj }: Props) {
  const { selectObject, updateObject, selectedObjectIds, layers, snapToGrid, activeTool } = useEditorStore();

  const layerKey = obj.layer === 'default' ? 'annotations' : obj.layer;
  const layerState = layers[layerKey as keyof typeof layers];
  if (layerState && !layerState.visible) return null;

  const isSelected = selectedObjectIds.has(obj.id);
  const style = obj.style as Record<string, any>;
  const fill = style?.fill || '#4A90D9';
  const stroke = style?.stroke || '#333';
  const strokeWidth = style?.strokeWidth ?? 1;
  const opacity = (style?.opacity ?? 1) * (layerState?.opacity ?? 1);
  const dash = style?.strokeStyle === 'dashed' ? [8, 4] : undefined;
  const isLocked = obj.locked || (layerState?.locked ?? false);

  const handleDragEnd = (e: any) => {
    if (isLocked) return;
    const node = e.target;
    const x = snapToGrid(node.x() / pxPerMeter);
    const y = snapToGrid(node.y() / pxPerMeter);
    updateObject(obj.id, { x, y });
    node.x(x * pxPerMeter);
    node.y(y * pxPerMeter);
  };

  const handleClick = (e: any) => {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    selectObject(obj.id, e.evt.shiftKey);
  };

  const common = {
    x: obj.x * pxPerMeter,
    y: obj.y * pxPerMeter,
    rotation: obj.rotation,
    draggable: !isLocked && activeTool === 'select',
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd,
    opacity,
    name: obj.id,
    id: obj.id,
  };

  switch (obj.shape) {
    case 'rect':
      return (
        <Rect
          {...common}
          width={(obj.width ?? 1) * pxPerMeter}
          height={(obj.height ?? 1) * pxPerMeter}
          fill={fill}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 2 : strokeWidth}
          dash={dash}
          cornerRadius={2}
        />
      );
    case 'circle':
      return (
        <Ellipse
          {...common}
          radiusX={((obj.width ?? 1) / 2) * pxPerMeter}
          radiusY={((obj.height ?? obj.width ?? 1) / 2) * pxPerMeter}
          fill={fill}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 2 : strokeWidth}
          dash={dash}
          offsetX={0}
          offsetY={0}
        />
      );
    case 'line':
      const pts = obj.points ?? [{ x: 0, y: 0 }, { x: (obj.width ?? 2), y: 0 }];
      return (
        <Line
          {...common}
          points={pts.flatMap((p) => [p.x * pxPerMeter, p.y * pxPerMeter])}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 3 : (strokeWidth || 2)}
          dash={dash}
          lineCap="round"
        />
      );
    case 'polygon':
      if (!obj.points || obj.points.length < 3) return null;
      return (
        <Line
          {...common}
          points={obj.points.flatMap((p) => [p.x * pxPerMeter, p.y * pxPerMeter])}
          fill={fill}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 2 : strokeWidth}
          closed
          dash={dash}
        />
      );
    case 'text':
      return (
        <Text
          {...common}
          text={obj.label || 'Text'}
          fontSize={16}
          fill={fill}
          fontFamily="Arial"
        />
      );
    default:
      return null;
  }
}
