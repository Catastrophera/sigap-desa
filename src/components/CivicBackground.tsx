import React from 'react';

export default function CivicBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-[#FAF8F3]"
    >
      {/* ── Soft Ambient Aurora Gradients (Silky, Smooth, Zero-Clutter) ── */}
      
      {/* 1. Main Warm Tangerine/Peach Radial Glow (Top Center) */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] sm:w-[1100px] h-[550px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 50% at 50% 35%, rgba(249, 115, 22, 0.14) 0%, rgba(254, 215, 170, 0.09) 35%, rgba(250, 248, 243, 0) 70%)',
        }}
      />

      {/* 2. Soft Golden Amber Sunrise Glow (Top Right) */}
      <div
        className="absolute -top-16 -right-20 w-[550px] h-[550px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 45% 45%, rgba(245, 158, 11, 0.12) 0%, rgba(253, 230, 138, 0.07) 35%, rgba(250, 248, 243, 0) 70%)',
        }}
      />

      {/* 3. Subtle Warm Rose-Terracotta Tone (Top Left) */}
      <div
        className="absolute top-20 -left-28 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 55% 45%, rgba(234, 88, 12, 0.09) 0%, rgba(254, 205, 211, 0.06) 35%, rgba(250, 248, 243, 0) 70%)',
        }}
      />

      {/* 4. Soft Mid-Section Warmth for Lower Sections */}
      <div
        className="absolute top-[680px] right-1/4 w-[700px] h-[450px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(249, 115, 22, 0.06) 0%, rgba(254, 243, 199, 0.07) 40%, rgba(250, 248, 243, 0) 75%)',
        }}
      />
    </div>
  );
}
