import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import ePub, { Book, Rendition } from "epubjs";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Sliders,
  Type,
  BookOpen,
  Loader2,
  List,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Clock,
  Bot,
  X,
  Highlighter,
  Maximize2,
  Minimize2,
  Trash2,
  Music,
  Compass,
  Play,
  RefreshCw,
  Library,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAudio } from "../../context/AudioContext";
import { saveReadingState, getReadingState } from "../../services/storageService";
import {
  getBookFromOfflineDb,
  saveBookToOfflineDb,
  HighlightItem,
  saveHighlight,
  getHighlightsByBook,
  deleteHighlight,
  recordReadingTime,
} from "../../services/offlineDb";
import {
  getSoundtrackRecommendations,
  getNextBookRecommendations,
  READING_MOODS,
  SoundtrackRecommendation,
  BookRecommendation,
  ReadingFormat,
} from "../../services/geminiService";
import { CURATED_CATALOG } from "../library/LibraryView";
import type { AppLayoutContext } from "../layout/AppLayout";

const HIGHLIGHT_COLORS: Record<
  "yellow" | "green" | "purple",
  { hex: string; bgClass: string; label: string }
> = {
  yellow: { hex: "#eab308", bgClass: "bg-amber-400", label: "Yellow" },
  green: { hex: "#10b981", bgClass: "bg-emerald-400", label: "Mint" },
  purple: { hex: "#a855f7", bgClass: "bg-purple-400", label: "Violet" },
};

interface TocItem {
  id: string;
  href: string;
  label: string;
}

interface SavedBookmark {
  cfi: string;
  label: string;
  timestamp: number;
}

export const EpubReader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetBookId = queryParams.get("bookId");

  const outletContext = useOutletContext<AppLayoutContext | null>();
  const isZenMode = outletContext?.isZenMode ?? false;
  const toggleZenMode = outletContext?.toggleZenMode ?? (() => {});

  const { theme, setTypography } = useTheme();
  const { linkedBookTitle, setLinkedBook, playTrack, currentTrack } = useAudio();

  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const hasPromptedNextReadRef = useRef<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentBookName, setCurrentBookName] = useState<string>(
    linkedBookTitle || "The King in Yellow",
  );
  const [currentBookId, setCurrentBookId] = useState<string>("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [isBookLoaded, setIsBookLoaded] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(false);
  const [currentCfi, setCurrentCfi] = useState<string>("");
  const [readingSeconds, setReadingSeconds] = useState<number>(0);

  // Dedicated AI Companion State: Soundtracks & Next Reads
  const [showAi, setShowAi] = useState<boolean>(false);
  const [aiTab, setAiTab] = useState<"soundtrack" | "nextRead">("soundtrack");
  const [soundtrackMood, setSoundtrackMood] = useState<string>("cozy");
  const [customSoundtrackVibe, setCustomSoundtrackVibe] = useState<string>("");
  const [soundtracks, setSoundtracks] = useState<SoundtrackRecommendation[]>([]);
  const [isGeneratingSoundtracks, setIsGeneratingSoundtracks] = useState<boolean>(false);

  const [formatFilter, setFormatFilter] = useState<ReadingFormat>("All");
  const [customNextReadVibe, setCustomNextReadVibe] = useState<string>("");
  const [nextReads, setNextReads] = useState<BookRecommendation[]>([]);
  const [isGeneratingNextReads, setIsGeneratingNextReads] = useState<boolean>(false);

  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedCfiRange, setSelectedCfiRange] = useState<string>("");
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [showHighlights, setShowHighlights] = useState<boolean>(false);

  // Fetch soundtrack recommendations
  const handleFetchSoundtracks = async (mood: string = soundtrackMood, customNote?: string) => {
    setIsGeneratingSoundtracks(true);
    const results = await getSoundtrackRecommendations(
      currentBookName,
      mood,
      customNote || customSoundtrackVibe,
    );
    setSoundtracks(results);
    setIsGeneratingSoundtracks(false);
  };

  // Fetch next read recommendations
  const handleFetchNextReads = async (filter: ReadingFormat = formatFilter, customVibe?: string) => {
    setIsGeneratingNextReads(true);
    const results = await getNextBookRecommendations(
      currentBookName,
      filter,
      customVibe || customNextReadVibe,
    );
    setNextReads(results);
    setIsGeneratingNextReads(false);
  };

  // Play recommended track into audio dock
  const handlePlayRecommendedTrack = (rec: SoundtrackRecommendation) => {
    playTrack(
      {
        id: rec.youtubeId ? `yt-${rec.youtubeId}` : `yt-rec-${Date.now()}`,
        title: rec.title,
        artist: rec.artist,
        duration: 0,
        youtubeId: rec.youtubeId || "UDVtMYqUAyw",
        artwork: rec.youtubeId
          ? `https://i.ytimg.com/vi/${rec.youtubeId}/hqdefault.jpg`
          : undefined,
        isLiveStream: false,
        genre: rec.mood,
      },
      currentBookName,
    );
  };

  // 1-Click navigate to Online Library Catalog with search query preloaded
  const handleSearchNextReadInCatalog = (rec: BookRecommendation) => {
    navigate("/", { state: { openOnlineSearch: rec.title } });
  };

  // Automatically fetch recommendations when drawer first opens
  useEffect(() => {
    if (showAi) {
      if (aiTab === "soundtrack" && soundtracks.length === 0) {
        handleFetchSoundtracks(soundtrackMood);
      } else if (aiTab === "nextRead" && nextReads.length === 0) {
        handleFetchNextReads(formatFilter);
      }
    }
  }, [showAi, aiTab, currentBookName]);

  const applyAnnotationToRendition = (
    cfiRange: string,
    color: "yellow" | "green" | "purple",
  ) => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.annotations.add(
        "highlight",
        cfiRange,
        {},
        undefined,
        "bards-hl",
        {
          fill: HIGHLIGHT_COLORS[color]?.hex || "#eab308",
          "fill-opacity": "0.35",
        },
      );
    } catch (e) {
      console.warn("Annotation render error:", e);
    }
  };

  const handleAddHighlight = async (color: "yellow" | "green" | "purple") => {
    if (!selectedCfiRange || !selectedText) return;
    const newHl: HighlightItem = {
      id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bookId: currentBookId,
      cfiRange: selectedCfiRange,
      text: selectedText,
      color,
      createdAt: Date.now(),
    };

    applyAnnotationToRendition(newHl.cfiRange, newHl.color);
    await saveHighlight(newHl);
    setHighlights((prev) => [newHl, ...prev]);
    setSelectedText("");
    setSelectedCfiRange("");
  };

  const handleDeleteHighlight = async (id: string, cfiRange: string) => {
    if (renditionRef.current) {
      try {
        renditionRef.current.annotations.remove(cfiRange, "highlight");
      } catch (e) {
        console.warn("Error removing annotation", e);
      }
    }
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const handleUpdateHighlightNote = async (hl: HighlightItem, note: string) => {
    const updated = { ...hl, note };
    await saveHighlight(updated);
    setHighlights((prev) => prev.map((h) => (h.id === hl.id ? updated : h)));
  };

  const handleJumpToHighlight = (cfiRange: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfiRange);
    }
  };

  // Reading session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setReadingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Accumulate reading analytics in IndexedDB every 60 seconds of active reading
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && isBookLoaded) {
        recordReadingTime(60).catch(() => {});
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isBookLoaded]);

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return mins === 0 ? `${seconds}s` : `${mins}m ${seconds % 60}s`;
  };

  // Apply theme styling dynamically to epub.js rendition iframe
  const applyStylesToRendition = useCallback(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.themes.fontSize(theme.typography.readerFontSize);
      renditionRef.current.themes.font(theme.typography.fontFamily);
      renditionRef.current.themes.default({
        body: {
          background: "transparent !important",
          color: `${theme.colors.textPrimary} !important`,
          padding: `${theme.typography.readerMargin} !important`,
          "line-height": `${theme.typography.readerLineHeight} !important`,
        },
        "p, span, div, h1, h2, h3, h4, h5, h6": {
          color: `${theme.colors.textPrimary} !important`,
        },
        a: {
          color: `${theme.colors.accent} !important`,
        },
      });
    } catch (e) {
      console.warn("Error applying styles to rendition:", e);
    }
  }, [theme]);

  // Load EPUB file from ArrayBuffer
  const loadEpubBuffer = async (data: ArrayBuffer, name: string) => {
    if (!viewerRef.current) return;
    setIsLoading(true);
    setCurrentBookName(name);
    setLinkedBook(name);

    const generatedId = `epub-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    setCurrentBookId(generatedId);

    // Destroy existing rendition if any
    if (renditionRef.current) {
      try {
        renditionRef.current.destroy();
      } catch (e) {
        console.warn("Cleanup error", e);
      }
    }

    try {
      // Initialize epub.js Book instance
      const book = ePub(data);
      bookRef.current = book;

      await book.ready;

      // Extract Table of Contents
      const navigation = await book.loaded.navigation;
      if (navigation && navigation.toc) {
        setToc(
          navigation.toc.map((item) => ({
            id: item.id,
            href: item.href,
            label: item.label.trim(),
          })),
        );
      }

      // Render book
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
      });
      renditionRef.current = rendition;

      applyStylesToRendition();

      // Load & restore highlights for this title
      try {
        const storedHls = await getHighlightsByBook(generatedId);
        setHighlights(storedHls);
        storedHls.forEach((hl) => {
          applyAnnotationToRendition(hl.cfiRange, hl.color);
        });
      } catch (hlErr) {
        console.warn("Could not load highlights:", hlErr);
      }

      // Restore saved location from Rust backend / localStorage
      const savedState = await getReadingState(generatedId);
      if (savedState && savedState.cfi) {
        await rendition.display(savedState.cfi);
        setReadingProgress(Math.round(savedState.progressPct));
        setCurrentCfi(savedState.cfi);
      } else {
        await rendition.display();
      }

      // Track location change and persist state
      rendition.on("relocated", (location: any) => {
        if (location && location.start) {
          const cfi = location.start.cfi;
          const percentage = location.start.percentage
            ? location.start.percentage * 100
            : 0;
          setCurrentCfi(cfi);
          const pct = Math.round(percentage);
          setReadingProgress(pct);
          saveReadingState(generatedId, cfi, percentage);

          // Prompt Next-Read matchmaker when reaching the climax / end of the book
          if (pct >= 95 && !hasPromptedNextReadRef.current) {
            hasPromptedNextReadRef.current = true;
            setShowAi(true);
            setAiTab("nextRead");
          }
        }
      });

      // Text selection listener for instant Gemini AI lookup & highlighter
      rendition.on("selected", (cfiRange: string, contents: any) => {
        try {
          const selection = contents.window.getSelection();
          const str = selection ? selection.toString().trim() : "";
          if (str && str.length > 2) {
            setSelectedText(str);
            setSelectedCfiRange(cfiRange);
          }
        } catch (selErr) {
          console.warn("Selection listener error", selErr);
        }
      });

      // Load bookmarks
      const storedBookmarks = localStorage.getItem(`bards_bookmarks_${generatedId}`);
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }

      setIsBookLoaded(true);
    } catch (err) {
      console.error("Error loading EPUB:", err);
      // Fallback: If not valid EPUB archive, show styled built-in reader canvas
      setIsBookLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if bookId was passed in route and load from offline IndexedDB or bundled starter books
  useEffect(() => {
    const bookIdToLoad = targetBookId || "gutenberg-11";
    getBookFromOfflineDb(bookIdToLoad).then(async (book) => {
      if (book && book.epubBlob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            loadEpubBuffer(e.target.result, book.title);
          }
        };
        reader.readAsArrayBuffer(book.epubBlob);
      } else {
        // Fallback to fetch from bundled catalog if not in IndexedDB
        const catalogEntry = CURATED_CATALOG.find((b) => b.id === bookIdToLoad);
        if (catalogEntry?.downloadUrl) {
          setIsLoading(true);
          try {
            const res = await fetch(catalogEntry.downloadUrl);
            if (res.ok) {
              const blob = await res.blob();
              const seeded = { ...catalogEntry, isOfflineAvailable: true, epubBlob: blob };
              await saveBookToOfflineDb(seeded);
              const buf = await blob.arrayBuffer();
              loadEpubBuffer(buf, catalogEntry.title);
            }
          } catch (fetchErr) {
            console.warn("Could not auto-fetch catalog book", fetchErr);
          } finally {
            setIsLoading(false);
          }
        }
      }
    });
  }, [targetBookId]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          loadEpubBuffer(event.target.result, file.name.replace(/\.epub$/i, ""));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Add bookmark at current position
  const handleAddBookmark = () => {
    if (!currentCfi && isBookLoaded) return;
    const newBookmark: SavedBookmark = {
      cfi: currentCfi || "sample-loc",
      label: `Bookmark at ${readingProgress}%`,
      timestamp: Date.now(),
    };
    const updated = [newBookmark, ...bookmarks];
    setBookmarks(updated);
    const generatedId = `epub-${currentBookName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    localStorage.setItem(`bards_bookmarks_${generatedId}`, JSON.stringify(updated));
  };

  // Navigation handlers
  const handlePrevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  };

  const handleNextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevPage();
      } else if (e.key === "ArrowRight") {
        handleNextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync theme changes with rendition
  useEffect(() => {
    applyStylesToRendition();
  }, [theme, applyStylesToRendition]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] select-none">
      {/* 1. Header Bar: Title, Controls, Table of Contents, File Picker */}
      <header className="h-12 flex-shrink-0 flex items-center justify-between px-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3 min-w-0">
          <BookOpen className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
          <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-sm">
            {currentBookName}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] border-l border-[var(--border-color)] pl-3 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatSessionTime(readingSeconds)}
          </span>
          {isBookLoaded && (
            <span className="text-[10px] text-[var(--text-muted)] border-l border-[var(--border-color)] pl-3 font-mono">
              {readingProgress}%
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bookmark Button */}
          <button
            onClick={handleAddBookmark}
            className="p-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-1.5 transition-colors"
            title="Save Bookmark"
          >
            <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Bookmark</span>
          </button>

          {/* Bookmarks List toggle */}
          {bookmarks.length > 0 && (
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showBookmarks
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Saved Bookmarks"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{bookmarks.length}</span>
            </button>
          )}

          {/* Table of Contents Toggle */}
          {toc.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showToc
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title="Table of Contents"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chapters</span>
            </button>
          )}

          {/* Highlights & Notes Drawer Toggle */}
          <button
            onClick={() => {
              setShowHighlights(!showHighlights);
              if (!showHighlights) setShowAi(false);
            }}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showHighlights
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="Highlights & Notes Drawer"
          >
            <Highlighter className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Notes</span>
            {highlights.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--accent)]/15 text-[var(--accent)] font-semibold">
                {highlights.length}
              </span>
            )}
          </button>

          {/* AI Companion Toggle */}
          <button
            onClick={() => {
              setShowAi(!showAi);
              if (!showAi) setShowHighlights(false);
            }}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showAi
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="Gemini AI Companion"
          >
            <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">AI Companion</span>
          </button>

          {/* Zen Focus Mode Toggle */}
          <button
            onClick={toggleZenMode}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              isZenMode
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title={isZenMode ? "Exit Zen Mode (Esc)" : "Enter Zen Focus Mode"}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Zen</span>
          </button>

          {/* Formatting Popover Toggle */}
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              showControls
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-hover)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            title="Formatting & Margins"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Text Settings</span>
          </button>

          {/* Import / Open Local EPUB button */}
          <label className="p-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
            <FolderOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Open EPUB</span>
            <input
              type="file"
              accept=".epub"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </header>

      {/* 2. Formatting Popover Toolbar */}
      {showControls && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-[var(--bg-surface)] border-b border-[var(--border-color)] text-xs shadow-md">
          <div className="flex flex-wrap items-center gap-4">
            {/* Font Size */}
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">Size:</span>
              <button
                onClick={() => {
                  const curr = parseInt(theme.typography.readerFontSize, 10) || 18;
                  if (curr > 12) setTypography("readerFontSize", `${curr - 2}px`);
                }}
                className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] font-mono"
              >
                A-
              </button>
              <span className="font-mono text-[var(--accent)] font-semibold w-9 text-center">
                {theme.typography.readerFontSize}
              </span>
              <button
                onClick={() => {
                  const curr = parseInt(theme.typography.readerFontSize, 10) || 18;
                  if (curr < 36) setTypography("readerFontSize", `${curr + 2}px`);
                }}
                className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] font-mono"
              >
                A+
              </button>
            </div>

            {/* Margins */}
            <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-4">
              <span className="text-[var(--text-secondary)]">Margin:</span>
              {(["20px", "36px", "56px"] as const).map((marginVal, idx) => (
                <button
                  key={marginVal}
                  onClick={() => setTypography("readerMargin", marginVal)}
                  className={`px-2.5 py-0.5 rounded border transition-colors ${
                    theme.typography.readerMargin === marginVal
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {idx === 0 ? "Narrow" : idx === 1 ? "Normal" : "Wide"}
                </button>
              ))}
            </div>

            {/* Font Family */}
            <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-4">
              <span className="text-[var(--text-secondary)]">Typeface:</span>
              <button
                onClick={() =>
                  setTypography(
                    "fontFamily",
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  )
                }
                className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
              >
                Sans
              </button>
              <button
                onClick={() =>
                  setTypography(
                    "fontFamily",
                    "Georgia, Cambria, 'Times New Roman', serif",
                  )
                }
                className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] font-serif"
              >
                Serif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bookmarks Drawer */}
      {showBookmarks && (
        <div className="absolute top-24 right-6 w-80 max-h-96 z-50 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 shadow-2xl">
          <div className="text-xs font-bold text-[var(--text-primary)] mb-2 px-2 pb-1 border-b border-[var(--border-color)] flex items-center justify-between">
            <span>Saved Bookmarks</span>
            <span className="text-[10px] text-[var(--text-muted)]">{bookmarks.length} saved</span>
          </div>
          <div className="space-y-1">
            {bookmarks.map((bm, index) => (
              <button
                key={index}
                onClick={() => {
                  if (renditionRef.current && bm.cfi) {
                    renditionRef.current.display(bm.cfi);
                    setShowBookmarks(false);
                  }
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-colors flex items-center justify-between"
              >
                <div className="truncate">
                  <div className="font-semibold text-[var(--text-primary)]">{bm.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {new Date(bm.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <BookmarkCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Companion Flyout Drawer: Dedicated Soundtracks & Next Reads */}
      {showAi && (
        <div className="absolute top-16 right-6 w-96 max-h-[580px] z-50 flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Bard's Companion</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                AI Matchmaker
              </span>
              <button
                onClick={() => setShowAi(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                title="Close Drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 my-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => {
                setAiTab("soundtrack");
                if (soundtracks.length === 0) handleFetchSoundtracks(soundtrackMood);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                aiTab === "soundtrack"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Soundtracks</span>
            </button>
            <button
              onClick={() => {
                setAiTab("nextRead");
                if (nextReads.length === 0) handleFetchNextReads(formatFilter);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                aiTab === "nextRead"
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Next Reads</span>
            </button>
          </div>

          {/* TAB 1: SOUNDTRACK MATCHMAKER */}
          {aiTab === "soundtrack" && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Mood Quick Chips */}
              <div className="flex gap-1 overflow-x-auto pb-1 select-none">
                {READING_MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSoundtrackMood(m.id);
                      handleFetchSoundtracks(m.id);
                    }}
                    className={`text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg border transition-all ${
                      soundtrackMood === m.id
                        ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Custom Vibe Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Custom mood (e.g. rain & violin, cyberpunk)..."
                  value={customSoundtrackVibe}
                  onChange={(e) => setCustomSoundtrackVibe(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchSoundtracks(soundtrackMood, customSoundtrackVibe)}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={() => handleFetchSoundtracks(soundtrackMood, customSoundtrackVibe)}
                  disabled={isGeneratingSoundtracks}
                  className="p-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 transition-colors shadow-sm"
                  title="Generate book-matched soundtrack"
                >
                  {isGeneratingSoundtracks ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Soundtrack Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-72">
                {isGeneratingSoundtracks ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                    <span className="text-xs">Composing book soundtrack...</span>
                  </div>
                ) : soundtracks.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                    No soundtracks generated yet. Click a mood above to start.
                  </div>
                ) : (
                  soundtracks.map((track, idx) => {
                    const isNowPlaying = currentTrack?.title === track.title;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                              {track.title}
                            </h4>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {track.artist} • <span className="text-[var(--accent)]">{track.mood}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handlePlayRecommendedTrack(track)}
                            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all shadow-sm active:scale-95 ${
                              isNowPlaying
                                ? "bg-emerald-500 text-white"
                                : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                            }`}
                            title="Play in Audio Dock"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="text-[10px]">{isNowPlaying ? "Playing" : "Play"}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] italic leading-tight">
                          "{track.rationale}"
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NEXT-READ MATCHMAKER */}
          {aiTab === "nextRead" && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Format Filter Chips */}
              <div className="flex gap-1 overflow-x-auto pb-1 select-none">
                {(["All", "Manga", "Light Novel", "Manhwa", "Biography", "Novel"] as ReadingFormat[]).map(
                  (fmt) => (
                    <button
                      key={fmt}
                      onClick={() => {
                        setFormatFilter(fmt);
                        handleFetchNextReads(fmt);
                      }}
                      className={`text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg border transition-all ${
                        formatFilter === fmt
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]"
                      }`}
                    >
                      {fmt}
                    </button>
                  ),
                )}
              </div>

              {/* Custom Vibe Input */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Themes (e.g. dark fantasy, revenge, cozy merchant)..."
                  value={customNextReadVibe}
                  onChange={(e) => setCustomNextReadVibe(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchNextReads(formatFilter, customNextReadVibe)}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
                <button
                  onClick={() => handleFetchNextReads(formatFilter, customNextReadVibe)}
                  disabled={isGeneratingNextReads}
                  className="p-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-50 transition-colors shadow-sm"
                  title="Find tailored next reads"
                >
                  {isGeneratingNextReads ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Next Read Cards List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-72">
                {isGeneratingNextReads ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                    <span className="text-xs">Finding kindred literature...</span>
                  </div>
                ) : nextReads.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                    No recommendations found. Try selecting another format above.
                  </div>
                ) : (
                  nextReads.map((rec, idx) => {
                    const badgeStyles: Record<string, string> = {
                      Manga: "bg-pink-950/80 text-pink-300 border-pink-500/40",
                      "Light Novel": "bg-purple-950/80 text-purple-300 border-purple-500/40",
                      Manhwa: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
                      Biography: "bg-amber-950/80 text-amber-300 border-amber-500/40",
                      Novel: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
                    };

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                  badgeStyles[rec.category] || "bg-zinc-800 text-zinc-300 border-zinc-700"
                                }`}
                              >
                                {rec.category}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] truncate">
                                {rec.vibe}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                              {rec.title}
                            </h4>
                            <p className="text-[10px] text-[var(--text-muted)]">By {rec.author}</p>
                          </div>
                          <button
                            onClick={() => handleSearchNextReadInCatalog(rec)}
                            className="px-2.5 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-medium flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="Find in Online Catalog"
                          >
                            <Library className="w-3 h-3" />
                            <span>Catalog</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                          {rec.whyRecommend}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Highlights & Notes Flyout Drawer */}
      {showHighlights && (
        <div className="absolute top-16 right-6 w-96 max-h-[520px] z-50 flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Highlighter className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Highlights & Notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                {highlights.length} saved
              </span>
              <button
                onClick={() => setShowHighlights(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Close Drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 py-3 max-h-80 text-xs">
            {highlights.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No highlights yet.</p>
                <p className="text-[10px] mt-1">Select text in the reader to highlight with color and add notes.</p>
              </div>
            ) : (
              highlights.map((hl) => (
                <div
                  key={hl.id}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2 group"
                >
                  <div
                    onClick={() => handleJumpToHighlight(hl.cfiRange)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          HIGHLIGHT_COLORS[hl.color]?.bgClass || "bg-amber-400"
                        }`}
                      />
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {new Date(hl.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="italic text-[var(--text-primary)] line-clamp-3">
                      "{hl.text}"
                    </p>
                  </div>

                  {/* Note input / display */}
                  <div className="pt-1.5 border-t border-[var(--border-color)] flex items-center gap-1.5">
                    <input
                      type="text"
                      defaultValue={hl.note || ""}
                      placeholder="Add personal note..."
                      onBlur={(e) => handleUpdateHighlightNote(hl, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={() => handleDeleteHighlight(hl.id, hl.cfiRange)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Delete highlight"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Reading Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0 overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
              <span className="text-xs text-[var(--text-secondary)]">Parsing EPUB chapters...</span>
            </div>
          </div>
        )}

        {/* Previous page button */}
        {isBookLoaded && (
          <button
            onClick={handlePrevPage}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[var(--bg-secondary)]/80 hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xl transition-all active:scale-95"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* epub.js target viewport */}
        <div
          ref={viewerRef}
          className={`w-full max-w-4xl h-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden transition-all ${
            !isBookLoaded ? "hidden" : "block"
          }`}
        />

        {/* Fallback / Reader Preview Canvas when no external file is loaded */}
        {!isBookLoaded && !isLoading && (
          <div
            className="w-full max-w-3xl min-h-[520px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 shadow-2xl flex flex-col justify-between overflow-y-auto"
            style={{
              fontFamily: "var(--font-family)",
              fontSize: "var(--reader-font-size)",
              lineHeight: "var(--reader-line-height)",
              padding: "var(--reader-margin)",
              color: "var(--text-primary)",
            }}
          >
            <div>
              <div className="text-center mb-6 pb-4 border-b border-[var(--border-color)]">
                <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold">
                  Reading Canvas
                </span>
                <h2 className="text-2xl font-bold tracking-tight mt-1">{currentBookName}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Ready for reading • Open a book or import an EPUB
                </p>
              </div>

              <div className="space-y-4 text-justify">
                <p className="indent-6">
                  "Along the shore the cloud waves break,
                  The twin suns sink behind the lake,
                  The shadows lengthen
                  In Carcosa.
                </p>
                <p className="indent-6">
                  Strange is the night where black stars rise,
                  And strange moons circle through the skies,
                  But stranger still is
                  Lost Carcosa."
                </p>
                <p className="indent-6">
                  Song of Cassilda in "The King in Yellow," Act i, Scene 2.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium cursor-pointer transition-all shadow-md active:scale-95">
                <FolderOpen className="w-4 h-4" />
                <span>Open EPUB from Computer</span>
                <input
                  type="file"
                  accept=".epub"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Synchronized ambient audio</span>
              </div>
            </div>
          </div>
        )}

        {/* Next page button */}
        {isBookLoaded && (
          <button
            onClick={handleNextPage}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-[var(--bg-secondary)]/80 hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xl transition-all active:scale-95"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Floating Quick Highlighter & Lookup for Selected Text */}
        {selectedText && (
          <div className="absolute bottom-6 z-40 flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-color)] px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
            {/* Color buttons for highlights */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-[var(--border-color)]">
              <button
                onClick={() => handleAddHighlight("yellow")}
                className="w-5 h-5 rounded-full bg-amber-400 hover:scale-110 active:scale-95 border border-amber-500/40 shadow-sm transition-all"
                title="Highlight Yellow"
              />
              <button
                onClick={() => handleAddHighlight("green")}
                className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-110 active:scale-95 border border-emerald-500/40 shadow-sm transition-all"
                title="Highlight Mint"
              />
              <button
                onClick={() => handleAddHighlight("purple")}
                className="w-5 h-5 rounded-full bg-purple-400 hover:scale-110 active:scale-95 border border-purple-500/40 shadow-sm transition-all"
                title="Highlight Violet"
              />
            </div>

            <span className="text-xs text-[var(--text-primary)] max-w-[180px] sm:max-w-xs truncate italic">
              "{selectedText}"
            </span>

            <button
              onClick={() => {
                setShowAi(true);
                setShowHighlights(false);
                setAiTab("soundtrack");
                setCustomSoundtrackVibe(selectedText.slice(0, 100));
                handleFetchSoundtracks(soundtrackMood, selectedText.slice(0, 100));
                setSelectedText("");
                setSelectedCfiRange("");
              }}
              className="px-2.5 py-1 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium shadow-sm transition-all active:scale-95 ml-1 flex items-center gap-1"
            >
              <Music className="w-3 h-3" />
              <span>Match Music</span>
            </button>
            <button
              onClick={() => {
                setSelectedText("");
                setSelectedCfiRange("");
              }}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
