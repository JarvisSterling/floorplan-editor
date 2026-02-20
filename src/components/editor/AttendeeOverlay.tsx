'use client';
import React from 'react';
import { Circle, Group, Text } from 'react-konva';
import type { AttendeePosition } from '@/types/database';
import { PX_PER_METER } from '@/lib/constants';

interface AttendeeOverlayProps {
  positions: AttendeePosition[];
  visible: boolean;
  showLabels?: boolean;
  zoom?: number;
}

/**
 * Renders live attendee dots on the canvas.
 */
export default function AttendeeOverlay({
  positions,
  visible,
  showLabels = false,
  zoom = 1,
}: AttendeeOverlayProps) {
  if (!visible || positions.length === 0) return null;

  const inverseScale = 1 / zoom;

  return (
    <Group listening={false}>
      {positions.map((pos) => {
        const accuracyRadius = (pos.accuracy_m || 3) * PX_PER_METER * inverseScale;

        return (
          <Group key={pos.attendee_id}>
            {/* Accuracy circle */}
            <Circle
              x={pos.x}
              y={pos.y}
              radius={Math.min(accuracyRadius, 30 * inverseScale)}
              fill="#3B82F615"
              stroke="#3B82F630"
              strokeWidth={1 * inverseScale}
            />
            {/* Attendee dot */}
            <Circle
              x={pos.x}
              y={pos.y}
              radius={4 * inverseScale}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={1.5 * inverseScale}
            />
            {showLabels && (
              <Text
                x={pos.x + 6 * inverseScale}
                y={pos.y - 4 * inverseScale}
                text={pos.attendee_id.slice(0, 6)}
                fontSize={9 * inverseScale}
                fill="#3B82F6"
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
