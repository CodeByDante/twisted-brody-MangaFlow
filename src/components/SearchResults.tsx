import { BookOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { MangaCard } from './MangaCard';
import { MangaCardSkeleton } from './MangaCardSkeleton';
import { Manga } from '../types/manga';

interface SearchResult {
  id: string;
  title: string;
  author: string;
  chapterCount: number;
  pageCount: number;
  thumbnail?: string;
  manga?: Manga;
}

interface SearchResultsProps {
  items: SearchResult[];
  searchTerm: string;
  isSearching: boolean;
  onSelectComic: (id: string) => void;
  onEditManga: (manga: Manga) => void;
  onDeleteManga: (id: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 20;
export function SearchResults({
  items,
  searchTerm,
  isSearching,
  onSelectComic,
  onEditManga,
  onDeleteManga,
  isLoading = false,
}: SearchResultsProps) {
  const [visibleItems, setVisibleItems] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleItems(items.slice(0, ITEMS_PER_PAGE));
    setPage(1);
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleItems.length < items.length) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '500px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [visibleItems.length, items.length]);

  useEffect(() => {
    if (page > 1) {
      const nextItems = items.slice(0, page * ITEMS_PER_PAGE);
      setVisibleItems(nextItems);
    }
  }, [page, items]);
  if (isSearching && searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
        <div className="text-gray-400 text-sm animate-pulse">Buscando "{searchTerm}"...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in duration-300">
        {Array.from({ length: 12 }).map((_, index) => (
          <MangaCardSkeleton key={index} />
        ))}
      </div>
    );
  }
  if (searchTerm && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
        <BookOpen className="w-16 h-16 text-gray-600 mb-4 animate-bounce" />
        <p className="text-gray-400 text-lg mb-2">No se encontraron resultados</p>
        <p className="text-gray-500 text-sm">Intenta con otros términos de búsqueda</p>
      </div>
    );
  }

  if (!searchTerm && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
        <BookOpen className="w-16 h-16 text-gray-600 mb-4 animate-bounce" />
        <p className="text-gray-400 text-lg mb-2">No hay mangas disponibles</p>
        <p className="text-gray-500 text-sm">Crea tu primer manga usando el botón "Nuevo"</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
      {visibleItems.map((item) => (
        <div key={item.id}>
          <MangaCard
            id={item.id}
            title={item.title}
            author={item.author}
            pageCount={item.pageCount}
            thumbnail={item.thumbnail}
            manga={item.manga}
            onSelect={() => onSelectComic(item.id)}
            onEdit={onEditManga}
            onDelete={() => onDeleteManga(item.id)}
          />
        </div>
      ))}
      {visibleItems.length < items.length && (
        <div ref={observerTarget} className="col-span-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <MangaCardSkeleton key={`loader-${index}`} />
          ))}
        </div>
      )}
    </div>
  );
}
