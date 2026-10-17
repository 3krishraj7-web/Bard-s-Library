// Native IndexedDB storage for offline e-books, highlights, annotations, and reading analytics
// No external dependencies, stores large EPUB blobs safely offline

export interface StoredBook {
  id: string;
  title: string;
  author: string;
  format: "EPUB" | "PDF";
  coverColor: string;
  ambientTheme: string;
  isOfflineAvailable: boolean;
  downloadUrl?: string;
  epubBlob?: Blob;
  lastReadProgress?: number;
  lastReadCfi?: string;
  addedAt: number;
}

export interface HighlightItem {
  id: string;
  bookId: string;
  cfiRange: string;
  text: string;
  color: "yellow" | "green" | "purple";
  note?: string;
  createdAt: number;
}

export interface ReadingStats {
  id?: string;
  totalSecondsRead: number;
  dailyLog: Record<string, number>; // "YYYY-MM-DD" -> seconds
  streakDays: number;
  lastReadDate: string; // "YYYY-MM-DD"
}

const DB_NAME = "bards_library_db";
const STORE_BOOKS = "books";
const STORE_HIGHLIGHTS = "highlights";
const STORE_STATS = "stats";
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_HIGHLIGHTS)) {
        const hlStore = db.createObjectStore(STORE_HIGHLIGHTS, { keyPath: "id" });
        hlStore.createIndex("bookId", "bookId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_STATS)) {
        db.createObjectStore(STORE_STATS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------- Book Storage ----------------

export async function saveBookToOfflineDb(book: StoredBook): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.put(book);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getBookFromOfflineDb(id: string): Promise<StoredBook | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readonly");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOfflineBooks(): Promise<StoredBook[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readonly");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBookFromOfflineDb(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readwrite");
    const store = tx.objectStore(STORE_BOOKS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Highlights & Notes Storage ----------------

export async function saveHighlight(highlight: HighlightItem): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HIGHLIGHTS, "readwrite");
    const store = tx.objectStore(STORE_HIGHLIGHTS);
    const req = store.put(highlight);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getHighlightsByBook(bookId: string): Promise<HighlightItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HIGHLIGHTS, "readonly");
    const store = tx.objectStore(STORE_HIGHLIGHTS);
    const index = store.index("bookId");
    const req = index.getAll(bookId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteHighlight(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HIGHLIGHTS, "readwrite");
    const store = tx.objectStore(STORE_HIGHLIGHTS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------------- Reading Analytics & Streaks ----------------

export async function getReadingStats(): Promise<ReadingStats> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_STATS, "readonly");
    const store = tx.objectStore(STORE_STATS);
    const req = store.get("main_stats");
    req.onsuccess = () => {
      resolve(
        req.result || {
          id: "main_stats",
          totalSecondsRead: 0,
          dailyLog: {},
          streakDays: 0,
          lastReadDate: "",
        },
      );
    };
    req.onerror = () => {
      resolve({
        id: "main_stats",
        totalSecondsRead: 0,
        dailyLog: {},
        streakDays: 0,
        lastReadDate: "",
      });
    };
  });
}

export async function recordReadingTime(seconds: number): Promise<ReadingStats> {
  const current = await getReadingStats();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const updatedSeconds = current.totalSecondsRead + seconds;
  const updatedDaily = {
    ...current.dailyLog,
    [today]: (current.dailyLog[today] || 0) + seconds,
  };

  let updatedStreak = current.streakDays;
  if (current.lastReadDate !== today) {
    if (current.lastReadDate === yesterday) {
      updatedStreak += 1;
    } else if (current.lastReadDate === "") {
      updatedStreak = 1;
    } else {
      updatedStreak = 1;
    }
  }

  const updatedStats: ReadingStats = {
    id: "main_stats",
    totalSecondsRead: updatedSeconds,
    dailyLog: updatedDaily,
    streakDays: Math.max(1, updatedStreak),
    lastReadDate: today,
  };

  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_STATS, "readwrite");
    const store = tx.objectStore(STORE_STATS);
    const req = store.put(updatedStats);
    req.onsuccess = () => resolve(updatedStats);
    req.onerror = () => resolve(updatedStats);
  });
}
