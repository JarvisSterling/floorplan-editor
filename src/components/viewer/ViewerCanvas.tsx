'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useViewerStore, VIEWER_LAYERS } from '@/store/viewer-store';
import ViewerShapeRenderer, { viewerPxPerMeter } from './ViewerShapeRenderer';
import ObjectTooltip from './ObjectTooltip';
import type { FloorPlanObject } from '@/types/database';

export default function ViewerCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const {
    floorPlan, objects, zoom, panX, panY, setZoom, setPan,
    layerVisibility, hoveredObjectId, selectedObjectId,
    setHoveredObjectId, setSelectedObjectId,
  } = useViewerStore();

  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Responsive resize
  useEffect(() => {
    const onResize = () => {
      setStageWidth(window.innerWidth);
      setStageHeight(window.innerHeight - 56); // header height
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Background image
  useEffect(() => {
    if (!floorPlan?.background_image_url) { setBgImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = floorPlan.background_image_url;
    img.onload = () => setBgImage(img);
  }, [floorPlan?.background_image_url]);

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
    setZoom(newZoom);
    setPan(pointer.x - mousePointTo.x * newZoom, pointer.y - mousePointTo.y * newZoom);
  }, [zoom, panX, panY, setZoom, setPan]);

  // Pan
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) return;
    isPanning.current = true;
    lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
  }, []);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    setTooltipPos({ x: e.evt.clientX, y: e.evt.clientY });
    if (!isPanning.current) return;
    const dx = e.evt.clientX - lastPointer.current.x;
    const dy = e.evt.clientY - lastPointer.current.y;
    setPan(panX + dx, panY + dy);
    lastPointer.current = { x: e.evt.clientX, y: e.evt.clientY };
  }, [panX, panY, setPan]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Touch pan/zoom
  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const touches = e.evt.touches;
    if (touches.length === 1) {
      const touch = touches[0];
      if (isPanning.current) {
        const dx = touch.clientX - lastPointer.current.x;
        const dy = touch.clientY - lastPointer.current.y;
        setPan(panX + dx, panY + dy);
      }
      lastPointer.current = { x: touch.clientX, y: touch.clientY };
      isPanning.current = true;
    }
  }, [panX, panY, setPan]);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Click on empty = deselect
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedObjectId(null);
    }
  }, [setSelectedObjectId]);

  // Filter and sort objects
  const visibleObjects = objects
    .filter((obj) => {
      const layerKey = obj.layer === 'default' ? 'annotations' : obj.layer;
      return layerVisibility[layerKey] !== false;
    })
    .sort((a, b) => a.z_index - b.z_index);

  const hoveredObj = hoveredObjectId ? objects.find((o) => o.id === hoveredObjectId) ?? null : null;

  return (
    <div className="relative flex-1 overflow-hidden">
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
        onClick={handleStageClick}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ background: '#f5f5f5', cursor: 'grab', touchAction: 'none' }}
      >
        <Layer>
          {bgImage && (
            <KonvaImage
              image={bgImage}
              opacity={0.5}
              listening={false}
            />
          )}
          {visibleObjects.map((obj) => (
            <ViewerShapeRenderer
              key={obj.id}
              obj={obj}
              isHovered={hoveredObjectId === obj.id}
              isSelected={selectedObjectId === obj.id}
              onHover={setHoveredObjectId}
              onClick={setSelectedObjectId}
            />
          ))}
        </Layer>
      </Stage>

      <ObjectTooltip obj={hoveredObj} position={tooltipPos} />

      {/* Zoom controls for mobile */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setZoom(zoom * 1.2)}
          className="bg-white shadow rounded-md w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={() => setZoom(zoom / 1.2)}
          className="bg-white shadow rounded-md w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan(0, 0); }}
          className="bg-white shadow rounded-md w-8 h-8 flex items-center justify-center text-xs hover:bg-gray-50"
        >
          1:1
        </button>
      </div>
    </div>
  );
}
