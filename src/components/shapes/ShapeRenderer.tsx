'use client';
import React from 'react';
import { Rect, Ellipse, Line, Text, Group } from 'react-konva';
import type { FloorPlanObject } from '@/types/database';
import { useEditorStore } from '@/store/editor-store';
import { pxPerMeter } from '../editor/GridLayer';

interface Props {
  obj: FloorPlanObject;
}

export default function ShapeRenderer({ obj }: Props) {
  const { selectObject, updateObject, selectedObjectIds, layers, snapToGrid, activeTool, booths, setContextMenu } = useEditorStore();

  const layerKey = obj.layer === 'default' ? 'annotations' : obj.layer;
  const layerState = layers[layerKey as keyof typeof layers];
  if (layerState && !layerState.visible) return null;

  const isSelected = selectedObjectIds.has(obj.id);
  const style = obj.style as Record<string, any>;
  const metadata = obj.metadata as Record<string, any>;
  const booth = booths.get(obj.id);
  const isBooth = obj.type === 'booth' || !!booth;

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

  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    selectObject(obj.id, false);
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, objectId: obj.id });
  };

  const common = {
    x: obj.x * pxPerMeter,
    y: obj.y * pxPerMeter,
    rotation: obj.rotation,
    draggable: !isLocked && activeTool === 'select',
    onClick: handleClick,
    onTap: handleClick,
    onDragEnd: handleDragEnd,
    onContextMenu: handleContextMenu,
    opacity,
    name: obj.id,
    id: obj.id,
  };

  // Booth label content
  const boothNumber = metadata?.booth_number || booth?.booth_number || '';
  const exhibitorName = metadata?.exhibitor_name || '';

  // For booth shapes, render with a Group to overlay text
  if (isBooth && obj.shape === 'rect' && obj.width && obj.height) {
    const w = obj.width * pxPerMeter;
    const h = obj.height * pxPerMeter;
    const fontSize = Math.min(w, h) * 0.2;
    const smallFontSize = fontSize * 0.6;

    return (
      <Group {...common}>
        <Rect
          width={w}
          height={h}
          fill={fill}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 2 : strokeWidth}
          dash={dash}
          cornerRadius={2}
        />
        {/* Booth number */}
        {boothNumber && (
          <Text
            text={boothNumber}
            x={0}
            y={h * 0.25}
            width={w}
            align="center"
            fontSize={Math.max(10, fontSize)}
            fontStyle="bold"
            fill="#FFFFFF"
            shadowColor="#000000"
            shadowBlur={2}
            shadowOpacity={0.5}
            listening={false}
          />
        )}
        {/* Exhibitor name */}
        {exhibitorName && (
          <Text
            text={exhibitorName}
            x={2}
            y={h * 0.55}
            width={w - 4}
            align="center"
            fontSize={Math.max(8, smallFontSize)}
            fill="#FFFFFF"
            shadowColor="#000000"
            shadowBlur={1}
            shadowOpacity={0.5}
            listening={false}
            ellipsis
            wrap="none"
          />
        )}
        {/* Label if different from booth number */}
        {obj.label && obj.label !== boothNumber && (
          <Text
            text={obj.label}
            x={2}
            y={h * 0.75}
            width={w - 4}
            align="center"
            fontSize={Math.max(7, smallFontSize * 0.8)}
            fill="rgba(255,255,255,0.8)"
            listening={false}
            ellipsis
            wrap="none"
          />
        )}
      </Group>
    );
  }

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
    case 'circle': {
      const rx = ((obj.width ?? 1) / 2) * pxPerMeter;
      const ry = ((obj.height ?? obj.width ?? 1) / 2) * pxPerMeter;
      if (isBooth) {
        const cFontSize = Math.min(rx, ry) * 0.4;
        const cSmallFont = cFontSize * 0.6;
        return (
          <Group {...common}>
            <Ellipse
              radiusX={rx}
              radiusY={ry}
              fill={fill}
              stroke={isSelected ? '#0066FF' : stroke}
              strokeWidth={isSelected ? 2 : strokeWidth}
              dash={dash}
            />
            {boothNumber && (
              <Text
                text={boothNumber}
                x={-rx}
                y={-cFontSize * 0.7}
                width={rx * 2}
                align="center"
                fontSize={Math.max(10, cFontSize)}
                fontStyle="bold"
                fill="#FFFFFF"
                shadowColor="#000000"
                shadowBlur={2}
                shadowOpacity={0.5}
                listening={false}
              />
            )}
            {exhibitorName && (
              <Text
                text={exhibitorName}
                x={-rx + 2}
                y={cFontSize * 0.3}
                width={rx * 2 - 4}
                align="center"
                fontSize={Math.max(8, cSmallFont)}
                fill="#FFFFFF"
                shadowColor="#000000"
                shadowBlur={1}
                shadowOpacity={0.5}
                listening={false}
                ellipsis
                wrap="none"
              />
            )}
          </Group>
        );
      }
      return (
        <Ellipse
          {...common}
          radiusX={rx}
          radiusY={ry}
          fill={fill}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 2 : strokeWidth}
          dash={dash}
          offsetX={0}
          offsetY={0}
        />
      );
    }
    case 'line': {
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
    }
    case 'polygon': {
      if (!obj.points || obj.points.length < 3) return null;
      const polyPts = obj.points.flatMap((p) => [p.x * pxPerMeter, p.y * pxPerMeter]);
      if (isBooth) {
        // Compute centroid
        const cx = obj.points.reduce((s, p) => s + p.x, 0) / obj.points.length * pxPerMeter;
        const cy = obj.points.reduce((s, p) => s + p.y, 0) / obj.points.length * pxPerMeter;
        const pFontSize = 12;
        return (
          <Group {...common}>
            <Line
              points={polyPts}
              fill={fill}
              stroke={isSelected ? '#0066FF' : stroke}
              strokeWidth={isSelected ? 2 : strokeWidth}
              closed
              dash={dash}
            />
            {boothNumber && (
              <Text
                text={boothNumber}
                x={cx - 40}
                y={cy - pFontSize}
                width={80}
                align="center"
                fontSize={pFontSize}
                fontStyle="bold"
                fill="#FFFFFF"
                shadowColor="#000000"
                shadowBlur={2}
                shadowOpacity={0.5}
                listening={false}
              />
            )}
            {exhibitorName && (
              <Text
                text={exhibitorName}
                x={cx - 40}
                y={cy + 2}
                width={80}
                align="center"
                fontSize={Math.max(8, pFontSize * 0.7)}
                fill="#FFFFFF"
                shadowColor="#000000"
                shadowBlur={1}
                shadowOpacity={0.5}
                listening={false}
                ellipsis
                wrap="none"
              />
            )}
          </Group>
        );
      }
      return (
        <Line
          {...common}
          points={polyPts}
          fill={fill}
          stroke={isSelected ? '#0066FF' : stroke}
          strokeWidth={isSelected ? 2 : strokeWidth}
          closed
          dash={dash}
        />
      );
    }
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
