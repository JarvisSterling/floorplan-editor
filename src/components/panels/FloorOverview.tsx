'use client';
import React from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlan } from '@/types/database';

interface FloorThumbnailProps {
  floor: FloorPlan;
  isActive: boolean;
  isDefault: boolean;
  onSelect: () => void;
  onSetDefault: () => void;
}

function FloorThumbnail({ floor, isActive, isDefault, onSelect, onSetDefault }: FloorThumbnailProps) {
  return (
    <div className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
      isActive 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 bg-white hover:border-gray-400'
    }`}>
      {/* Thumbnail representation */}
      <div 
        onClick={onSelect}
        className="aspect-square w-32 bg-gray-100 flex items-center justify-center relative"
      >
        {/* Simple floor representation */}
        <div className="w-24 h-24 border-2 border-gray-400 rounded relative bg-white">
          {/* Floor number indicator */}
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {floor.floor_number}
          </div>
          
          {/* Default floor indicator */}
          {isDefault && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
          
          {/* Simple grid pattern */}
          <div className="absolute inset-2 opacity-30">
            <div className="grid grid-cols-4 grid-rows-4 gap-1 h-full">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border border-gray-300"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floor info */}
      <div className="p-2">
        <div className="font-medium text-sm truncate" title={floor.name}>
          {floor.name}
        </div>
        <div className="text-xs text-gray-500">
          {floor.width_m}×{floor.height_m}m
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetDefault();
          }}
          className={`px-2 py-1 text-xs rounded ${
            isDefault 
              ? 'bg-yellow-500 text-white' 
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
          title={isDefault ? 'Default floor' : 'Set as default'}
        >
          {isDefault ? '★' : '☆'}
        </button>
      </div>
    </div>
  );
}

export default function FloorOverview() {
  const { floors, currentFloorId, switchFloor, setDefaultFloor } = useEditorStore();

  const handleSetDefault = async (floorId: string) => {
    try {
      await setDefaultFloor(floorId);
    } catch (error) {
      console.error('Failed to set default floor:', error);
      // You might want to show a toast/notification here
    }
  };

  if (floors.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-lg mb-2">No floors available</div>
        <div className="text-sm">Create a floor to get started</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Floor Overview</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {floors
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((floor) => {
            const isDefault = !!(floor.metadata && (floor.metadata as Record<string, unknown>).is_default);
            return (
              <FloorThumbnail
                key={floor.id}
                floor={floor}
                isActive={floor.id === currentFloorId}
                isDefault={isDefault}
                onSelect={() => switchFloor(floor.id)}
                onSetDefault={() => handleSetDefault(floor.id)}
              />
            );
          })}
      </div>
    </div>
  );
}