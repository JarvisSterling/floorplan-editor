'use client';
import React from 'react';
import { Rect, Ellipse, Line, Text, Group } from 'react-konva';
import type { FloorPlanObject } from '@/types/database';

const pxPerMeter = 40;

interface Props {
  obj: FloorPlanObject;
  layerOpacity?: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}

export { pxPerMeter as viewerPxPerMeter };

export default function ViewerShapeRenderer({ obj, layerOpacity = 1, isHovered, isSelected, onHover, onClick }: Props) {
  if (!obj.visible) return null;

  const style = obj.style as Record<string, string | number | undefined>;
  const fill = (style?.fill as string) || '#4A90D9';
  const stroke = (style?.stroke as string) || '#333';
  const strokeWidth = (style?.strokeWidth as number) ?? 1;
  const opacity = ((style?.opacity as number) ?? 1) * layerOpacity;
  const dash = style?.strokeStyle === 'dashed' ? [8, 4] : undefined;

  const highlightStroke = isSelected ? '#0066FF' : isHovered ? '#FF6600' : stroke;
  const highlightWidth = isSelected || isHovered ? 2 : strokeWidth;

  const handleMouseEnter = () => onHover(obj.id);
  const handleMouseLeave = () => onHover(null);
  const handleClick = (e: { cancelBubble: boolean }) => {
    e.cancelBubble = true;
    onClick(obj.id);
  };

  const common = {
    x: obj.x * pxPerMeter,
    y: obj.y * pxPerMeter,
    rotation: obj.rotation,
    draggable: false,
    opacity,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    onTap: handleClick,
  };

  switch (obj.shape) {
    case 'rect':
      return (
        <Rect
          {...common}
          width={(obj.width ?? 1) * pxPerMeter}
          height={(obj.height ?? 1) * pxPerMeter}
          fill={fill}
          stroke={highlightStroke}
          strokeWidth={highlightWidth}
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
          stroke={highlightStroke}
          strokeWidth={highlightWidth}
          dash={dash}
        />
      );
    case 'line': {
      const pts = obj.points ?? [{ x: 0, y: 0 }, { x: (obj.width ?? 2), y: 0 }];
      return (
        <Line
          {...common}
          points={pts.flatMap((p) => [p.x * pxPerMeter, p.y * pxPerMeter])}
          stroke={highlightStroke}
          strokeWidth={isSelected || isHovered ? 3 : (strokeWidth || 2)}
          dash={dash}
          lineCap="round"
        />
      );
    }
    case 'polygon':
      if (!obj.points || obj.points.length < 3) return null;
      return (
        <Line
          {...common}
          points={obj.points.flatMap((p) => [p.x * pxPerMeter, p.y * pxPerMeter])}
          fill={fill}
          stroke={highlightStroke}
          strokeWidth={highlightWidth}
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
