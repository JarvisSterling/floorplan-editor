'use client';
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Transformer, Line, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore, type ToolType } from '@/store/editor-store';
import GridLayer, { pxPerMeter } from './GridLayer';
import ShapeRenderer from '../shapes/ShapeRenderer';
import type { FloorPlanObject, ObjectType, ShapeType } from '@/types/database';
import type { LibraryItem } from '@/lib/object-library';

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
    snapToGrid, layers, isSpacePanning,
    backgroundImageUrl, backgroundOpacity,
  } = useEditorStore();

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // F1: Load background image
  useEffect(() => {
    if (!backgroundImageUrl) { setBgImage(null); return; }
    const img = new window.Image();
    img.src = backgroundImageUrl;
    img.onload = () => setBgImage(img);
  }, [backgroundImageUrl]);

  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const shiftHeld = useRef(false);

  // Track shift key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeld.current = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeld.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

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
    // Middle-click pan or space+drag pan (F6)
    if (e.evt.button === 1 || (e.evt.button === 0 && isSpacePanning)) {
      isPanning.current = true;
      lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

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
  }, [activeTool, drawing, getWorldPos, clearSelection, setDrawing, createObject, addObject, snapToGrid, isSpacePanning]);

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
      let finalW = w;
      let finalH = h;
      // F7: Shift-constrain circle to perfect circle
      if (shape === 'circle' && shiftHeld.current) {
        const maxDim = Math.max(w, h);
        finalW = maxDim;
        finalH = maxDim;
      }
      const obj = createObject(shape, type, {
        x: Math.min(sx, ex),
        y: Math.min(sy, ey),
        width: finalW,
        height: finalH,
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

  // F11: Filter objects by layer visibility
  const sortedObjects = Array.from(objects.values())
    .filter((obj) => {
      const layerKey = obj.layer === 'default' ? 'annotations' : obj.layer;
      const ls = layers[layerKey as keyof typeof layers];
      return !ls || ls.visible;
    })
    .sort((a, b) => a.z_index - b.z_index);

  // Drop handler for object library drag-and-drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/x-library-item');
    if (!data) return;
    let item: LibraryItem;
    try {
      item = JSON.parse(data);
    } catch {
      return;
    }
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container().getBoundingClientRect();
    const pointerX = (e.clientX - container.left - panX) / zoom / pxPerMeter;
    const pointerY = (e.clientY - container.top - panY) / zoom / pxPerMeter;
    const x = snapToGrid(pointerX - item.widthM / 2);
    const y = snapToGrid(pointerY - item.heightM / 2);
    const obj = createObject(item.shapeType, item.objectType, {
      x,
      y,
      width: item.widthM,
      height: item.heightM,
      label: item.name,
      layer: item.defaultLayer,
      style: { ...item.defaultStyle },
      metadata: { ...item.metadata, libraryItemId: item.id },
    });
    addObject(obj);
  }, [panX, panY, zoom, snapToGrid, createObject, addObject]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const cursorStyle = isSpacePanning ? 'grab' : activeTool === 'select' ? 'default' : 'crosshair';

  return (
    <div onDrop={handleDrop} onDragOver={handleDragOver} style={{ width: '100%', height: '100%' }}>
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
      style={{ background: '#f5f5f5', cursor: cursorStyle }}
    >
      <Layer>
        <GridLayer />
        {/* F1: Background image */}
        {bgImage && (
          <KonvaImage
            image={bgImage}
            opacity={backgroundOpacity}
            listening={false}
            name="background"
          />
        )}
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
    </div>
  );
}
