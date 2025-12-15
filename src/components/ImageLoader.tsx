import { useState, useEffect, useRef } from 'react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  className?: string; // Container class
  imgClassName?: string; // Image specific class
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
  onLoad?: () => void;
}

export function ImageLoader({
  src,
  alt,
  aspectRatio = '2/3',
  objectFit = 'cover',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  draggable,
  onLoad,
}: ImageLoaderProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Cuando cambia el src, reseteamos el estado
    setImageLoaded(false);

    // Verificamos si la imagen ya está cargada en el navegador (caché)
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      // Forzamos un pequeño delay para que la transición CSS tenga efecto
      // Si seteamos true inmediatamente, React podría renderizar el estado final sin transición
      setTimeout(() => setImageLoaded(true), 50);
    }
  }, [src]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Si hay error, mostramos el placeholder o simplemente dejamos que se muestre lo que hay
    // Para evitar el cuadro negro eterno, podemos marcarla como cargada para quitar el spinner
    // aunque la imagen esté rota.
    setImageLoaded(true);
  };

  // While loading, if aspect ratio is 'auto', force a 2/3 ratio (typical manga page) 
  // to prevent layout collapse/shifts (CLS).
  const effectiveAspectRatio = (!imageLoaded && aspectRatio === 'auto') ? '2/3' : aspectRatio;

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} style={{ aspectRatio: effectiveAspectRatio }}>

      {/* Loading animation - Cross-fade overlay */}
      <div
        className={`absolute inset-0 bg-black flex items-center justify-center transition-opacity duration-500 ${imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
        <div className="w-8 h-8 border-2 border-[#bb86fc] border-t-transparent rounded-full animate-spin z-10"></div>
      </div>

      {/* Actual Image */}
      {src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          draggable={draggable}
          onLoad={handleImageLoad}
          onError={handleError}
          className={`w-full h-full object-${objectFit} object-center transition-all duration-500 ease-out ${imgClassName}
            ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        />
      )}
    </div>
  );
}
