'use client';
import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore, type ToolType } from '@/store/editor-store';
import GridLayer, { pxPerMeter } from './GridLayer';
import ShapeRenderer from '../shapes/ShapeRenderer';
import type { FloorPlanObject, ObjectType, ShapeType } from '@/types/database';

function toolToShapeType(tool: ToolType): ShapeType {
  switch (tool) {
    case 'rect': return 'rect';
    case 'circle': return 'circle';
    case 'polygon': return 'polygon';
    case 'line': return 'line';
    case 'text': return 'text';
    case 'dimension': return 'line';
    default: return 'rect';
  }
}

function toolToObjectType(tool: ToolType): ObjectType {
  switch (tool) {
    case 'line': return 'wall';
    case 'text': return 'annotation';
    case 'dimension': return 'annotation';
    default: return 'furniture';
  }
}

export default function EditorCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const {
    zoom, panX, panY, stageWidth, stageHeight, setZoom, setPan, setStageSize,
    activeTool, drawing, setDrawing, resetDrawing,
    objects, addObject, updateObject, createObject,
    selectedObjectIds, clearSelection, selectObjects, setSelectionBox, selectionBox,
    snapToGrid, layers,
  } = useEditorStore();

  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Resize
  useEffect(() => {
    const onResize = () => setStageSize(window.innerWidth - 560, window.innerHeight - 48);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setStageSize]);

  // Attach transformer to selected nodes
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (activeTool !== 'select') { tr.nodes([]); return; }
    const nodes = Array.from(selectedObjectIds)
      .map((id) => stage.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedObjectIds, activeTool, objects]);

  // Wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldZoom = zoom;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const factor = 1.08;
    const newZoom = Math.min(5, Math.max(0.1, direction > 0 ? oldZoom * factor : oldZoom / factor));
    const mousePointTo = { x: (pointer.x - panX) / oldZoom, y: (pointer.y - panY) / oldZoom };
    const newPanX = pointer.x - mousePointTo.x * newZoom;
    const newPanY = pointer.y - mousePointTo.y * newZoom;
    setZoom(newZoom);
    setPan(newPanX, newPanY);
  }, [zoom, panX, panY, setZoom, setPan]);

  // Get world coords from pointer
  const getWorldPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - panX) / zoom / pxPerMeter,
      y: (pointer.y - panY) / zoom / pxPerMeter,
    };
  }, [panX, panY, zoom]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Middle-click pan
    if (e.evt.button === 1) {
      isPanning.current = true;
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    // Space+drag pan handled by keydown

    if (e.evt.button !== 0) return;

    const pos = getWorldPos();

    if (activeTool === 'select') {
      // Click on empty space -> start selection box
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Rect' && !e.target.id();
      if (clickedOnEmpty || e.target.attrs?.name === 'background') {
        clearSelection();
        setDrawing({ isDrawing: true, startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
      }
      return;
    }

    if (activeTool === 'text') {
      const obj = createObject('text', 'annotation', {
        x: snapToGrid(pos.x), y: snapToGrid(pos.y), label: 'Text', layer: 'annotations',
      });
      addObject(obj);
      return;
    }

    if (activeTool === 'polygon') {
      if (!drawing.isDrawing) {
        setDrawing({ isDrawing: true, startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y, points: [{ x: snapToGrid(pos.x), y: snapToGrid(pos.y) }] });
      } else {
        setDrawing({ points: [...drawing.points, { x: snapToGrid(pos.x), y: snapToGrid(pos.y) }] });
      }
      return;
    }

    // Rect, circle, line, dimension
    setDrawing({ isDrawing: true, startX: snapToGrid(pos.x), startY: snapToGrid(pos.y), currentX: snapToGrid(pos.x), currentY: snapToGrid(pos.y) });
  }, [activeTool, drawing, getWorldPos, clearSelection, setDrawing, createObject, addObject, snapToGrid]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      const dx = e.evt.clientX - lastPointer.current.x;
      const dy = e.evt.clientY - lastPointer.current.y;
      setPan(panX + dx, panY + dy);
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    if (!drawing.isDrawing) return;
    const pos = getWorldPos();
    setDrawing({ currentX: pos.x, currentY: pos.y });

    // Selection box
    if (activeTool === 'select') {
      const x = Math.min(drawing.startX, pos.x);
      const y = Math.min(drawing.startY, pos.y);
      const w = Math.abs(pos.x - drawing.startX);
      const h = Math.abs(pos.y - drawing.startY);
      setSelectionBox({ x, y, width: w, height: h });
    }
  }, [drawing.isDrawing, drawing.startX, drawing.startY, activeTool, getWorldPos, setDrawing, setPan, panX, panY, setSelectionBox]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;

    if (!drawing.isDrawing) return;

    if (activeTool === 'select' && selectionBox) {
      // Find objects inside selection box
      const ids: string[] = [];
      objects.forEach((obj) => {
        const box = selectionBox;
        const w = obj.width ?? 0;
        const h = obj.height ?? 0;
        if (obj.x + w >= box.x && obj.x <= box.x + box.width && obj.y + h >= box.y && obj.y <= box.y + box.height) {
          ids.push(obj.id);
        }
      });
      selectObjects(ids);
      setSelectionBox(null);
      resetDrawing();
      return;
    }

    if (activeTool === 'polygon') return; // polygon closes on dblclick

    const { startX, startY, currentX, currentY } = drawing;
    const sx = snapToGrid(startX);
    const sy = snapToGrid(startY);
    const ex = snapToGrid(currentX);
    const ey = snapToGrid(currentY);
    const w = Math.abs(ex - sx);
    const h = Math.abs(ey - sy);

    if (w < 0.1 && h < 0.1 && activeTool !== 'line' && activeTool !== 'dimension') {
      resetDrawing();
      return;
    }

    const shape = toolToShapeType(activeTool);
    const type = toolToObjectType(activeTool);

    if (activeTool === 'line' || activeTool === 'dimension') {
      const obj = createObject(shape, type, {
        x: sx, y: sy,
        points: [{ x: 0, y: 0 }, { x: ex - sx, y: ey - sy }],
        layer: activeTool === 'dimension' ? 'annotations' : 'structure',
        label: activeTool === 'dimension' ? `${Math.sqrt((ex-sx)**2 + (ey-sy)**2).toFixed(1)}m` : null,
      });
      addObject(obj);
    } else {
      const obj = createObject(shape, type, {
        x: Math.min(sx, ex),
        y: Math.min(sy, ey),
        width: w,
        height: h,
        layer: shape === 'rect' ? 'booths' : 'furniture',
      });
      addObject(obj);
    }

    resetDrawing();
  }, [drawing, activeTool, selectionBox, objects, selectObjects, resetDrawing, snapToGrid, createObject, addObject, setSelectionBox]);

  const handleDblClick = useCallback(() => {
    if (activeTool === 'polygon' && drawing.isDrawing && drawing.points.length >= 3) {
      const pts = drawing.points;
      const minX = Math.min(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const relPts = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }));
      const obj = createObject('polygon', 'zone', {
        x: minX, y: minY, points: relPts, layer: 'zones',
      });
      addObject(obj);
      resetDrawing();
    }
  }, [activeTool, drawing, createObject, addObject, resetDrawing]);

  // Transform end - sync back to store
  const handleTransformEnd = useCallback((e: any) => {
    const node = e.target;
    const id = node.id();
    if (!id) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const obj = objects.get(id);
    if (!obj) return;
    updateObject(id, {
      x: node.x() / pxPerMeter,
      y: node.y() / pxPerMeter,
      width: (obj.width ?? 1) * scaleX,
      height: (obj.height ?? 1) * scaleY,
      rotation: node.rotation(),
    });
    node.scaleX(1);
    node.scaleY(1);
  }, [objects, updateObject]);

  // Drawing preview
  const drawPreview = () => {
    if (!drawing.isDrawing || activeTool === 'select') return null;
    const { startX, startY, currentX, currentY, points } = drawing;

    if (activeTool === 'polygon' && points.length > 0) {
      const allPts = [...points, { x: currentX, y: currentY }];
      return (
        <Line
          points={allPts.flatMap((p) => [p.x * pxPerMeter, p.y * pxPerMeter])}
          stroke="#0066FF" strokeWidth={1 / zoom} dash={[6 / zoom, 3 / zoom]} listening={false}
        />
      );
    }

    const sx = snapToGrid(startX) * pxPerMeter;
    const sy = snapToGrid(startY) * pxPerMeter;
    const cx = currentX * pxPerMeter;
    const cy = currentY * pxPerMeter;

    if (activeTool === 'line' || activeTool === 'dimension') {
      return <Line points={[sx, sy, cx, cy]} stroke="#0066FF" strokeWidth={2 / zoom} dash={[6 / zoom, 3 / zoom]} listening={false} />;
    }

    const x = Math.min(sx, cx);
    const y = Math.min(sy, cy);
    const w = Math.abs(cx - sx);
    const h = Math.abs(cy - sy);

    if (activeTool === 'rect') {
      return <Rect x={x} y={y} width={w} height={h} stroke="#0066FF" strokeWidth={1 / zoom} dash={[6 / zoom, 3 / zoom]} listening={false} />;
    }
    if (activeTool === 'circle') {
      return (
        <Rect x={x} y={y} width={w} height={h} stroke="#0066FF" strokeWidth={1 / zoom} dash={[6 / zoom, 3 / zoom]} listening={false} cornerRadius={Math.min(w, h) / 2} />
      );
    }
    return null;
  };

  // Selection box preview
  const selBoxPreview = () => {
    if (!selectionBox) return null;
    return (
      <Rect
        x={selectionBox.x * pxPerMeter} y={selectionBox.y * pxPerMeter}
        width={selectionBox.width * pxPerMeter} height={selectionBox.height * pxPerMeter}
        fill="rgba(0,102,255,0.1)" stroke="#0066FF" strokeWidth={1 / zoom} dash={[4 / zoom, 2 / zoom]} listening={false}
      />
    );
  };

  const sortedObjects = Array.from(objects.values()).sort((a, b) => a.z_index - b.z_index);

  return (
    <Stage
      ref={stageRef}
      width={stageWidth}
      height={stageHeight}
      scaleX={zoom}
      scaleY={zoom}
      x={panX}
      y={panY}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={handleDblClick}
      style={{ background: '#f5f5f5', cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
    >
      <Layer>
        <GridLayer />
        {sortedObjects.map((obj) => (
          <ShapeRenderer key={obj.id} obj={obj} />
        ))}
        {drawPreview()}
        {selBoxPreview()}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          onTransformEnd={handleTransformEnd}
        />
      </Layer>
    </Stage>
  );
}
