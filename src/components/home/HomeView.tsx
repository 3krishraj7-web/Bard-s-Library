import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  BookOpen,
  Clock,
  Flame,
  Compass,
  Sparkles,
  ArrowRight,
  Library,
  ExternalLink,
  BookMarked,
  Music,
  Download,
} from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import { BardsLogo } from "../common/BardsLogo";
import {
  getAllOfflineBooks,
  getReadingStats,
  StoredBook,
  ReadingStats,
} from "../../services/offlineDb";
import {
  CURATED_MODERN_COLLECTIONS,
  OnlineBookResult,
} from "../../services/onlineBookService";
import { CURATED_CATALOG } from "../library/LibraryView";

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, togglePlay, linkedBookTitle } = useAudio();

  const [recentBook, setRecentBook] = useState<StoredBook | null>(null);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [totalBooksCount, setTotalBooksCount] = useState<number>(0);
  const [activeCollectionTab, setActiveCollectionTab] = useState<
    "trending" | "lightnovels" | "classics" | "biographies"
  >("trending");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const offline = await getAllOfflineBooks();
        setTotalBooksCount(offline.length || CURATED_CATALOG.length);

        // Find currently linked book or most recently added book
        if (linkedBookTitle) {
          const match = offline.find((b) => b.title === linkedBookTitle);
          if (match) {
            setRecentBook(match);
          } else {
            const catMatch = CURATED_CATALOG.find((b) => b.title === linkedBookTitle);
            if (catMatch) setRecentBook(catMatch);
          }
        } else if (offline.length > 0) {
          setRecentBook(offline[0]);
        } else {
          setRecentBook(CURATED_CATALOG[0]);
        }

        const readingStats = await getReadingStats();
        setStats(readingStats);
      } catch (err) {
        console.warn("Error loading home dashboard:", err);
      }
    }
    loadDashboard();
  }, [linkedBookTitle]);

  const soundscapeShortcuts = [
    {
      title: "Interstellar (Piano & Strings)",
      artist: "Hans Zimmer",
      youtubeId: "UDVtMYqUAyw",
      vibe: "Cinematic Space",
    },
    {
      title: "Concerning Hobbits",
      artist: "Howard Shore",
      youtubeId: "q8ir8hCTnwg",
      vibe: "Acoustic Shire",
    },
    {
      title: "Nuvole Bianche (Piano)",
      artist: "Ludovico Einaudi",
      youtubeId: "kcihcYEOeic",
      vibe: "Smooth Neoclassical",
    },
    {
      title: "Chopin Nocturnes",
      artist: "HALIDONMUSIC",
      youtubeId: "-gDinVAmtA0",
      vibe: "Classical Masterpiece",
    },
  ];

  const handlePlayShortcut = (sc: (typeof soundscapeShortcuts)[0]) => {
    playTrack(
      {
        id: `yt-${sc.youtubeId}`,
        youtubeId: sc.youtubeId,
        title: sc.title,
        artist: sc.artist,
        duration: 0,
        artwork: `https://i.ytimg.com/vi/${sc.youtubeId}/hqdefault.jpg`,
        isLiveStream: false,
        genre: sc.vibe,
      },
      linkedBookTitle || undefined,
    );
  };

  const formatHours = (seconds: number) => {
    const hours = (seconds / 3600).toFixed(1);
    return `${hours} hrs`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* 1. Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[var(--bg-secondary)] to-[var(--bg-surface)] border border-[var(--border-color)] p-8 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center shadow-lg flex-shrink-0">
              <BardsLogo size={42} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
                  Bard's Sanctuary
                </span>
                <span className="text-xs text-[var(--text-muted)]">•</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mt-1">
                Where Literature Meets Soundtrack
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 italic max-w-xl">
                "A reader lives a thousand lives before he dies. The man who never reads lives only one."
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-[var(--bg-surface)]/80 border border-[var(--border-color)] backdrop-blur-sm text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Reading Time</span>
              </div>
              <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                {stats ? formatHours(stats.totalSecondsRead) : "0.0 hrs"}
              </div>
            </div>

            <div className="flex-1 md:flex-initial px-4 py-3 rounded-2xl bg-[var(--bg-surface)]/80 border border-[var(--border-color)] backdrop-blur-sm text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Day Streak</span>
              </div>
              <div className="text-base font-bold text-[var(--text-primary)] mt-0.5">
                {stats ? `${stats.streakDays} days` : "1 day"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Action Split: Continue Reading & Soundscape Lounge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Reading Card (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Continue Reading</h2>
            </div>
            <button
              onClick={() => navigate("/library")}
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              <span>View Shelf ({totalBooksCount})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentBook ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-20 rounded-lg ${recentBook.coverColor} border border-white/10 shadow-md flex items-center justify-center text-white/50 flex-shrink-0 font-serif font-bold text-xs`}
                >
                  EPUB
                </div>
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    Active Tome
                  </span>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mt-1 line-clamp-1">
                    {recentBook.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">{recentBook.author}</p>
                  <p className="text-[10px] text-[var(--accent)] mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{recentBook.ambientTheme}</span>
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                <button
                  onClick={() => navigate(`/reader?bookId=${recentBook.id}`)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Resume Reading</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              No book currently open. Select a title from the library or featured shelves below.
            </div>
          )}

          {/* Quick jump actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => navigate("/library", { state: { tab: "online" } })}
              className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-left transition-colors flex items-center gap-2.5"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-[var(--text-primary)]">Online Catalog</div>
                <div className="text-[10px] text-[var(--text-muted)]">70,000+ open books</div>
              </div>
            </button>
            <button
              onClick={() => navigate("/reader")}
              className="p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-left transition-colors flex items-center gap-2.5"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-medium text-[var(--text-primary)]">AI Matchmaker</div>
                <div className="text-[10px] text-[var(--text-muted)]">Soundtracks & reads</div>
              </div>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-left transition-colors flex items-center gap-2.5"
            >
              <Music className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-medium text-[var(--text-primary)]">Audio Dock</div>
                <div className="text-[10px] text-[var(--text-muted)]">Sleep timer & synth</div>
              </div>
            </button>
          </div>
        </div>

        {/* Atmospheric Soundscapes Card (1 col) */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Soundscape Lounge</h2>
            </div>
            {isPlaying && (
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Playing
              </span>
            )}
          </div>

          <div className="space-y-2">
            {soundscapeShortcuts.map((sc) => {
              const isActive = currentTrack?.title === sc.title;

              return (
                <div
                  key={sc.youtubeId}
                  onClick={() => (isActive ? togglePlay() : handlePlayShortcut(sc))}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md"
                      : "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-primary)]"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold truncate leading-tight">{sc.title}</div>
                    <div
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? "text-white/80" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {sc.artist} • {sc.vibe}
                    </div>
                  </div>

                  <button
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
                      isActive ? "bg-white text-[var(--accent)]" : "bg-[var(--bg-surface)] text-[var(--accent)]"
                    }`}
                  >
                    {isActive && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-[var(--text-muted)] text-center pt-1 border-t border-[var(--border-color)]">
            Click any track to stream instantly into the bottom dock
          </div>
        </div>
      </div>

      {/* 3. Curated Masterpiece Shelves (Manga, Light Novels, Manhwa, Biographies, Classics) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Curated Literary Shelves</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Explore trending web novels, manhwa adaptations, light novels, and timeless masterworks.
            </p>
          </div>

          {/* Collection Tab Selector */}
          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs">
            <button
              onClick={() => setActiveCollectionTab("trending")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeCollectionTab === "trending"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Manga & Webtoons
            </button>
            <button
              onClick={() => setActiveCollectionTab("lightnovels")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeCollectionTab === "lightnovels"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Light Novels
            </button>
            <button
              onClick={() => setActiveCollectionTab("classics")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeCollectionTab === "classics"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Classic Novels
            </button>
            <button
              onClick={() => setActiveCollectionTab("biographies")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeCollectionTab === "biographies"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Biographies
            </button>
          </div>
        </div>

        {/* Display Books based on Active Collection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {activeCollectionTab === "trending" &&
            CURATED_MODERN_COLLECTIONS.filter((b) =>
              ["Manga & Webtoon", "Manhwa & Asian Fiction", "Manga & Comics"].includes(b.category || ""),
            ).map((item) => renderBookCard(item, navigate))}

          {activeCollectionTab === "lightnovels" &&
            CURATED_MODERN_COLLECTIONS.filter((b) => b.category === "Light Novels").map((item) =>
              renderBookCard(item, navigate),
            )}

          {activeCollectionTab === "classics" &&
            CURATED_CATALOG.filter((b) =>
              ["gutenberg-11", "gutenberg-84", "gutenberg-1184", "gutenberg-345", "gutenberg-1661"].includes(b.id),
            ).map((catBook) => (
              <div
                key={catBook.id}
                onClick={() => navigate(`/reader?bookId=${catBook.id}`)}
                className="group cursor-pointer rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className={`h-48 ${catBook.coverColor} p-4 flex flex-col justify-between relative select-none`}>
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-zinc-300 border border-white/10 w-fit">
                    FREE EPUB
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2">{catBook.title}</h3>
                    <p className="text-[11px] text-zinc-300 mt-1">{catBook.author}</p>
                  </div>
                </div>
                <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[var(--accent)] truncate max-w-[140px]">
                    {catBook.ambientTheme}
                  </span>
                  <span className="font-medium text-[var(--accent)] group-hover:underline flex items-center gap-1 text-[11px]">
                    Read Now <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}

          {activeCollectionTab === "biographies" &&
            [
              CURATED_CATALOG.find((b) => b.id === "gutenberg-20203"),
              {
                id: "curated-steve-jobs",
                title: "Steve Jobs",
                authors: ["Walter Isaacson"],
                subjects: ["Biography", "Apple", "Technology", "Design"],
                coverUrl: "https://covers.openlibrary.org/b/id/8316274-M.jpg",
                epubUrl: null,
                downloadCount: 780000,
                source: "curated" as const,
                firstPublishYear: 2011,
                isModernCopyrighted: true,
                category: "Biographies & Memoirs",
                externalUrl: "https://openlibrary.org/works/OL16065529W/Steve_Jobs",
              },
              {
                id: "curated-meditations",
                title: "Meditations",
                authors: ["Marcus Aurelius"],
                subjects: ["Philosophy", "Stoicism", "Memoir", "Roman Empire"],
                coverUrl: "https://covers.openlibrary.org/b/id/8231856-M.jpg",
                epubUrl: "https://www.gutenberg.org/ebooks/2680.epub.noimages",
                downloadCount: 520000,
                source: "gutenberg" as const,
                firstPublishYear: 180,
                isModernCopyrighted: false,
                category: "Biographies & Memoirs",
              },
            ]
              .filter(Boolean)
              .map((item: any) =>
                "coverColor" in item ? (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/reader?bookId=${item.id}`)}
                    className="group cursor-pointer rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
                  >
                    <div className={`h-48 ${item.coverColor} p-4 flex flex-col justify-between relative select-none`}>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-zinc-300 border border-white/10 w-fit">
                        AUTOBIOGRAPHY
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white line-clamp-2">{item.title}</h3>
                        <p className="text-[11px] text-zinc-300 mt-1">{item.author}</p>
                      </div>
                    </div>
                    <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[var(--accent)] truncate max-w-[140px]">
                        {item.ambientTheme}
                      </span>
                      <span className="font-medium text-[var(--accent)] group-hover:underline flex items-center gap-1 text-[11px]">
                        Read Now <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ) : (
                  renderBookCard(item, navigate)
                ),
              )}
        </div>
      </div>
    </div>
  );
};

function renderBookCard(item: OnlineBookResult, navigate: (to: string, state?: any) => void) {
  return (
    <div
      key={item.id}
      className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md"
    >
      <div className="h-52 bg-slate-950 p-4 flex flex-col justify-between relative select-none overflow-hidden">
        {item.coverUrl && (
          <img
            src={item.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-55 group-hover:scale-105 transition-all duration-300"
          />
        )}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-black/70 text-zinc-200 border border-white/10 backdrop-blur-sm">
            {item.category || "Novel"}
          </span>
          {item.firstPublishYear && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
              {item.firstPublishYear}
            </span>
          )}
        </div>

        <div className="relative z-10">
          <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug">{item.title}</h3>
          <p className="text-[11px] text-zinc-300 mt-1 line-clamp-1">{item.authors.join(", ")}</p>
        </div>
      </div>

      <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between gap-2">
        <div className="text-[10px] text-[var(--text-muted)] truncate flex-1">
          {item.subjects[0] || "Fiction"}
        </div>

        {item.epubUrl ? (
          <button
            onClick={() => navigate("/library", { state: { openOnlineSearch: item.title } })}
            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Get EPUB</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="View Work Page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => navigate("/library", { state: { openOnlineSearch: item.title } })}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
            >
              <Library className="w-3 h-3" />
              <span>Catalog</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
