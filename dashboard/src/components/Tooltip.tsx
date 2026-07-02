'use client';

import { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  
  return (
    <span className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute z-[100] top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 rounded-lg bg-[#1a1a2e] border border-[#643390] text-xs text-white/90 shadow-xl pointer-events-none">
          {text}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#643390]" />
        </span>
      )}
    </span>
  );
}
