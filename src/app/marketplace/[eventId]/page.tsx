'use client';
import React, { useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import { useMarketplaceStore } from '@/store/marketplace-store';
import FilterSidebar from '@/components/marketplace/FilterSidebar';
import BoothList from '@/components/marketplace/BoothList';
import BoothDetailModal from '@/components/marketplace/BoothDetailModal';
import type { FloorPlanWithObjects, MarketplaceBooth, FloorPlanObject } from '@/types/database';

const MarketplaceCanvas = dynamic(() => import('@/components/marketplace/MarketplaceCanvas'), { ssr: false });

interface Props {
  params: Promise<{ eventId: string }>;
}

export default function MarketplacePage({ params }: Props) {
  const { eventId } = use(params);
  const [floorPlanData, setFloorPlanData] = React.useState<FloorPlanWithObjects[]>([]);
  const { 
    loading, 
    error, 
    setData, 
    setLoading, 
    setError, 
    selectedBoothId, 
    setSelectedBoothId, 
    booths,
    floorPlans,
    selectedFloorPlanIndex,
    setSelectedFloorPlan
  } = useMarketplaceStore();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/marketplace/${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load marketplace (${res.status})`);
        return res.json() as Promise<{ floorPlans: FloorPlanWithObjects[]; booths: MarketplaceBooth[] }>;
      })
      .then((data) => {
        if (data.floorPlans.length === 0) throw new Error('No floor plans found');

        setFloorPlanData(data.floorPlans);

        // Map booth object_ids to floor plan objects for all floor plans
        const objMap = new Map<string, FloorPlanObject>();
        for (const plan of data.floorPlans) {
          for (const obj of plan.floor_plan_objects || []) {
            objMap.set(obj.id, obj);
          }
        }
        const boothsWithObj = data.booths.map((b) => ({
          ...b,
          floor_plan_object: objMap.get(b.object_id),
        }));

        const firstPlan = data.floorPlans[0];
        setData(data.floorPlans, firstPlan.floor_plan_objects || [], boothsWithObj);
      })
      .catch((err) => setError(err.message));
  }, [eventId, setData, setLoading, setError]);

  const handleFloorPlanChange = (index: number) => {
    if (index >= 0 && index < floorPlanData.length) {
      const selectedPlan = floorPlanData[index];
      setSelectedFloorPlan(index, selectedPlan.floor_plan_objects || []);
    }
  };

  const selectedBooth = selectedBoothId ? booths.find((b) => b.id === selectedBoothId) ?? null : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading marketplace…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">🏪</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Marketplace Unavailable</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏪</span>
          <h1 className="text-base font-semibold text-gray-900">Booth Marketplace</h1>
        </div>
        
        {floorPlans.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="floor-select" className="text-sm text-gray-600">Floor:</label>
            <select
              id="floor-select"
              value={selectedFloorPlanIndex}
              onChange={(e) => handleFloorPlanChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
            >
              {floorPlans.map((plan, index) => (
                <option key={plan.id} value={index}>
                  {plan.name} (Floor {plan.floor_number})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white overflow-y-auto">
          <FilterSidebar />
          <div className="border-t border-gray-200 p-4 overflow-y-auto flex-1">
            <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Booths</h3>
            <BoothList />
          </div>
        </div>
        <MarketplaceCanvas />
      </div>

      {selectedBooth && (
        <BoothDetailModal
          booth={selectedBooth}
          onClose={() => setSelectedBoothId(null)}
        />
      )}
    </div>
  );
}
