import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { ambientEngine } from "../services/ambientAudioEngine";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  src?: string;
  youtubeId?: string; // YouTube Video ID
  bookId?: string; // context-aware linking
  artwork?: string;
  album?: string;
  isLiveStream?: boolean;
  genre?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  linkedBookTitle: string | null;
  playTrack: (track: Track, bookTitle?: string) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setLinkedBook: (bookTitle: string | null) => void;
}

const DEFAULT_TRACK: Track = {
  id: "yt-lofigirl",
  youtubeId: "jfKfPfyJRdk",
  title: "lofi hip hop radio - beats to relax/study to",
  artist: "Lofi Girl",
  duration: 0,
  artwork: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
  isLiveStream: true,
};

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(DEFAULT_TRACK);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trackDuration, setTrackDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [linkedBookTitle, setLinkedBookTitle] = useState<string | null>("The King in Yellow");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isYtReady, setIsYtReady] = useState<boolean>(false);

  const effectiveVolume = isMuted ? 0 : volume;

  // Initialize native Audio element for local/direct stream playback
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Initialize YouTube IFrame API
  useEffect(() => {
    const initYt = () => {
      if (window.YT && window.YT.Player) {
        if (!ytPlayerRef.current) {
          ytPlayerRef.current = new window.YT.Player("bards-yt-player-host", {
            height: "1",
            width: "1",
            videoId: "jfKfPfyJRdk",
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onReady: () => {
                setIsYtReady(true);
                ytPlayerRef.current?.setVolume(effectiveVolume * 100);
              },
              onStateChange: (event: any) => {
                if (event.data === 1) {
                  // PLAYING
                  setIsPlaying(true);
                } else if (event.data === 2) {
                  // PAUSED
                  setIsPlaying(false);
                }
              },
            },
          });
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initYt();
    } else {
      window.onYouTubeIframeAPIReady = initYt;
      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }
  }, []);

  // Unified audio control (YouTube + Audio Element + Web Audio Synthesizer)
  useEffect(() => {
    const audio = audioRef.current;
    const yt = ytPlayerRef.current;
    if (!currentTrack) return;

    if (isPlaying) {
      if (currentTrack.youtubeId) {
        // Stop other engines
        ambientEngine.stop();
        if (audio) audio.pause();

        // Play YouTube
        if (yt && isYtReady && typeof yt.playVideo === "function") {
          yt.setVolume(effectiveVolume * 100);
          yt.playVideo();
        }
      } else if (currentTrack.src) {
        // Stop YouTube & synth
        if (yt && typeof yt.pauseVideo === "function") yt.pauseVideo();
        ambientEngine.stop();

        if (audio) {
          if (audio.src !== currentTrack.src) audio.src = currentTrack.src;
          audio.volume = effectiveVolume;
          audio.play().catch((err) => console.warn("Audio play interrupted", err));
        }
      } else {
        // Synthesizer
        if (yt && typeof yt.pauseVideo === "function") yt.pauseVideo();
        if (audio) audio.pause();
        ambientEngine.playSoundscape(currentTrack.title, effectiveVolume);
      }
    } else {
      // Pause all
      if (yt && typeof yt.pauseVideo === "function") yt.pauseVideo();
      if (audio) audio.pause();
      ambientEngine.stop();
    }
  }, [isPlaying, currentTrack, effectiveVolume, isYtReady]);

  // Sync volume adjustments across all engines
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      ytPlayerRef.current.setVolume(effectiveVolume * 100);
    }
    ambientEngine.setVolume(effectiveVolume);
  }, [effectiveVolume]);

  // Track playback time and total duration
  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        if (currentTrack?.youtubeId && ytPlayerRef.current) {
          try {
            const curr = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (typeof curr === "number") setCurrentTime(Math.floor(curr));
            if (typeof dur === "number" && dur > 0) setTrackDuration(Math.floor(dur));
          } catch (e) {
            // ignore
          }
        } else if (audioRef.current && currentTrack?.src) {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
          if (audioRef.current.duration) {
            setTrackDuration(Math.floor(audioRef.current.duration));
          }
        } else {
          setCurrentTime((prev) => {
            const limit = currentTrack?.duration || 360;
            return prev >= limit ? 0 : prev + 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack]);

  const playTrack = (track: Track, bookTitle?: string) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setTrackDuration(track.duration || 0);

    if (track.youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
      ytPlayerRef.current.loadVideoById(track.youtubeId);
      ytPlayerRef.current.setVolume(effectiveVolume * 100);
      ytPlayerRef.current.playVideo();
    }

    if (bookTitle !== undefined) {
      setLinkedBookTitle(bookTitle);
    }
  };

  const togglePlay = () => {
    if (currentTrack?.youtubeId && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (currentTrack?.youtubeId && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === "function") {
      ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current && currentTrack?.src) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const setLinkedBook = (bookTitle: string | null) => {
    setLinkedBookTitle(bookTitle);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration: trackDuration || currentTrack?.duration || 300,
        volume: effectiveVolume,
        isMuted,
        linkedBookTitle,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        setLinkedBook,
      }}
    >
      {/* Hidden YouTube Player host container */}
      <div
        id="bards-yt-player-host"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "1px",
          height: "1px",
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: -9999,
        }}
      />
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
