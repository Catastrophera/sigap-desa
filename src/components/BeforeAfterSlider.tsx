'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  heightClass?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Kondisi Awal (Pelaporan)',
  afterLabel = 'Hasil Perbaikan (Selesai)',
  heightClass = 'h-72 sm:h-80',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      className={`relative ${heightClass} w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-200 shadow-soft-sm bg-slate-900`}
    >
      {/* After Image (Background / Full Width) */}
      <img
        src={afterImage}
        alt="After repair"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute bottom-3 right-3 z-10">
        <span className="text-[10px] font-bold bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-md shadow-sm">
          {afterLabel}
        </span>
      </div>

      {/* Before Image (Clipped / Foreground) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before repair"
          className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
        <div className="absolute bottom-3 left-3 z-10">
          <span className="text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-md shadow-sm">
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* Draggable Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-auto"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Line */}
        <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>

        {/* Handle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
          <ChevronsLeftRight className="w-4 h-4 text-slate-700" />
        </div>
      </div>

      {/* Hint overlay */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none bg-black/40 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full z-10 border border-white/20">
        Geser garis untuk melihat perbandingan
      </div>
    </div>
  );
}
