/**
 * Lazy Image Loading Hook
 * Uses Intersection Observer for progressive image loading
 */

import { useEffect, useRef, useState } from 'react';

interface UseLazyImageOptions {
  src: string;
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

export function useLazyImage({ 
  src, 
  threshold = 0.1, 
  rootMargin = '50px',
  placeholder 
}: UseLazyImageOptions) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage();
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, threshold, rootMargin]);

  const loadImage = () => {
    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setError('Failed to load image');
      setIsLoading(false);
    };
  };

  return {
    imgRef,
    imageSrc,
    isLoading,
    error,
  };
}

export function useLazyVideo(src: string, options?: { threshold?: number; rootMargin?: string }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          if (observerRef.current && videoRef.current) {
            observerRef.current.unobserve(videoRef.current);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: options?.threshold || 0.1,
      rootMargin: options?.rootMargin || '100px',
    });

    if (videoRef.current) {
      observerRef.current.observe(videoRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, options?.threshold, options?.rootMargin]);

  return {
    videoRef,
    shouldLoad,
    src: shouldLoad ? src : undefined,
  };
}

export function generateThumbnail(videoSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoSrc;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    video.addEventListener('loadeddata', () => {
      video.currentTime = 1;
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        resolve(thumbnail);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video'));
    });
  });
}
