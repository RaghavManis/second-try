import React, { useRef, useState, useEffect } from 'react';

export const AutoScrollContainer: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className = '', style }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationFrameId: number;
    let lastTimestamp = 0;
    const speed = 0.03; // pixels per ms
    let accumulatedScroll = 0;

    const scroll = (timestamp: number) => {
      if (!isPaused && container) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const delta = timestamp - lastTimestamp;
        
        accumulatedScroll += delta * speed;
        
        if (accumulatedScroll >= 1) {
            const pixels = Math.floor(accumulatedScroll);
            container.scrollLeft += (pixels * directionRef.current);
            accumulatedScroll -= pixels;
        }

        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // Bounce back behavior
        if (container.scrollLeft >= maxScroll - 1 && directionRef.current === 1) {
          directionRef.current = -1;
        } else if (container.scrollLeft <= 0 && directionRef.current === -1) {
          directionRef.current = 1;
        }
      }
      lastTimestamp = timestamp;

      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  return (
    <div 
      className={`horizontal-scroll-container ${className}`}
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
        .horizontal-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
};
