import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ImageLoader } from './ImageLoader';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  // Zoom & Pan states
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Swipe states (only relevant when scale === 1)
  const [dragOffset, setDragOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Reset zoom when changing images
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setDragOffset(0);
  }, [currentIndex]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isAnimating, scale]);

  const handlePrevious = () => {
    if (isAnimating || scale > 1) return; // Prevent swipe if zoomed in
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNext = () => {
    if (isAnimating || scale > 1) return; // Prevent swipe if zoomed in
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      // Optional: Zoom to cursor could be calculated here, but center zoom is simpler effectively
    }
  };

  // --- Unified Touch/Mouse Handlers ---

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    if (scale > 1) {
      // PANNING
      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;

      // Basic bounds calculation (optional, to stop panning too far)
      // For now, free panning is often acceptable or just limit loosely
      setPosition({ x: newX, y: newY });
    } else {
      // SWIPING
      // We only care about X for swiping
      const diffX = clientX - (dragStart.x + position.x); // reconstruct original start X efficiently?
      // actually dragStart.x was (clientX_start - 0), so clientX - dragStart.x is the difference
      setDragOffset(diffX);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);

    if (scale === 1) {
      // End Swipe
      if (Math.abs(dragOffset) > 50) {
        if (dragOffset > 0) handlePrevious();
        else handleNext();
      }
      setDragOffset(0);
    } else {
      // End Pan - maybe snap back if out of bounds?
      // leaving as is for free movement
    }
  };

  // --- Mouse Events ---
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    handleEnd();
  };

  // --- Touch Events ---
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    handleEnd();
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 select-none touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={handleWheel}
      // Combine handlers
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        if (scale === 1) setDragOffset(0);
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      ref={containerRef}
    >
      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
        <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1">
          <button onClick={handleZoomOut} className="p-2 text-white hover:text-[#bb86fc] transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[3ch] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 text-white hover:text-[#bb86fc] transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          className="relative flex items-center justify-center w-full h-full"
          style={{
            transform: scale === 1
              ? `translateX(${dragOffset}px)`
              : `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onDoubleClick={handleDoubleClick}
        >

          <div className="relative pointer-events-none">
            {/* Image with ImageLoader */}
            <ImageLoader
              src={images[currentIndex]}
              alt={`Página ${currentIndex + 1}`}
              aspectRatio="auto"
              objectFit="contain"
              loading="eager"
              draggable={false}
              // We remove hover scaling here to avoid conflict with our zoom
              className="max-w-[100vw] max-h-[100vh] w-auto h-auto"
              imgClassName="max-w-full max-h-screen object-contain"
            />
          </div>

        </div>

        {/* Navigation Arrows - Only show when not zoomed */}
        {scale === 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-lg text-white opacity-40 hover:opacity-100 transition-opacity duration-200 z-40"
            >
              <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-lg text-white opacity-40 hover:opacity-100 transition-opacity duration-200 z-40"
            >
              <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10" />
            </button>
          </>
        )}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium z-40 pointer-events-none">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
