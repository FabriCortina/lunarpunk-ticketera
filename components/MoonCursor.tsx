import React, { useEffect, useRef } from 'react';

export const MoonCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Main cursor follows instantly
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
      if (glowRef.current) {
        // Glow follows closely
        glowRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      {/* Container for the cursor elements - Hidden on touch devices */}
      <div className="pointer-events-none fixed inset-0 z-[100] hidden md:block overflow-hidden">
        
        {/* The Moon (Main Cursor) */}
        <div 
          ref={cursorRef}
          className="absolute top-0 left-0 w-12 h-12 -ml-6 -mt-6 rounded-full bg-slate-100 shadow-[0_0_20px_rgba(255,255,255,0.8)] z-50 will-change-transform"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 80%, #94a3b8 100%)'
          }}
        >
          {/* Craters for texture */}
          <div className="absolute top-[20%] left-[25%] w-[20%] h-[20%] bg-slate-300/60 rounded-full"></div>
          <div className="absolute bottom-[25%] right-[20%] w-[15%] h-[15%] bg-slate-300/50 rounded-full"></div>
          <div className="absolute top-[50%] right-[15%] w-[10%] h-[10%] bg-slate-300/40 rounded-full"></div>
        </div>

        {/* Ambient Glow (Larger Halo) - using brand color */}
        <div 
          ref={glowRef}
          className="absolute top-0 left-0 w-48 h-48 -ml-24 -mt-24 bg-lp-primary/10 rounded-full blur-2xl z-40 will-change-transform transition-transform duration-75 ease-out"
        ></div>
      </div>
    </>
  );
};