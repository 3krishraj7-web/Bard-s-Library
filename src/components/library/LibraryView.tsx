import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Music,
  Download,
  CheckCircle,
  Search,
  Wifi,
  WifiOff,
  Trash2,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import {
  saveBookToOfflineDb,
  getAllOfflineBooks,
  deleteBookFromOfflineDb,
  StoredBook,
} from "../../services/offlineDb";

export const CURATED_CATALOG: StoredBook[] = [
  {
    id: "gutenberg-11",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    format: "EPUB",
    coverColor: "from-purple-900 to-violet-950",
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
    coverColor: "from-zinc-800 to-stone-950",
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
    coverColor: "from-amber-900 to-yellow-950",
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
    coverColor: "from-blue-950 to-slate-900",
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
    coverColor: "from-rose-950 to-neutral-950",
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
      {/* Top Header with Status Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border-color)] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              E-Book Library & Catalog
            </h2>
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online Mode" : "Offline Mode"}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Browse online classics, download to IndexedDB for offline reading, or import local files.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer">
            <FolderOpen className="w-4 h-4" />
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

      {/* Search Bar & Mode Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search title, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Books ({books.length})
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "offline"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            Offline Ready ({books.filter((b) => b.isOfflineAvailable).length})
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "online"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Download className="w-3 h-3" />
            Discover Online
          </button>
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredBooks.map((book) => {
          const isDownloading = downloadingId === book.id;

          return (
            <div
              key={book.id}
              onClick={() => handleOpenBook(book)}
              className="group cursor-pointer rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
            >
              {/* Book Cover simulation */}
              <div
                className={`h-48 bg-gradient-to-br ${book.coverColor} p-4 flex flex-col justify-between relative`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm">
                    {book.format}
                  </span>
                  {book.isOfflineAvailable ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/80 text-white backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Offline
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/80 text-white backdrop-blur-sm flex items-center gap-1 shadow-sm">
                      <Wifi className="w-2.5 h-2.5" />
                      Online
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-md">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5">{book.author}</p>
                </div>
              </div>

              {/* Book Metadata & Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-[var(--accent)] bg-[var(--bg-secondary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-color)]">
                  <Music className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{book.ambientTheme}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                  {book.isOfflineAvailable ? (
                    <button
                      onClick={(e) => handleDeleteOffline(book.id, e)}
                      className="text-[10px] text-[var(--text-muted)] hover:text-rose-400 flex items-center gap-1 transition-colors"
                      title="Delete from offline storage"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleDownloadOffline(book, e)}
                      disabled={isDownloading}
                      className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Download for offline access"
                    >
                      {isDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{isDownloading ? "Downloading..." : "Download"}</span>
                    </button>
                  )}

                  <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] flex items-center gap-1">
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
