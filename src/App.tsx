import { Plus, Settings } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { NewMangaModal } from './components/NewMangaModal';
import { SettingsModal } from './components/SettingsModal';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { ComicDetail } from './components/ComicDetail';
import { ChapterReader } from './components/ChapterReader';
import { InfoPage } from './components/InfoPage';

import { SearchBar } from './components/SearchBar';
import { SearchResults } from './components/SearchResults';
import { getAllMangas, deleteManga } from './services/manga';
import { Manga, Chapter } from './types/manga';
import { searchItems } from './utils/searchUtils';
import { GlobalFooter } from './components/GlobalFooter';

type SortType = 'random' | 'name' | 'date' | 'pages' | 'modified';
type SortDirection = 'asc' | 'desc';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [selectedComicId, setSelectedComicId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<{ manga: Manga; chapter: Chapter } | null>(null);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState<SortType>(() =>
    (localStorage.getItem('sortType') as SortType) || 'modified'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(() =>
    (localStorage.getItem('sortDirection') as SortDirection) || 'desc'
  );

  useEffect(() => {
    localStorage.setItem('isAdmin', String(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem('sortType', sortType);
  }, [sortType]);

  useEffect(() => {
    localStorage.setItem('sortDirection', sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    // Initialize Telegram Web App
    // @ts-expect-error Window interface is extended in vite-env.d.ts
    if (window.Telegram?.WebApp) {
      // @ts-expect-error Window interface is extended in vite-env.d.ts
      window.Telegram.WebApp.ready();
    }
    loadMangas();

    const hash = window.location.hash.slice(1);
    if (hash && hash.startsWith('manga/')) {
      const mangaId = hash.replace('manga/', '');
      setSelectedComicId(mangaId);
    } else if (hash === 'info') {
      setShowInfo(true);
    }

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) {
        setSelectedComicId(null);
        setSelectedChapter(null);
        setShowInfo(false);
      } else if (hash.startsWith('manga/')) {
        const mangaId = hash.replace('manga/', '');
        setSelectedComicId(mangaId);
        setSelectedChapter(null);
        setShowInfo(false);
      } else if (hash === 'info') {
        setShowInfo(true);
        setSelectedComicId(null);
        setSelectedChapter(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  async function loadMangas() {
    try {
      setLoading(true);
      const data = await getAllMangas();
      setMangas(data);
    } catch (error) {
      console.error('Error loading mangas:', error);
    } finally {
      setLoading(false);
    }
  }

  const searchResult = useMemo(() => {
    if (!searchTerm.trim()) {
      return { items: mangas, query: '', resultCount: mangas.length };
    }
    return searchItems(
      mangas.map(m => ({ id: m.id, title: m.title, author: m.author })),
      searchTerm,
      { fuzzyMatch: true, minChars: 1 }
    );
  }, [mangas, searchTerm]);

  const filteredMangas = useMemo(() => {
    let items = searchResult.items.length > 0
      ? searchResult.items.map(item => mangas.find(m => m.id === item.id)).filter(Boolean) as Manga[]
      : [];

    const sorted = [...items];

    if (sortType === 'random') {
      return sorted.sort(() => Math.random() - 0.5);
    }

    sorted.sort((a, b) => {
      let compareValue = 0;

      if (sortType === 'name') {
        compareValue = a.title.localeCompare(b.title);
      } else if (sortType === 'date') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        compareValue = dateA - dateB;
      } else if (sortType === 'modified') {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        compareValue = dateA - dateB;
      } else if (sortType === 'pages') {
        const pagesA = a.chapters?.reduce((sum: number, ch: any) => sum + (ch.pages?.length || 0), 0) || 0;
        const pagesB = b.chapters?.reduce((sum: number, ch: any) => sum + (ch.pages?.length || 0), 0) || 0;
        compareValue = pagesA - pagesB;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [mangas, searchTerm, searchResult.items, sortType, sortDirection]);

  const handleEditManga = (manga: Manga) => {
    setEditingManga(manga);
    setShowModal(true);
  };

  const handleDeleteManga = async (mangaId: string) => {
    try {
      await deleteManga(mangaId);
      await loadMangas();
    } catch (error) {
      console.error('Error deleting manga:', error);
      alert('Error al eliminar el manga. Por favor intenta de nuevo.');
    }
  };

  const handleSelectComic = (mangaId: string) => {
    window.location.hash = `manga/${mangaId}`;
    setSelectedComicId(mangaId);
  };

  const handleBackToHome = () => {
    window.location.hash = '';
    setSelectedComicId(null);
    setShowInfo(false);
  };

  const handleNavigateToManga = (newMangaId: string) => {
    if (selectedComicId) {
      setNavigationHistory([...navigationHistory, selectedComicId]);
    }
    window.location.hash = `manga/${newMangaId}`;
    setSelectedComicId(newMangaId);
  };

  const mangaItems = useMemo(() => filteredMangas.map(manga => {
    const chapterCount = manga.chapters?.length || 0;
    const totalPages = manga.chapters?.reduce((sum: number, ch: any) => sum + (ch.pages?.length || 0), 0) || 0;
    return {
      id: manga.id,
      title: manga.title,
      author: manga.author,
      chapterCount,
      pageCount: totalPages,
      thumbnail: manga.cover_url || manga.thumbnail_url || undefined,
      manga,
    };
  }), [filteredMangas]);

  if (selectedChapter) {
    return (
      <ChapterReader
        manga={selectedChapter.manga}
        chapter={selectedChapter.chapter}
        onBack={() => setSelectedChapter(null)}
      />
    );
  }

  if (showInfo) {
    return <InfoPage onBack={handleBackToHome} isAdmin={isAdmin} />;
  }

  if (selectedComicId !== null) {
    let currentManga = mangas.find(m => m.id === selectedComicId);
    return (
      <ComicDetail
        id={selectedComicId}
        onBack={() => {
          if (navigationHistory.length > 0) {
            const previousId = navigationHistory[navigationHistory.length - 1];
            setNavigationHistory(navigationHistory.slice(0, -1));
            window.location.hash = `manga/${previousId}`;
            setSelectedComicId(previousId);
          } else {
            handleBackToHome();
          }
        }}
        onReadChapter={(chapter) => {
          if (currentManga) {
            setSelectedChapter({ manga: currentManga, chapter });
          }
        }}
        onMangaLoaded={(loadedManga) => {
          if (!currentManga) {
            currentManga = loadedManga;
          }
        }}
        onNavigateToManga={handleNavigateToManga}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <header className="border-b border-gray-800/50 px-3 sm:px-6 md:px-12 py-4 sm:py-6 flex-shrink-0 transition-all duration-300">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-1 sm:gap-1.5 group cursor-pointer">
            <img
              src="/icons/icones.png"
              alt="Twisted Brody Logo"
              className="w-10 h-10 sm:w-14 sm:h-14 object-contain transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"
            />
            <h1 className="text-lg sm:text-2xl font-bold text-white transition-colors duration-300 group-hover:text-[#bb86fc]">
              Twisted Brody MangaFlow
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-gray-800 hover:bg-gray-700 active:scale-95 text-white px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-1.5 sm:gap-2 font-semibold transition-all duration-300 border border-gray-700/50 hover:border-gray-600 text-xs sm:text-sm hover:scale-110 hover:shadow-lg hover:shadow-gray-700/50"
              title="Ajustes y Admin"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:rotate-180" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-2 py-2 sm:px-4 sm:py-2.5 rounded-lg flex items-center gap-1.5 sm:gap-2 font-semibold transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 text-xs sm:text-sm hover:scale-110"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:rotate-180" />
              <span className="hidden sm:inline">Nuevo Manga</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-12 py-8">
        <AnnouncementBanner isAdmin={isAdmin} />

        <div className="max-w-[1800px] mx-auto mb-8 flex-shrink-0">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por título, autor..."
            sortType={sortType}
            onSortTypeChange={setSortType}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
          />
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-400">
              {searchResult.resultCount} resultado{searchResult.resultCount !== 1 ? 's' : ''} encontrado{searchResult.resultCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="max-w-[1800px] mx-auto">
          {false ? (
            <div className="hidden"></div>
          ) : (
            <>
              <link rel="preconnect" href="https://i.ibb.co" />
              <SearchResults
                items={mangaItems}
                searchTerm={searchTerm}
                isSearching={false}
                isLoading={loading}
                onSelectComic={handleSelectComic}
                onEditManga={isAdmin ? handleEditManga : undefined}
                onDeleteManga={isAdmin ? handleDeleteManga : undefined}
              />
            </>
          )}
        </div>
      </main>

      <GlobalFooter />

      <NewMangaModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingManga(null);
        }}
        editingManga={editingManga}
        onMangaCreated={(mangaId) => {
          loadMangas();
          setEditingManga(null);
          if (mangaId && !editingManga) {
            setTimeout(() => {
              handleSelectComic(mangaId);
            }, 500);
          }
        }}
        onDelete={isAdmin ? handleDeleteManga : undefined}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isAdmin={isAdmin}
        onAdminChange={setIsAdmin}
      />


    </div>
  );
}

export default App;
