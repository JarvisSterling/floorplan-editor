'use client';
import React from 'react';
import { useEditorStore } from '@/store/editor-store';
import type { FloorPlan } from '@/types/database';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface FloorThumbnailProps {
  floor: FloorPlan;
  isActive: boolean;
  isDefault: boolean;
  onSelect: () => void;
  onSetDefault: () => void;
}

function FloorThumbnail({ floor, isActive, isDefault, onSelect, onSetDefault }: FloorThumbnailProps) {
  return (
    <div className={`relative group border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
      isActive 
        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
        : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50'
    }`}>
      <div 
        onClick={onSelect}
        className="aspect-square w-32 bg-muted/30 flex items-center justify-center relative"
      >
        <div className="w-24 h-24 border-2 border-muted-foreground/30 rounded relative bg-muted/20">
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
            {floor.floor_number}
          </div>
          
          {isDefault && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-2 h-2 text-white fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent>Default floor</TooltipContent>
            </Tooltip>
          )}
          
          <div className="absolute inset-2 opacity-10">
            <div className="grid grid-cols-4 grid-rows-4 gap-1 h-full">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border border-muted-foreground/30"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-2">
        <div className="font-medium text-sm text-foreground truncate" title={floor.name}>
          {floor.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {floor.width_m}×{floor.height_m}m
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDefault ? 'default' : 'secondary'}
              size="icon"
              className={`h-6 w-6 text-xs ${isDefault ? 'bg-yellow-500 hover:bg-yellow-500' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
            >
              {isDefault ? '★' : '☆'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isDefault ? 'Default floor' : 'Set as default floor'}</TooltipContent>
        </Tooltip>
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
    }
  };

  if (floors.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="text-lg mb-2">No floors available</div>
        <div className="text-sm">Create a floor to get started</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">Floor Overview</h3>
      
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
