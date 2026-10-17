// Multi-Source Online Book & Novel Discovery Service for Bard's Library
// Integrates Project Gutenberg (70,000+ open-access titles) and Open Library (millions of modern manga,
// light novels, manhwas, biographies, and classics) plus curated modern serial spotlights.

import { StoredBook, saveBookToOfflineDb } from "./offlineDb";

export interface OnlineBookResult {
  id: string;
  title: string;
  authors: string[];
  subjects: string[];
  coverUrl: string | null;
  epubUrl: string | null;
  downloadCount: number;
  source: "gutenberg" | "openlibrary" | "curated";
  firstPublishYear?: number;
  isModernCopyrighted?: boolean;
  category?: string;
  externalUrl?: string;
}

export const POPULAR_ONLINE_GENRES = [
  { id: "all", label: "All Literature", query: "" },
  { id: "manga", label: "Manga & Comics", query: "comic graphic manga" },
  { id: "lightnovel", label: "Light Novels", query: "fantasy light novel" },
  { id: "manhwa", label: "Manhwa & Asian Fiction", query: "webtoon manhwa korean" },
  { id: "biography", label: "Biographies & Memoirs", query: "biography autobiography memoir" },
  { id: "novel", label: "Novels & Classics", query: "fiction novel" },
  { id: "fantasy", label: "Fantasy & Adventure", query: "fantasy adventure" },
  { id: "scifi", label: "Sci-Fi & Cyberpunk", query: "science fiction" },
  { id: "mystery", label: "Mystery & Detective", query: "mystery detective" },
  { id: "philosophy", label: "Philosophy & Mind", query: "philosophy essays" },
  { id: "gothic", label: "Gothic & Horror", query: "horror gothic supernatural" },
];

// Curated modern web novels, manga, manhwas, and light novels
export const CURATED_MODERN_COLLECTIONS: OnlineBookResult[] = [
  {
    id: "curated-tbate",
    title: "The Beginning After the End",
    authors: ["TurtleMe", "Fuyuki23"],
    subjects: ["Fantasy", "Reincarnation", "Magic", "Action", "Web Novel"],
    coverUrl: "https://covers.openlibrary.org/b/id/14815307-M.jpg",
    epubUrl: null,
    downloadCount: 850000,
    source: "curated",
    firstPublishYear: 2017,
    isModernCopyrighted: true,
    category: "Manga & Webtoon",
    externalUrl: "https://openlibrary.org/works/OL29238020W/The_Beginning_After_The_End",
  },
  {
    id: "curated-solo-leveling",
    title: "Solo Leveling (Only I Level Up)",
    authors: ["Chugong", "DUBU (REDICE Studio)"],
    subjects: ["Action", "Hunters", "Dungeons", "Fantasy", "Manhwa"],
    coverUrl: "https://covers.openlibrary.org/b/id/10547119-M.jpg",
    epubUrl: null,
    downloadCount: 1200000,
    source: "curated",
    firstPublishYear: 2016,
    isModernCopyrighted: true,
    category: "Manhwa & Asian Fiction",
    externalUrl: "https://openlibrary.org/works/OL20875084W/Solo_Leveling",
  },
  {
    id: "curated-orv",
    title: "Omniscient Reader's Viewpoint",
    authors: ["Sing Shong", "Sleepy-C"],
    subjects: ["Apocalypse", "Meta-Fiction", "Action", "Supernatural", "Webtoon"],
    coverUrl: "https://covers.openlibrary.org/b/id/12845601-M.jpg",
    epubUrl: null,
    downloadCount: 920000,
    source: "curated",
    firstPublishYear: 2018,
    isModernCopyrighted: true,
    category: "Manhwa & Asian Fiction",
    externalUrl: "https://openlibrary.org/works/OL27926189W/Omniscient_Reader's_Viewpoint",
  },
  {
    id: "curated-tower-of-god",
    title: "Tower of God",
    authors: ["SIU"],
    subjects: ["Tower Climber", "High Fantasy", "Mystery", "Webtoon"],
    coverUrl: "https://covers.openlibrary.org/b/id/12836248-M.jpg",
    epubUrl: null,
    downloadCount: 750000,
    source: "curated",
    firstPublishYear: 2010,
    isModernCopyrighted: true,
    category: "Manga & Webtoon",
    externalUrl: "https://openlibrary.org/works/OL24523091W/Tower_of_God",
  },
  {
    id: "curated-berserk",
    title: "Berserk",
    authors: ["Kentaro Miura"],
    subjects: ["Dark Fantasy", "Medieval", "Supernatural", "Tragedy", "Manga"],
    coverUrl: "https://covers.openlibrary.org/b/id/8750042-M.jpg",
    epubUrl: null,
    downloadCount: 1500000,
    source: "curated",
    firstPublishYear: 1989,
    isModernCopyrighted: true,
    category: "Manga & Comics",
    externalUrl: "https://openlibrary.org/works/OL8582298W/Berserk",
  },
  {
    id: "curated-bookworm",
    title: "Ascendance of a Bookworm",
    authors: ["Miya Kazuki", "You Shiina"],
    subjects: ["Isekai", "Book Lover", "Printing Press", "Slice of Life", "Light Novel"],
    coverUrl: "https://covers.openlibrary.org/b/id/10294132-M.jpg",
    epubUrl: null,
    downloadCount: 420000,
    source: "curated",
    firstPublishYear: 2013,
    isModernCopyrighted: true,
    category: "Light Novels",
    externalUrl: "https://openlibrary.org/works/OL20638521W/Ascendance_of_a_Bookworm",
  },
  {
    id: "curated-overlord",
    title: "Overlord",
    authors: ["Kugane Maruyama", "so-bin"],
    subjects: ["Dark Fantasy", "Game World", "Strategy", "Kingdom Building", "Light Novel"],
    coverUrl: "https://covers.openlibrary.org/b/id/8372658-M.jpg",
    epubUrl: null,
    downloadCount: 610000,
    source: "curated",
    firstPublishYear: 2012,
    isModernCopyrighted: true,
    category: "Light Novels",
    externalUrl: "https://openlibrary.org/works/OL17812850W/Overlord",
  },
  {
    id: "curated-cote",
    title: "Classroom of the Elite",
    authors: ["Shogo Kinugasa", "Shunsaku Tomose"],
    subjects: ["Psychological", "School", "Mind Games", "Thriller", "Light Novel"],
    coverUrl: "https://covers.openlibrary.org/b/id/10328229-M.jpg",
    epubUrl: null,
    downloadCount: 540000,
    source: "curated",
    firstPublishYear: 2015,
    isModernCopyrighted: true,
    category: "Light Novels",
    externalUrl: "https://openlibrary.org/works/OL27245802W/Classroom_of_the_Elite",
  },
];

// Search Gutendex (Project Gutenberg) for free public domain EPUBs
async function searchGutendex(query: string): Promise<OnlineBookResult[]> {
  const clean = query.trim();
  if (!clean) return [];
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(clean)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.slice(0, 15).map((item: any) => {
      const formats = item.formats || {};
      const epub =
        formats["application/epub+zip"] ||
        formats["application/x-mobipocket-ebook"] ||
        null;
      const cover = formats["image/jpeg"] || null;
      const authors = (item.authors || []).map((a: any) =>
        a.name ? a.name.split(",").reverse().join(" ").trim() : "Unknown",
      );

      return {
        id: `gutenberg-${item.id}`,
        title: (item.title || "Untitled").replace(/\s*:\s*\$b.*$/i, "").trim(),
        authors: authors.length > 0 ? authors : ["Unknown Author"],
        subjects: item.subjects || [],
        coverUrl: cover,
        epubUrl: epub,
        downloadCount: item.download_count || 0,
        source: "gutenberg" as const,
        isModernCopyrighted: false,
        category: "Classics & Literature",
      };
    });
  } catch {
    return [];
  }
}

// Search Open Library for millions of modern novels, manga, manhwas, and biographies
async function searchOpenLibrary(query: string): Promise<OnlineBookResult[]> {
  const clean = query.trim();
  if (!clean) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(clean)}&limit=15`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    return data.docs.map((doc: any) => {
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : null;
      const title = doc.title || "Untitled";
      const authors = doc.author_name || ["Unknown Author"];
      const subjects = doc.subject ? doc.subject.slice(0, 4) : [];
      const firstPublishYear = doc.first_publish_year || undefined;
      const workKey = doc.key ? `https://openlibrary.org${doc.key}` : undefined;

      // Classify category based on title, subject, or query
      const lowerTitle = title.toLowerCase();
      let category = "Novels & Fiction";
      if (lowerTitle.includes("comic") || lowerTitle.includes("manga") || lowerTitle.includes("webtoon")) {
        category = "Manga & Comics";
      } else if (lowerTitle.includes("light novel") || lowerTitle.includes("vol")) {
        category = "Light Novels";
      } else if (subjects.some((s: string) => s.toLowerCase().includes("biography"))) {
        category = "Biographies & Memoirs";
      }

      return {
        id: `ol-${doc.key?.replace(/[^a-zA-Z0-9_-]/g, "-") || Math.random().toString(36).substring(2, 9)}`,
        title,
        authors: Array.isArray(authors) ? authors.slice(0, 2) : [authors],
        subjects,
        coverUrl,
        epubUrl: null, // Open Library requires archive borrowing or local import for modern books
        downloadCount: doc.edition_count ? doc.edition_count * 100 : 0,
        source: "openlibrary" as const,
        firstPublishYear,
        isModernCopyrighted: true,
        category,
        externalUrl: workKey,
      };
    });
  } catch {
    return [];
  }
}

// Unified multi-source search
export async function searchOnlineBooks(query: string, genreFilter: string = ""): Promise<OnlineBookResult[]> {
  const clean = query.trim().toLowerCase();

  // 1. Instant match from curated modern collections
  const curatedMatches = CURATED_MODERN_COLLECTIONS.filter((book) => {
    if (!clean && !genreFilter) return true;
    const matchQuery = clean
      ? book.title.toLowerCase().includes(clean) ||
        book.authors.some((a) => a.toLowerCase().includes(clean)) ||
        book.subjects.some((s) => s.toLowerCase().includes(clean))
      : true;

    const matchGenre = genreFilter && genreFilter !== "all"
      ? book.category?.toLowerCase().includes(genreFilter.toLowerCase())
      : true;

    return matchQuery && matchGenre;
  });

  // If no user query and genre is 'all', return curated starter collection merged with default Gutenberg
  if (!clean && (!genreFilter || genreFilter === "all")) {
    const gutenbergDefaults = await searchGutendex("novel");
    return [...CURATED_MODERN_COLLECTIONS, ...gutenbergDefaults];
  }

  // 2. Parallel fetch from both Gutenberg and Open Library
  // Crucial: Use clean title directly so genre keywords don't break title search!
  const effectiveQuery = clean || genreFilter;
  const [gutenbergResults, openLibraryResults] = await Promise.all([
    searchGutendex(effectiveQuery),
    searchOpenLibrary(effectiveQuery),
  ]);

  // 3. Deduplicate and merge results prioritizing curated, then Gutenberg (free EPUBs), then Open Library
  const seenTitles = new Set<string>();
  const merged: OnlineBookResult[] = [];

  for (const book of [...curatedMatches, ...gutenbergResults, ...openLibraryResults]) {
    const key = `${book.title.toLowerCase().slice(0, 24)}|${book.authors[0]?.toLowerCase().slice(0, 10)}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      merged.push(book);
    }
  }

  return merged;
}

// Download EPUB from any web URL and save to offline IndexedDB
export async function downloadAndSaveOnlineBook(
  book: OnlineBookResult | { id: string; title: string; author: string; downloadUrl: string },
): Promise<StoredBook> {
  const title = "title" in book ? book.title : "Untitled";
  const author = "authors" in book ? book.authors.join(", ") : (book as any).author || "Unknown";
  const downloadUrl = "epubUrl" in book ? book.epubUrl : (book as any).downloadUrl;

  if (!downloadUrl) {
    throw new Error("No direct EPUB download link available. Please use the Direct Web EPUB Downloader with your mirror link.");
  }

  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to download book: HTTP ${res.status}`);
  const blob = await res.blob();

  const stored: StoredBook = {
    id: book.id,
    title,
    author,
    format: "EPUB",
    coverColor: "bg-slate-900 border-l-4 border-l-indigo-500/40",
    ambientTheme: "Enchanted Woods & Gentle Breeze",
    isOfflineAvailable: true,
    downloadUrl,
    epubBlob: blob,
    lastReadProgress: 0,
    addedAt: Date.now(),
  };

  await saveBookToOfflineDb(stored);
  return stored;
}
