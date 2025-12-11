import { useState, useEffect } from 'react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  className?: string; // Container class
  imgClassName?: string; // Image specific class
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  showPlaceholder?: boolean;
}

const imageCache = new Map<string, boolean>();

export function ImageLoader({
  src,
  alt,
  aspectRatio = '2/3',
  objectFit = 'cover',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  onLoad,
  showPlaceholder = true,
}: ImageLoaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Reset state when src changes
    setImageLoaded(false);

    // Check if valid URL
    if (!src) return;

    const img = new Image();
    img.src = src;

    // If already complete (cached), set loaded but keep a tiny delay for transition if desired, 
    // or show instantly. User wants 'suavemente', so we ensure the fade logic runs.
    if (img.complete && img.naturalHeight !== 0) {
      // Small timeout to allow the initial "opacity-0" render to happen, triggering the transition
      setTimeout(() => setImageLoaded(true), 50);
    }
  }, [src]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} style={{ aspectRatio }}>
      {/* Loading Spinner / Placeholder */}
      {showPlaceholder && !imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
          <div
            className="rounded-full"
            style={{
              width: '30px',
              height: '30px',
              border: '3px solid rgba(187, 134, 252, 0.1)',
              borderTopColor: '#bb86fc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        // @ts-expect-error fetchpriority is valid
        fetchpriority={loading === 'eager' ? 'high' : 'auto'}
        onLoad={handleImageLoad}
        className={`w-full h-full object-${objectFit} object-center transition-all duration-700 ease-out ${imgClassName}
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
