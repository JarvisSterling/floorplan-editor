'use client';
import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface CustomTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Compat wrapper: maps old Tooltip API to shadcn Tooltip.
 */
export default function CustomTooltip({
  content,
  position = 'top',
  children,
}: CustomTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={position}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
