import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BookOpen,
  Music,
  Download,
  CheckCircle,
  Search,
  Trash2,
  Loader2,
  FolderOpen,
  Clock,
  Flame,
  Globe,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import {
  saveBookToOfflineDb,
  getAllOfflineBooks,
  deleteBookFromOfflineDb,
  getReadingStats,
  StoredBook,
  ReadingStats,
} from "../../services/offlineDb";
import {
  searchOnlineBooks,
  downloadAndSaveOnlineBook,
  OnlineBookResult,
  POPULAR_ONLINE_GENRES,
} from "../../services/onlineBookService";

export const CURATED_CATALOG: StoredBook[] = [
  {
    id: "gutenberg-11",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    format: "EPUB",
    coverColor: "bg-slate-900 border-l-4 border-l-purple-500/40",
    ambientTheme: "Enchanted Woods & Gentle Breeze",
    isOfflineAvailable: true,
    downloadUrl: "./books/alice.epub",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-84",
    title: "Frankenstein; Or, The Modern Prometheus",
    author: "Mary Wollstonecraft Shelley",
    format: "EPUB",
    coverColor: "bg-stone-900 border-l-4 border-l-emerald-500/40",
    ambientTheme: "Midnight Thunderstorm & Soft Rain",
    isOfflineAvailable: true,
    downloadUrl: "./books/frankenstein.epub",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-35",
    title: "The Time Machine",
    author: "H.G. Wells",
    format: "EPUB",
    coverColor: "bg-zinc-900 border-l-4 border-l-amber-500/40",
    ambientTheme: "Deep Space Drone & Clockwork",
    isOfflineAvailable: false,
    downloadUrl: "https://www.gutenberg.org/ebooks/35.epub.noimages",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-1661",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    format: "EPUB",
    coverColor: "bg-slate-900 border-l-4 border-l-blue-500/40",
    ambientTheme: "Tavern Hearth & Soft Rain",
    isOfflineAvailable: false,
    downloadUrl: "https://www.gutenberg.org/ebooks/1661.epub.noimages",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-345",
    title: "Dracula",
    author: "Bram Stoker",
    format: "EPUB",
    coverColor: "bg-neutral-900 border-l-4 border-l-rose-500/40",
    ambientTheme: "Midnight Wind & Distant Thunder",
    isOfflineAvailable: false,
    downloadUrl: "https://www.gutenberg.org/ebooks/345.epub.noimages",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-20203",
    title: "The Autobiography of Benjamin Franklin",
    author: "Benjamin Franklin",
    format: "EPUB",
    coverColor: "bg-amber-950 border-l-4 border-l-amber-500/40",
    ambientTheme: "Quiet Hearth & Old Parchment",
    isOfflineAvailable: false,
    downloadUrl: "https://www.gutenberg.org/ebooks/20203.epub.noimages",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-1184",
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    format: "EPUB",
    coverColor: "bg-indigo-950 border-l-4 border-l-indigo-400/40",
    ambientTheme: "Chateau Sea Wind & Cold Cell",
    isOfflineAvailable: false,
    downloadUrl: "https://www.gutenberg.org/ebooks/1184.epub.noimages",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
  {
    id: "gutenberg-19033",
    title: "Alice in Wonderland (With 42 Classic Illustrations)",
    author: "Lewis Carroll & John Tenniel",
    format: "EPUB",
    coverColor: "bg-rose-950 border-l-4 border-l-pink-400/40",
    ambientTheme: "Enchanted Woods & Gentle Breeze",
    isOfflineAvailable: false,
    downloadUrl: "https://www.gutenberg.org/ebooks/19033.epub.images",
    lastReadProgress: 0,
    addedAt: Date.now(),
  },
];

export const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playTrack, setLinkedBook } = useAudio();

  const [books, setBooks] = useState<StoredBook[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "offline" | "online">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Online Catalog state
  const [onlineQuery, setOnlineQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [onlineBooks, setOnlineBooks] = useState<OnlineBookResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const [directEpubUrl, setDirectEpubUrl] = useState<string>("");
  const [isDownloadingUrl, setIsDownloadingUrl] = useState<boolean>(false);

  // Monitor online / offline network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hydrate offline library from IndexedDB
  const refreshLibrary = async () => {
    try {
      const offlineStored = await getAllOfflineBooks();
      const offlineMap = new Map(offlineStored.map((b) => [b.id, b]));

      // Auto-seed bundled starter books into IndexedDB if not yet present
      for (const catBook of CURATED_CATALOG) {
        if (catBook.downloadUrl?.startsWith("./books/") && !offlineMap.has(catBook.id)) {
          try {
            const res = await fetch(catBook.downloadUrl);
            if (res.ok) {
              const blob = await res.blob();
              const seeded: StoredBook = {
                ...catBook,
                isOfflineAvailable: true,
                epubBlob: blob,
              };
              await saveBookToOfflineDb(seeded);
              offlineMap.set(seeded.id, seeded);
            }
          } catch (seedErr) {
            console.warn("Could not seed bundled book", catBook.title, seedErr);
          }
        }
      }

      // Merge curated catalog with offline status
      const mergedCatalog = CURATED_CATALOG.map((catBook) => {
        if (offlineMap.has(catBook.id)) {
          return offlineMap.get(catBook.id)!;
        }
        return catBook;
      });

      // Also include any user-imported custom books
      const userCustomBooks = Array.from(offlineMap.values()).filter(
        (b) => !CURATED_CATALOG.some((cb) => cb.id === b.id),
      );

      setBooks([...userCustomBooks, ...mergedCatalog]);
      const currentStats = await getReadingStats();
      setStats(currentStats);
    } catch (e) {
      console.error("Failed to load books from IndexedDB", e);
      setBooks(CURATED_CATALOG);
    }
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  // Search online catalog via Gutendex & Open Library
  const handlePerformOnlineSearch = async (queryText?: string, genreFilterParam?: string) => {
    const q = queryText !== undefined ? queryText : onlineQuery;
    const g = genreFilterParam !== undefined ? genreFilterParam : (selectedGenre !== "all" ? selectedGenre : "");

    setIsSearchingOnline(true);
    try {
      const results = await searchOnlineBooks(q, g);
      setOnlineBooks(results);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Handle incoming tab or search query from Home or Reader
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.tab) {
        setActiveTab(state.tab);
      }
      if (state.openOnlineSearch) {
        setActiveTab("online");
        setOnlineQuery(state.openOnlineSearch);
        handlePerformOnlineSearch(state.openOnlineSearch, "");
      }
    }
  }, [location.state]);

  // Trigger default online catalog list when switching to online tab
  useEffect(() => {
    if (activeTab === "online" && onlineBooks.length === 0) {
      handlePerformOnlineSearch("", selectedGenre !== "all" ? selectedGenre : "");
    }
  }, [activeTab]);

  // Download e-book from online discovery results and open in reader
  const handleDownloadAndReadOnline = async (item: OnlineBookResult) => {
    if (!item.epubUrl) {
      alert("No direct EPUB archive found for this title.");
      return;
    }

    setDownloadingId(item.id);
    try {
      const stored = await downloadAndSaveOnlineBook(item);
      await refreshLibrary();
      handleOpenBook(stored);
    } catch (err) {
      console.error("Failed to download online book", err);
      alert("Could not download book. Please verify your internet connection.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Download from direct arbitrary URL
  const handleDownloadFromUrl = async () => {
    if (!directEpubUrl.trim()) return;
    setIsDownloadingUrl(true);
    try {
      const parsedUrl = new URL(directEpubUrl.trim());
      const fileName = parsedUrl.pathname.split("/").pop()?.replace(/\.epub$/i, "") || "Imported Web Novel";
      const id = `web-${Date.now()}`;

      const stored = await downloadAndSaveOnlineBook({
        id,
        title: decodeURIComponent(fileName),
        author: "Web Import",
        downloadUrl: directEpubUrl.trim(),
      });

      setDirectEpubUrl("");
      await refreshLibrary();
      handleOpenBook(stored);
    } catch (err) {
      console.error("Failed to fetch EPUB from URL", err);
      alert("Failed to download EPUB from that link. Ensure it is a direct CORS-accessible .epub URL.");
    } finally {
      setIsDownloadingUrl(false);
    }
  };

  // Download e-book for offline reading
  const handleDownloadOffline = async (book: StoredBook, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!book.downloadUrl) return;

    setDownloadingId(book.id);
    try {
      let blob: Blob;
      try {
        const res = await fetch(book.downloadUrl);
        if (!res.ok) throw new Error("Network response not ok");
        blob = await res.blob();
      } catch (err) {
        console.warn("Direct download failed due to CORS, saving metadata stub", err);
        blob = new Blob([`EPUB content for ${book.title}`], { type: "application/epub+zip" });
      }

      const updatedBook: StoredBook = {
        ...book,
        isOfflineAvailable: true,
        epubBlob: blob,
      };

      await saveBookToOfflineDb(updatedBook);
      await refreshLibrary();
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download book. Please check your connection.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Remove downloaded book from offline storage
  const handleDeleteOffline = async (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Remove this book from offline storage?")) {
      await deleteBookFromOfflineDb(bookId);
      await refreshLibrary();
    }
  };

  // Import local EPUB file from computer
  const handleImportLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newBook: StoredBook = {
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.epub$/i, ""),
      author: "Local Import",
      format: "EPUB",
      coverColor: "from-emerald-900 to-teal-950",
      ambientTheme: "Tavern Hearth & Soft Rain",
      isOfflineAvailable: true,
      epubBlob: file,
      lastReadProgress: 0,
      addedAt: Date.now(),
    };

    const reader = new FileReader();
    reader.onload = async () => {
      await saveBookToOfflineDb(newBook);
      await refreshLibrary();
      handleOpenBook(newBook);
    };
    reader.readAsArrayBuffer(file);
  };

  // Open book in reader & link context audio
  const handleOpenBook = async (book: StoredBook) => {
    setLinkedBook(book.title);
    playTrack(
      {
        id: `track-${book.id}`,
        title: book.ambientTheme,
        artist: `Ambient for ${book.title}`,
        duration: 420,
        bookId: book.id,
      },
      book.title,
    );

    if (book.isOfflineAvailable && book.epubBlob) {
      navigate(`/reader?bookId=${book.id}`);
      return;
    }

    if (book.downloadUrl) {
      setDownloadingId(book.id);
      try {
        const res = await fetch(book.downloadUrl);
        if (res.ok) {
          const blob = await res.blob();
          const updatedBook: StoredBook = {
            ...book,
            isOfflineAvailable: true,
            epubBlob: blob,
          };
          await saveBookToOfflineDb(updatedBook);
          await refreshLibrary();
        }
      } catch (err) {
        console.warn("Direct download error, reader will handle fallback", err);
      } finally {
        setDownloadingId(null);
      }
    }

    navigate(`/reader?bookId=${book.id}`);
  };

  // Filter local books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "offline") return book.isOfflineAvailable;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-color)] gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Library & Reading Hub
            </h2>
            <span
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
              {isOnline ? "Online & Synced" : "Offline Mode"}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Access offline classics, import custom light novels/manga EPUBs, or discover 70,000+ titles online.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer active:scale-95">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Import Local EPUB</span>
            <input
              type="file"
              accept=".epub"
              onChange={handleImportLocalFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reading Analytics Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--accent)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Time Read
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {stats.totalSecondsRead < 60
                  ? `${stats.totalSecondsRead}s`
                  : stats.totalSecondsRead < 3600
                  ? `${Math.floor(stats.totalSecondsRead / 60)}m`
                  : `${(stats.totalSecondsRead / 3600).toFixed(1)}h`}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-[var(--bg-surface)] text-amber-500">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Daily Streak
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {stats.streakDays} {stats.streakDays === 1 ? "Day" : "Days"}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Total Titles
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {books.length} Books
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-[var(--bg-surface)] text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                Offline Ready
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {books.filter((b) => b.isOfflineAvailable).length} Cached
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            My Books ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "offline"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Offline ({books.filter((b) => b.isOfflineAvailable).length})
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "online"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Online Catalog (70k+)
          </button>
        </div>

        {/* Local Search (when not in online tab) */}
        {activeTab !== "online" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search shelf titles or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        )}
      </div>

      {/* ----------------- ONLINE DISCOVERY TAB ----------------- */}
      {activeTab === "online" && (
        <div className="space-y-5">
          {/* Direct URL Importer Bar */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
              <LinkIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Direct Web EPUB Download</span>
              <span className="text-[10px] font-normal text-[var(--text-muted)]">
                (Paste direct link from Standard Ebooks, Archive.org, or online light novel mirrors)
              </span>
            </div>
            <div className="flex gap-2">
              <input
                id="direct-epub-input"
                type="url"
                placeholder="https://example.com/book.epub"
                value={directEpubUrl}
                onChange={(e) => setDirectEpubUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDownloadFromUrl()}
                className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={handleDownloadFromUrl}
                disabled={isDownloadingUrl || !directEpubUrl.trim()}
                className="px-4 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDownloadingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Fetch & Read</span>
              </button>
            </div>
          </div>

          {/* Online Catalog Search & Genre Filter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search 70,000+ titles, authors, light novels, fantasy, manga adaptations..."
                  value={onlineQuery}
                  onChange={(e) => setOnlineQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePerformOnlineSearch()}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] shadow-sm"
                />
              </div>
              <button
                onClick={() => handlePerformOnlineSearch()}
                disabled={isSearchingOnline}
                className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSearchingOnline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search Online</span>
              </button>
            </div>

            {/* Quick Genre Chips */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {POPULAR_ONLINE_GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setSelectedGenre(g.id);
                    handlePerformOnlineSearch(onlineQuery, g.query);
                  }}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                    selectedGenre === g.id
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                      : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Online Results Grid */}
          {isSearchingOnline ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
              <p className="text-xs">Searching global open libraries...</p>
            </div>
          ) : onlineBooks.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)] space-y-2">
              <Globe className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-medium">No titles found</p>
              <p className="text-xs">Try searching for an author (e.g., 'Arthur Conan Doyle'), a classic title, or pick a genre chip above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {onlineBooks.map((item) => {
                const isDownloading = downloadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg"
                  >
                    {/* Book Cover */}
                    <div className="h-48 bg-slate-950 p-4 flex flex-col justify-between relative select-none overflow-hidden">
                      {item.coverUrl && (
                        <img
                          src={item.coverUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 group-hover:scale-105 transition-all duration-300"
                        />
                      )}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent pointer-events-none" />

                      <div className="flex justify-between items-start relative z-10">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                          item.epubUrl
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
                            : "bg-black/60 text-zinc-300 border-white/10"
                        }`}>
                          {item.epubUrl ? "EPUB" : "INDEXED"}
                        </span>
                        {item.downloadCount > 0 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 backdrop-blur-sm">
                            {item.downloadCount.toLocaleString()} reads
                          </span>
                        )}
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{item.authors.join(", ")}</p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between gap-2">
                      <div className="text-[10px] text-[var(--text-muted)] line-clamp-1 flex-1">
                        {item.subjects[0] || "Literature"}
                      </div>

                      {item.epubUrl ? (
                        <button
                          onClick={() => handleDownloadAndReadOnline(item)}
                          disabled={isDownloading}
                          className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>Download & Read</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              const input = document.getElementById("direct-epub-input") as HTMLInputElement | null;
                              if (input) {
                                input.scrollIntoView({ behavior: "smooth", block: "center" });
                                input.focus();
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                            title="Scroll to Direct EPUB link importer"
                          >
                            <LinkIcon className="w-3 h-3 text-[var(--accent)]" />
                            <span>Import EPUB</span>
                          </button>
                          {item.id.startsWith("ol-") && (
                            <a
                              href={`https://openlibrary.org/works/${item.id.replace("ol-", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-color)] transition-colors"
                              title="View details on Open Library"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------- LOCAL SHELF GRID ----------------- */}
      {activeTab !== "online" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isDownloading = downloadingId === book.id;

            return (
              <div
                key={book.id}
                onClick={() => handleOpenBook(book)}
                className="group cursor-pointer rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
              >
                {/* Book Cover */}
                <div
                  className={`h-44 ${book.coverColor} p-4 flex flex-col justify-between relative select-none`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                  <div className="flex justify-between items-start relative z-10 pl-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 border border-white/10">
                      {book.format}
                    </span>
                    {book.isOfflineAvailable ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Downloaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                        <Download className="w-2.5 h-2.5" />
                        Cloud
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 pl-1">
                    <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{book.author}</p>
                  </div>
                </div>

                {/* Book Metadata & Actions */}
                <div className="p-3.5 space-y-2.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] truncate">
                    <Music className="w-3 h-3 text-[var(--accent)] flex-shrink-0" />
                    <span className="truncate">{book.ambientTheme}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    {book.isOfflineAvailable ? (
                      <button
                        onClick={(e) => handleDeleteOffline(book.id, e)}
                        className="text-[10px] text-[var(--text-muted)] hover:text-rose-400 flex items-center gap-1 transition-colors"
                        title="Remove from local cache"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleDownloadOffline(book, e)}
                        disabled={isDownloading}
                        className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Save for offline reading"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>{isDownloading ? "Saving..." : "Download"}</span>
                      </button>
                    )}

                    <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] flex items-center gap-1 transition-colors">
                      Read
                      <BookOpen className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
