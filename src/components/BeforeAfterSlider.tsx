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
  afterLabel = 'Hasil Penanganan (Selesai)',
  heightClass = 'h-72 sm:h-84',
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
      className={`relative ${heightClass} w-full rounded-3xl overflow-hidden select-none cursor-ew-resize border border-[#E6E2D8] shadow-card-soft bg-[#191A1E]`}
    >
      {/* After Image (Background / Full Width) */}
      <img
        src={afterImage}
        alt="Hasil perbaikan fasilitas"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute bottom-3.5 right-3.5 z-10">
        <span className="text-[11px] font-bold bg-[#EA580C] text-white px-3 py-1 rounded-full shadow-md border border-[#C2410C]">
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
          alt="Kondisi awal pelaporan"
          className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
        <div className="absolute bottom-3.5 left-3.5 z-10">
          <span className="text-[11px] font-bold bg-[#191A1E] text-white px-3 py-1 rounded-full shadow-md border border-[#2E3238]">
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
        <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]"></div>

        {/* Handle Button */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-[#191A1E] shadow-xl border border-[#E6E2D8] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
          <ChevronsLeftRight className="w-4 h-4 text-[#191A1E]" />
        </div>
      </div>

      {/* Hint overlay */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 pointer-events-none bg-[#191A1E] text-white text-[11px] font-semibold px-3.5 py-1 rounded-full z-10 border border-[#2E3238] shadow-md">
        Geser untuk melihat perbandingan fisik
      </div>
    </div>
  );
}
