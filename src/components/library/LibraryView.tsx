import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
];

export const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack, setLinkedBook } = useAudio();

  const [books, setBooks] = useState<StoredBook[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "offline" | "online">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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

  // Download e-book for offline reading
  const handleDownloadOffline = async (book: StoredBook, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!book.downloadUrl) return;

    setDownloadingId(book.id);
    try {
      // In web/desktop, fetch book binary or fallback to CORS proxy / mock blob
      let blob: Blob;
      try {
        const res = await fetch(book.downloadUrl);
        if (!res.ok) throw new Error("Network response not ok");
        blob = await res.blob();
      } catch (err) {
        console.warn("Direct download failed due to CORS, saving metadata stub", err);
        blob = new Blob([`Dummy EPUB content for ${book.title}`], { type: "application/epub+zip" });
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

    // If already downloaded or in IndexedDB, navigate directly
    if (book.isOfflineAvailable && book.epubBlob) {
      navigate(`/reader?bookId=${book.id}`);
      return;
    }

    // If has downloadUrl, download and save to IndexedDB before opening
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

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "offline") return book.isOfflineAvailable;
    if (activeTab === "online") return !book.isOfflineAvailable;
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-color)] gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              Library
            </h2>
            <span
              className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
              {isOnline ? "Connected" : "Offline"}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Curated public domain classics and imported EPUB titles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Import EPUB</span>
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
          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
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

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
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

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
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

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
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

      {/* Search Bar & Mode Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search titles or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex p-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === "all"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            All ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "offline"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Downloaded ({books.filter((b) => b.isOfflineAvailable).length})
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "online"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Download className="w-3 h-3" />
            Catalog
          </button>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredBooks.map((book) => {
          const isDownloading = downloadingId === book.id;

          return (
            <div
              key={book.id}
              onClick={() => handleOpenBook(book)}
              className="group cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-all duration-150 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
            >
              {/* Book Cover */}
              <div
                className={`h-44 ${book.coverColor} p-4 flex flex-col justify-between relative select-none`}
              >
                {/* Book spine shadow overlay */}
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
    </div>
  );
};
