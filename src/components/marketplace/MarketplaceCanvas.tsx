'use client';
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { useMarketplaceStore, getFilteredBooths } from '@/store/marketplace-store';
import ViewerShapeRenderer from '@/components/viewer/ViewerShapeRenderer';
import ObjectTooltip from '@/components/viewer/ObjectTooltip';
import type { FloorPlanObject } from '@/types/database';

export default function MarketplaceCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const {
    floorPlan, objects, booths, zoom, panX, panY, setZoom, setPan,
    hoveredBoothId, setHoveredBoothId, setSelectedBoothId,
    filters, sortField, sortDir,
  } = useMarketplaceStore();

  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const filteredBooths = getFilteredBooths(booths, filters, sortField, sortDir, objects);
  const filteredObjectIds = new Set(filteredBooths.map((b) => b.object_id));

  // Memoize objectIdToBoothId map to avoid recreating on every render
  const objectIdToBoothId = useMemo(() => {
    return new Map(booths.map((b) => [b.object_id, b.id]));
  }, [booths]);

  useEffect(() => {
    const onResize = () => {
      setStageWidth(window.innerWidth - 256); // sidebar width
      setStageHeight(window.innerHeight - 56);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!floorPlan?.background_image_url) { setBgImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = floorPlan.background_image_url;
    img.onload = () => setBgImage(img);
  }, [floorPlan?.background_image_url]);

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

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) setSelectedBoothId(null);
  }, [setSelectedBoothId]);

  const handleObjectClick = useCallback((id: string) => {
    const boothId = objectIdToBoothId.get(id);
    if (boothId) setSelectedBoothId(boothId);
  }, [objectIdToBoothId, setSelectedBoothId]);

  const handleObjectHover = useCallback((id: string | null) => {
    if (!id) { setHoveredBoothId(null); return; }
    const boothId = objectIdToBoothId.get(id);
    setHoveredBoothId(boothId ?? null);
  }, [objectIdToBoothId, setHoveredBoothId]);

  // Separate booth objects from other objects; dim non-matching booths
  const sortedObjects = [...objects].sort((a, b) => a.z_index - b.z_index);
  const hoveredObjectId = hoveredBoothId
    ? booths.find((b) => b.id === hoveredBoothId)?.object_id ?? null
    : null;

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
        style={{ background: '#f5f5f5', cursor: 'grab', touchAction: 'none' }}
      >
        <Layer>
          {bgImage && <KonvaImage image={bgImage} opacity={0.5} listening={false} />}
          {sortedObjects.map((obj) => {
            const isBooth = obj.type === 'booth';
            const isFiltered = isBooth && !filteredObjectIds.has(obj.id);
            return (
              <ViewerShapeRenderer
                key={obj.id}
                obj={obj}
                layerOpacity={isFiltered ? 0.2 : 1}
                isHovered={hoveredObjectId === obj.id}
                isSelected={false}
                onHover={isBooth ? handleObjectHover : () => {}}
                onClick={isBooth ? handleObjectClick : () => {}}
              />
            );
          })}
        </Layer>
      </Stage>

      {hoveredObjectId && (
        <ObjectTooltip
          obj={objects.find((o) => o.id === hoveredObjectId) ?? null}
          position={tooltipPos}
        />
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button onClick={() => setZoom(zoom * 1.2)} className="bg-white shadow rounded-md w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-50">+</button>
        <button onClick={() => setZoom(zoom / 1.2)} className="bg-white shadow rounded-md w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-50">−</button>
        <button onClick={() => { setZoom(1); setPan(0, 0); }} className="bg-white shadow rounded-md w-8 h-8 flex items-center justify-center text-xs hover:bg-gray-50">1:1</button>
      </div>
    </div>
  );
}
