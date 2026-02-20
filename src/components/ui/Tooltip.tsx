'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export default function Tooltip({ content, position = 'top', delay = 400, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const tt = tooltipRef.current;
      const ttW = tt?.offsetWidth || 80;
      const ttH = tt?.offsetHeight || 28;

      let top = 0, left = 0;
      switch (position) {
        case 'top':
          top = rect.top - ttH - 6;
          left = rect.left + rect.width / 2 - ttW / 2;
          break;
        case 'bottom':
          top = rect.bottom + 6;
          left = rect.left + rect.width / 2 - ttW / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - ttH / 2;
          left = rect.left - ttW - 6;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - ttH / 2;
          left = rect.right + 6;
          break;
      }
      // Clamp to viewport
      left = Math.max(4, Math.min(left, window.innerWidth - ttW - 4));
      top = Math.max(4, top);

      setCoords({ top, left });
      setVisible(true);
    }, delay);
  }, [delay, position]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  if (!content) return <>{children}</>;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onMouseDown={hide}
        className={`inline-flex ${className ?? ''}`}
      >
        {children}
      </div>
      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900/95 rounded-md shadow-lg backdrop-blur-sm pointer-events-none animate-tooltip-in whitespace-nowrap"
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900/95 rotate-45 ${
              position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' :
              position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' :
              position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' :
              '-left-1 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </>
  );
}
