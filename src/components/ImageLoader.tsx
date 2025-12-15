import { useState } from 'react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  loading?: 'lazy' | 'eager';
  showPlaceholder?: boolean;
}

export function ImageLoader({
  src,
  alt,
  className = '',
  imgClassName = '',
  objectFit = 'contain',
  aspectRatio,
  loading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showPlaceholder
}: ImageLoaderProps) {
  // 1. Estados para controlar qué mostrar
  const [isLoaded, setIsLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={aspectRatio && aspectRatio !== 'auto' ? { aspectRatio } : undefined}
    >

      {/* 2. EL SPINNER (Círculo de carga) 
                Se muestra solo si NO ha terminado de cargar (!isLoaded).
                Cuando carga, se vuelve invisible (opacity-0).
            */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      {/* 3. LA IMAGEN REAL 
                Empieza invisible (opacity-0).
                Cuando se dispara onLoad, pasa a 'opacity-100' creando la animación de aparición.
            */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`w-full h-full object-${objectFit} transition-all duration-1000 ease-linear ${imgClassName} ${isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        onLoad={() => setIsLoaded(true)} // ¡Aquí ocurre la magia!
        onError={() => setHasError(true)}
      />

    </div>
  );
}
