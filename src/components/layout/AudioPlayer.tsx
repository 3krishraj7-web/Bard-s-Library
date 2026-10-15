import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Search,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAudio } from "../../context/AudioContext";

const YouTubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);
import {
  searchYouTube,
  YouTubeTrack,
  CURATED_YOUTUBE_TRACKS,
} from "../../services/youtubeService";

export const AudioPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    linkedBookTitle,
    playTrack,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  } = useAudio();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("Coldplay");
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>(CURATED_YOUTUBE_TRACKS);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearch = async (term?: string) => {
    const q = term !== undefined ? term : searchQuery;
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchYouTube(q);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (item: YouTubeTrack) => {
    playTrack(
      {
        id: `yt-${item.id}`,
        youtubeId: item.id,
        title: item.title,
        artist: item.channel,
        duration: 0,
        artwork: item.thumbnail,
        isLiveStream: item.title.toLowerCase().includes("radio") || item.title.toLowerCase().includes("live"),
        bookId: currentTrack?.bookId,
      },
      linkedBookTitle || undefined,
    );
    setShowModal(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="h-20 w-full flex-shrink-0 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] px-6 flex items-center justify-between select-none shadow-lg relative z-20">
        {/* 1. Left Section: Track Info & YouTube Thumbnail */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[240px]">
          {currentTrack?.artwork ? (
            <img
              src={currentTrack.artwork}
              alt=""
              className="w-12 h-12 rounded-lg object-cover border border-[var(--border-color)] shadow-md flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 shadow-inner">
              <YouTubeIcon className="w-6 h-6 text-red-500" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[var(--text-primary)] truncate flex items-center gap-1.5">
              <span className="truncate">{currentTrack?.title || "No track loaded"}</span>
              {currentTrack?.isLiveStream && (
                <span className="text-[9px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.2 rounded-full border border-red-500/30 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                  Live
                </span>
              )}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5">
              <span className="text-red-400 font-medium">YouTube</span>
              <span>•</span>
              <span className="truncate">{currentTrack?.artist || "YouTube Music"}</span>
            </div>
            {linkedBookTitle && (
              <div className="text-[10px] text-[var(--accent)] mt-0.5 truncate">
                Reading Context: {linkedBookTitle}
              </div>
            )}
          </div>
        </div>

        {/* 2. Center Section: Playback Controls & Progress Bar */}
        <div className="flex flex-col items-center justify-center max-w-lg w-2/4 px-4">
          <div className="flex items-center gap-4 mb-1.5">
            <button
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="Repeat"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar or Live Broadcast state */}
          {currentTrack?.isLiveStream ? (
            <div className="w-full flex items-center justify-center gap-2 py-1 text-[11px] font-mono text-red-400/90">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Broadcasting 24/7 Live Stream</span>
            </div>
          ) : (
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 flex items-center group cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 300}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="w-full h-1 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)] group-hover:h-1.5 transition-all"
                  style={{
                    background: `linear-gradient(to right, var(--accent) ${progressPercent}%, var(--bg-surface) ${progressPercent}%)`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-8">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        {/* 3. Right Section: Volume & YouTube Search Modal Button */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[210px]">
          <button
            onClick={() => {
              setShowModal(true);
              if (searchResults.length === 0) handleSearch();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
            title="Search all songs on YouTube"
          >
            <YouTubeIcon className="w-4 h-4" />
            <span>Search Songs</span>
          </button>

          <button
            onClick={toggleMute}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-1"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="w-20 flex items-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-[var(--bg-surface)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
              style={{
                background: `linear-gradient(to right, var(--accent) ${volume * 100}%, var(--bg-surface) ${volume * 100}%)`,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-7 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Unified YouTube Music & Ambient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <YouTubeIcon className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    YouTube Music & Audio Player
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Search and play any song, album, artist, or 24/7 ambient soundtrack in the world.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="py-3 space-y-2.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search any song, artist, album, or ambient vibe (e.g. Bohemian Rhapsody, Lofi Girl, Chopin)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
                </button>
              </div>

              {/* Quick Curated Reading Soundtracks */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  "Lofi Girl 24/7",
                  "Chopin Nocturnes",
                  "Interstellar Soundtrack",
                  "Coffee Shop Jazz",
                  "Heavy Rain & Thunder",
                  "Medieval Tavern Ambiance",
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSearchQuery(item);
                      handleSearch(item);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-red-500 hover:text-red-400 text-[var(--text-secondary)] transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Offline Fallback Synthesizer Option */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span>Offline Procedural Synthesizers (Works without internet)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { title: "Tavern Hearth & Soft Rain", label: "Rain" },
                  { title: "Campfire Hearth & Crackle", label: "Fireplace" },
                  { title: "Deep Space Binaural Drone", label: "Space Drone" },
                ].map((synth) => (
                  <button
                    key={synth.label}
                    onClick={() => {
                      playTrack({
                        id: `synth-${synth.label.toLowerCase()}`,
                        title: synth.title,
                        artist: "Bard's Procedural Synthesis",
                        duration: 360,
                      });
                      setShowModal(false);
                    }}
                    className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    {synth.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12 text-xs text-[var(--text-muted)] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  <span>Searching YouTube database...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                  No tracks found. Type a song title above and press Search.
                </div>
              ) : (
                searchResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <img
                        src={track.thumbnail}
                        alt=""
                        className="w-14 h-10 rounded-lg object-cover flex-shrink-0 border border-[var(--border-color)] group-hover:opacity-90 shadow-sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-red-400">
                          {track.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                          {track.channel}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrack(track);
                      }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <Play className="w-3 h-3 ml-0.5" />
                      <span>Play</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Powered by YouTube Data API v3 & YouTube IFrame Engine</span>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
