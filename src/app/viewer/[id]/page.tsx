'use client';
import React, { useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import { useViewerStore } from '@/store/viewer-store';
import LayerToggles from '@/components/viewer/LayerToggles';
import type { FloorPlanWithObjects } from '@/types/database';

const ViewerCanvas = dynamic(() => import('@/components/viewer/ViewerCanvas'), { ssr: false });

interface Props {
  params: Promise<{ id: string }>;
}

export default function ViewerPage({ params }: Props) {
  const { id } = use(params);
  const { floorPlan, loading, error, setFloorPlan, setLoading, setError } = useViewerStore();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/floor-plans/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Floor plan not found (${res.status})`);
        return res.json() as Promise<FloorPlanWithObjects>;
      })
      .then((data) => {
        setFloorPlan(data, data.floor_plan_objects || []);
      })
      .catch((err) => setError(err.message));
  }, [id, setFloorPlan, setLoading, setError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading floor plan…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">🗺️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Floor Plan Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">🗺️</span>
          <div>
            <h1 className="text-base font-semibold text-gray-900 leading-tight">
              {floorPlan?.name || 'Floor Plan'}
            </h1>
            {floorPlan && (
              <p className="text-xs text-gray-500">
                Floor {floorPlan.floor_number} · {floorPlan.width_m}m × {floorPlan.height_m}m
              </p>
            )}
          </div>
        </div>
        <div className="hidden sm:block">
          <LayerToggles />
        </div>
      </header>

      {/* Mobile layer toggles */}
      <div className="sm:hidden px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto">
        <LayerToggles />
      </div>

      {/* Canvas */}
      <ViewerCanvas />
    </div>
  );
}
