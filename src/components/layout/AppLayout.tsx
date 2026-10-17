import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AudioPlayer } from "./AudioPlayer";
import { Minimize2 } from "lucide-react";

export interface AppLayoutContext {
  isZenMode: boolean;
  toggleZenMode: () => void;
}

export const AppLayout: React.FC = () => {
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  const toggleZenMode = () => setIsZenMode((prev) => !prev);

  // Allow Escape key to exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      {/* Upper Section: Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!isZenMode && <Sidebar />}

        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-primary)]">
          <Outlet context={{ isZenMode, toggleZenMode } satisfies AppLayoutContext} />
        </main>
      </div>

      {/* Floating Zen exit trigger when in Zen mode */}
      {isZenMode && (
        <button
          onClick={toggleZenMode}
          className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-[var(--bg-surface)]/80 hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shadow-lg backdrop-blur-sm transition-all"
          title="Exit Zen Mode (Esc)"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      )}

      {/* Bottom Audio Player Bar */}
      {!isZenMode && <AudioPlayer />}
    </div>
  );
};
