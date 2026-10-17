// YouTube Music & Ambient Streaming Service for Bard's Library
// Supports global catalog search, direct YouTube URL/ID extraction, and curated literary playlists

export interface YouTubeTrack {
  id: string; // YouTube Video ID
  title: string;
  channel: string;
  thumbnail: string;
  category?: string;
}

export const CURATED_YOUTUBE_TRACKS: YouTubeTrack[] = [
  // Smooth English & Instrumental Soundtracks
  {
    id: "UDVtMYqUAyw",
    title: "Hans Zimmer - Interstellar Main Theme (Piano & Strings)",
    channel: "Hans Zimmer",
    thumbnail: "https://i.ytimg.com/vi/UDVtMYqUAyw/hqdefault.jpg",
    category: "soundtrack",
  },
  {
    id: "q8ir8hCTnwg",
    title: "Concerning Hobbits - Lord of the Rings (Acoustic)",
    channel: "Howard Shore",
    thumbnail: "https://i.ytimg.com/vi/q8ir8hCTnwg/hqdefault.jpg",
    category: "soundtrack",
  },
  {
    id: "kcihcYEOeic",
    title: "Ludovico Einaudi - Nuvole Bianche (Smooth Piano)",
    channel: "Ludovico Einaudi",
    thumbnail: "https://i.ytimg.com/vi/kcihcYEOeic/hqdefault.jpg",
    category: "soundtrack",
  },
  {
    id: "0N3HlJ502vI",
    title: "Sleeping At Last - Turning Page (Smooth Instrumental)",
    channel: "Sleeping At Last",
    thumbnail: "https://i.ytimg.com/vi/0N3HlJ502vI/hqdefault.jpg",
    category: "soundtrack",
  },
  {
    id: "7maJOI3QMu0",
    title: "Yiruma - River Flows in You (Smooth Piano)",
    channel: "Yiruma",
    thumbnail: "https://i.ytimg.com/vi/7maJOI3QMu0/hqdefault.jpg",
    category: "soundtrack",
  },
  // Classical & Piano
  {
    id: "-gDinVAmtA0",
    title: "Chopin - Nocturnes Complete Collection (Classical Piano)",
    channel: "HALIDONMUSIC",
    thumbnail: "https://i.ytimg.com/vi/-gDinVAmtA0/hqdefault.jpg",
    category: "classical",
  },
  {
    id: "mIYzp5maCgI",
    title: "Classical Music for Reading & Deep Study (Mozart, Beethoven, Bach)",
    channel: "HALIDONMUSIC",
    thumbnail: "https://i.ytimg.com/vi/mIYzp5maCgI/hqdefault.jpg",
    category: "classical",
  },
  // Anime & Manga OSTs
  {
    id: "GNWnz_W5y1U",
    title: "Studio Ghibli Relaxing Piano Collection (Spirited Away, Howl's Castle)",
    channel: "Knops Piano",
    thumbnail: "https://i.ytimg.com/vi/GNWnz_W5y1U/hqdefault.jpg",
    category: "anime",
  },
  {
    id: "2DVpys53F88",
    title: "Zelda & Chill - Relaxing Lofi Remixes",
    channel: "GameChops",
    thumbnail: "https://i.ytimg.com/vi/2DVpys53F88/hqdefault.jpg",
    category: "anime",
  },
  // Fantasy & Adventure
  {
    id: "8ZhnJkcTU-k",
    title: "Medieval Tavern Fireplace & Celtic Fantasy Ambience",
    channel: "The Vault of Ambience",
    thumbnail: "https://i.ytimg.com/vi/8ZhnJkcTU-k/hqdefault.jpg",
    category: "fantasy",
  },
  {
    id: "qJp_r1r8uA4",
    title: "Skyrim - The Streets of Whiterun & Night Ambience (Atmospheric)",
    channel: "Bethesda Ambient",
    thumbnail: "https://i.ytimg.com/vi/qJp_r1r8uA4/hqdefault.jpg",
    category: "fantasy",
  },
  // Deep Focus & Ambience
  {
    id: "mPZkdNFkNps",
    title: "Heavy Rain & Thunder at Night (Cozy Bedroom Ambience)",
    channel: "Relaxing White Noise",
    thumbnail: "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg",
    category: "ambient",
  },
  {
    id: "5yx6BWlEVcY",
    title: "Warm Cozy Coffee Shop Ambience & Smooth Bossa Jazz",
    channel: "Calm Cafe",
    thumbnail: "https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg",
    category: "ambient",
  },
];

// Helper to extract 11-char YouTube video ID from any link or raw input
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/))([a-zA-Z0-9_-]{11})/i,
  );
  return match ? match[1] : null;
}

// Fetch video metadata directly via noembed (zero API key needed)
export async function getTrackFromDirectId(videoId: string): Promise<YouTubeTrack> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          id: videoId,
          title: data.title,
          channel: data.author_name || "YouTube",
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      }
    }
  } catch (e) {
    console.warn("Direct metadata fetch failed, using fallback", e);
  }

  return {
    id: videoId,
    title: `YouTube Audio (${videoId})`,
    channel: "Direct Link",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export async function searchYouTube(query: string): Promise<YouTubeTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return CURATED_YOUTUBE_TRACKS;

  // 1. Check if user pasted a direct YouTube link or video ID
  const directId = extractYouTubeVideoId(trimmed);
  if (directId) {
    const directTrack = await getTrackFromDirectId(directId);
    return [directTrack, ...CURATED_YOUTUBE_TRACKS.filter((t) => t.id !== directId)];
  }

  // 2. Query YouTube Data API v3
  const apiKey =
    localStorage.getItem("bards_youtube_api_key") ||
    import.meta.env.VITE_YOUTUBE_API_KEY ||
    "";

  if (!apiKey) {
    return CURATED_YOUTUBE_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(trimmed.toLowerCase()) ||
      t.channel.toLowerCase().includes(trimmed.toLowerCase()) ||
      t.category?.toLowerCase().includes(trimmed.toLowerCase())
    );
  }

  const cleanQuery = encodeURIComponent(trimmed);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${cleanQuery}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `YouTube API HTTP ${res.status}`);
    }
    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) {
      return CURATED_YOUTUBE_TRACKS;
    }

    // Decode HTML entities in YouTube titles
    const decodeHtml = (html: string) => {
      const txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    };

    return data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: decodeHtml(item.snippet.title || "Untitled"),
        channel: decodeHtml(item.snippet.channelTitle || "YouTube Music"),
        thumbnail:
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      }));
  } catch (err) {
    console.warn("YouTube search error:", err);
    return CURATED_YOUTUBE_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(trimmed.toLowerCase()) ||
      t.channel.toLowerCase().includes(trimmed.toLowerCase())
    );
  }
}
