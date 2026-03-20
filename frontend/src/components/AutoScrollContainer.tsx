import React, { useRef, useState, useEffect } from 'react';

export const AutoScrollContainer: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId: number;
    // VERY slow and smooth: 0.03 pixels per ms (approx 1.8px per frame at 60fps)
    const speed = 0.5; 
    let accumulatedScroll = 0;

    const scroll = () => {
      if (!isPaused && container) {
        accumulatedScroll += speed;
        
        if (accumulatedScroll >= 1) {
            container.scrollLeft += Math.floor(accumulatedScroll);
            accumulatedScroll -= Math.floor(accumulatedScroll);
        }

        // When we scrolled past the first set of children (half the total scroll width)
        // Reset to 0 for a seamless infinite loop
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <div 
      className={`auto-scroll-container ${className}`}
      ref={scrollRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      style={{
         display: 'flex',
         gap: '1.5rem',
         overflowX: 'auto',
         scrollbarWidth: 'none',
         msOverflowStyle: 'none',
         scrollBehavior: isPaused ? 'smooth' : 'auto',
         WebkitOverflowScrolling: 'touch',
         ...style
      }}
    >
      <style>{`
        .auto-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
      {/* Duplicate children to create the infinite scroll illusion */}
      {children}
    </div>
  );
};
