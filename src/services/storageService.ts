import { invoke } from "@tauri-apps/api/core";

export interface ReadingProgress {
  bookId: string;
  cfi: string;
  progressPct: number;
  updatedAt?: number;
}

const isTauri = () => {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
};

export async function saveReadingState(
  bookId: string,
  cfi: string,
  progressPct: number,
): Promise<void> {
  if (isTauri()) {
    try {
      await invoke("save_reading_state", {
        bookId,
        cfi,
        progressPct,
      });
      return;
    } catch (err) {
      console.warn("Tauri invoke save_reading_state error, falling back to localStorage", err);
    }
  }

  // LocalStorage fallback for dev/browser mode
  try {
    const data: ReadingProgress = {
      bookId,
      cfi,
      progressPct,
      updatedAt: Date.now(),
    };
    localStorage.setItem(`bards_reading_state_${bookId}`, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save reading state to localStorage", err);
  }
}

export async function getReadingState(bookId: string): Promise<ReadingProgress | null> {
  if (isTauri()) {
    try {
      const state = await invoke<any>("get_reading_state", { bookId });
      if (state) {
        return {
          bookId: state.book_id,
          cfi: state.cfi,
          progressPct: state.progress_pct,
          updatedAt: state.updated_at,
        };
      }
    } catch (err) {
      console.warn("Tauri invoke get_reading_state error, falling back to localStorage", err);
    }
  }

  // LocalStorage fallback
  try {
    const stored = localStorage.getItem(`bards_reading_state_${bookId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load reading state from localStorage", err);
  }

  return null;
}
