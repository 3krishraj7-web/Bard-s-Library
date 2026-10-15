import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AudioPlayer } from "./AudioPlayer";

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Upper Section: Sidebar (Pane 1) + Main Content Area (Pane 2) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Pane 1: Left-hand Sidebar */}
        <Sidebar />

        {/* Pane 2: Large Main Content Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--bg-primary)]">
          <Outlet />
        </main>
      </div>

      {/* Pane 3: Persistent Fixed Bottom Audio Bar */}
      <AudioPlayer />
    </div>
  );
};
