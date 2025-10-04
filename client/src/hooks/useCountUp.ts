import { useEffect, useState, useRef } from 'react';

export function useCountUp(end: number, duration: number = 1500, delay: number = 0) {
  const [count, setCount] = useState(end); // Show final value immediately
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Always show the current value
    setCount(end);

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || end === 0 || hasAnimated.current) {
      return;
    }

    let rafId: number;
    const timeout = setTimeout(() => {
      // Start animation from 0
      let startTime: number | null = null;
      const step = (timestamp: number) => {
        if (!startTime) {
          startTime = timestamp;
          setCount(0); // Set to 0 only when animation actually starts
        }
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function for smooth deceleration
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setCount(Math.floor(easeOutQuart * end));
        
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          hasAnimated.current = true;
        }
      };
      
      rafId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [end, duration, delay]);

  return count;
}
