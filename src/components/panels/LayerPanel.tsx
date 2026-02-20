'use client';
import React from 'react';
import { useEditorStore, EXTENDED_LAYERS, type ExtendedLayer } from '@/store/editor-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const LAYER_LABELS: Record<string, string> = {
  background: '🖼 Background',
  structure: '🏗 Structure',
  booths: '🏪 Booths',
  zones: '🔲 Zones',
  furniture: '🪑 Furniture',
  annotations: '📝 Annotations',
  heatmap: '🌡 Heatmap',
  wayfinding: '🧭 Wayfinding',
};

export default function LayerPanel() {
  const { layers, setLayerVisibility, setLayerLocked, setLayerOpacity, objects } = useEditorStore();

  const countForLayer = (layer: ExtendedLayer) => {
    let c = 0;
    objects.forEach((o) => {
      const ol = o.layer === 'default' ? 'annotations' : o.layer;
      if (ol === layer) c++;
    });
    return c;
  };

  return (
    <div className="w-56 bg-card border-r border-border overflow-hidden flex flex-col">
      <div className="px-3 py-2.5 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layers</h3>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1.5">
          {EXTENDED_LAYERS.map((layer) => {
            const s = layers[layer];
            const count = countForLayer(layer);
            return (
              <div key={layer} className="rounded-lg border border-border bg-muted/30 p-2 hover:bg-accent/30 transition-colors duration-150">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{LAYER_LABELS[layer]}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 text-xs ${s.visible ? 'text-emerald-600' : 'text-muted-foreground'}`}
                        onClick={() => setLayerVisibility(layer, !s.visible)}
                      >
                        {s.visible ? '👁' : '👁‍🗨'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{s.visible ? 'Hide Layer' : 'Show Layer'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 text-xs ${s.locked ? 'text-red-600' : 'text-muted-foreground'}`}
                        onClick={() => setLayerLocked(layer, !s.locked)}
                      >
                        {s.locked ? '🔒' : '🔓'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{s.locked ? 'Unlock Layer' : 'Lock Layer'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1">
                        <Slider
                          value={[s.opacity]}
                          onValueChange={([v]) => setLayerOpacity(layer, v)}
                          min={0}
                          max={1}
                          step={0.05}
                          className="w-full"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Opacity: {Math.round(s.opacity * 100)}%</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
