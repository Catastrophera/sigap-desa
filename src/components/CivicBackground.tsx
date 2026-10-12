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
        className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] sm:w-[1100px] h-[550px] rounded-full transform-gpu"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(249, 115, 22, 0.14) 0%, rgba(254, 215, 170, 0.10) 45%, rgba(250, 248, 243, 0) 75%)',
          filter: 'blur(75px)',
        }}
      />

      {/* 2. Soft Golden Amber Sunrise Glow (Top Right) */}
      <div
        className="absolute -top-20 -right-24 w-[550px] h-[550px] rounded-full transform-gpu"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.12) 0%, rgba(253, 230, 138, 0.08) 50%, rgba(250, 248, 243, 0) 75%)',
          filter: 'blur(80px)',
        }}
      />

      {/* 3. Subtle Warm Rose-Terracotta Tone (Top Left) */}
      <div
        className="absolute top-24 -left-32 w-[600px] h-[600px] rounded-full transform-gpu"
        style={{
          background: 'radial-gradient(circle at 60% 50%, rgba(234, 88, 12, 0.09) 0%, rgba(254, 205, 211, 0.07) 50%, rgba(250, 248, 243, 0) 75%)',
          filter: 'blur(90px)',
        }}
      />

      {/* 4. Soft Mid-Section Warmth for Lower Sections */}
      <div
        className="absolute top-[680px] right-1/4 w-[700px] h-[450px] rounded-full transform-gpu"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.06) 0%, rgba(254, 243, 199, 0.08) 50%, rgba(250, 248, 243, 0) 80%)',
          filter: 'blur(100px)',
        }}
      />
    </div>
  );
}
