import React from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0, rootMargin: '-40px 0px' });
  return (
    <div 
      id={id}
      ref={ref as any} 
      className={`scroll-section transition-all duration-1000 ${isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      <div className="scroll-section-content">
        {children}
      </div>
    </div>
  );
};
