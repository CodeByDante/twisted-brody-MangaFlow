import { BookOpen, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  onEditManga?: (manga: Manga) => void;
  onDeleteManga?: (id: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 24;

export function SearchResults({
  items,
  searchTerm,
  isSearching,
  onSelectComic,
  onEditManga,
  onDeleteManga,
  isLoading = false,
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when items or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items, searchTerm]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  // Get current items
  const currentItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    // Logic to show a window of pages for better UX (e.g. 1 ... 4 5 6 ... 10)
    const showMax = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showMax / 2));
    let endPage = Math.min(totalPages, startPage + showMax - 1);

    if (endPage - startPage + 1 < showMax) {
      startPage = Math.max(1, endPage - showMax + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#bb86fc] disabled:opacity-50 disabled:hover:bg-[#1a1a1a] transition-colors"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#bb86fc] disabled:opacity-50 disabled:hover:bg-[#1a1a1a] transition-colors"
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {startPage > 1 && (
          <span className="text-gray-500 px-1">...</span>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
              ? 'bg-[#bb86fc] text-white'
              : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#333] hover:text-white'
              }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <span className="text-gray-500 px-1">...</span>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#bb86fc] disabled:opacity-50 disabled:hover:bg-[#1a1a1a] transition-colors"
          title="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#bb86fc] disabled:opacity-50 disabled:hover:bg-[#1a1a1a] transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (isSearching && searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
        <div className="text-gray-400 text-sm animate-pulse">Buscando "{searchTerm}"...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5 sm:gap-2 md:gap-3 justify-center items-start animate-in fade-in duration-300">
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5 sm:gap-2 md:gap-3 justify-center items-start">
        {currentItems.map((item) => (
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
              onDelete={onDeleteManga ? () => onDeleteManga(item.id) : undefined}
            />
          </div>
        ))}
      </div>

      {renderPagination()}
    </div>
  );
}
