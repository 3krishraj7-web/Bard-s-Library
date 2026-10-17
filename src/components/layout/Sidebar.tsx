import React from "react";
import { NavLink } from "react-router-dom";
import { Home, BookOpen, BookMarked, Settings, Music, Volume2, Sparkles } from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import { BardsLogo } from "../common/BardsLogo";

export const Sidebar: React.FC = () => {
  const { linkedBookTitle, isPlaying, playTrack } = useAudio();

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/library", label: "Library", icon: BookOpen },
    { to: "/reader", label: "Reader", icon: BookMarked },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] select-none">
      {/* App Branding */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[var(--border-color)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center shadow-md">
          <BardsLogo size={22} />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Bard's Library</h1>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">E-Reader & Audio</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[var(--accent)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Soundscapes */}
      <div className="p-3 space-y-1 border-t border-[var(--border-color)] mt-2">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
          <span>Soundscapes</span>
          <Sparkles className="w-3 h-3 text-[var(--accent)]" />
        </div>
        <button
          onClick={() =>
            playTrack({
              id: "yt-interstellar",
              youtubeId: "UDVtMYqUAyw",
              title: "Hans Zimmer - Interstellar Main Theme (Piano & Strings)",
              artist: "Hans Zimmer",
              duration: 0,
              artwork: "https://i.ytimg.com/vi/UDVtMYqUAyw/hqdefault.jpg",
              isLiveStream: false,
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <Music className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="truncate">Interstellar (Piano & Strings)</span>
        </button>
        <button
          onClick={() =>
            playTrack({
              id: "yt-hobbits",
              youtubeId: "q8ir8hCTnwg",
              title: "Concerning Hobbits - Lord of the Rings (Acoustic)",
              artist: "Howard Shore",
              duration: 0,
              artwork: "https://i.ytimg.com/vi/q8ir8hCTnwg/hqdefault.jpg",
              isLiveStream: false,
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <Music className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="truncate">Concerning Hobbits (Acoustic)</span>
        </button>
        <button
          onClick={() =>
            playTrack({
              id: "yt-nuvole",
              youtubeId: "kcihcYEOeic",
              title: "Ludovico Einaudi - Nuvole Bianche (Smooth Piano)",
              artist: "Ludovico Einaudi",
              duration: 0,
              artwork: "https://i.ytimg.com/vi/kcihcYEOeic/hqdefault.jpg",
              isLiveStream: false,
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <Music className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="truncate">Nuvole Bianche (Piano)</span>
        </button>
        <button
          onClick={() =>
            playTrack({
              id: "yt-chopin",
              youtubeId: "-gDinVAmtA0",
              title: "Chopin - Nocturnes Complete Collection",
              artist: "HALIDONMUSIC",
              duration: 0,
              artwork: "https://i.ytimg.com/vi/-gDinVAmtA0/hqdefault.jpg",
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <Music className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Chopin Classical Piano</span>
        </button>
        <button
          onClick={() =>
            playTrack({
              id: "yt-rain",
              youtubeId: "mPZkdNFkNps",
              title: "Heavy Rain & Thunder at Night",
              artist: "Relaxing White Noise",
              duration: 0,
              artwork: "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg",
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <Music className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Rain & Thunder</span>
        </button>
        <button
          onClick={() =>
            playTrack({
              id: "ambient-rain",
              title: "Tavern Hearth & Soft Rain",
              artist: "Procedural Synthesis",
              duration: 360,
            })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Built-in Synthesizer</span>
        </button>
      </div>

      {/* Context Badge (Bottom of Sidebar) */}
      <div className="mt-auto p-3 border-t border-[var(--border-color)]">
        <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            <Volume2 className="w-3 h-3 text-[var(--accent)]" />
            <span>Active Session</span>
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
            )}
          </div>
          <div className="text-xs font-medium text-[var(--text-primary)] truncate">
            {linkedBookTitle || "No book active"}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Audio synchronized</div>
        </div>
      </div>
    </aside>
  );
};
