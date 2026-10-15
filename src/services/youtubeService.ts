// YouTube Data API v3 Client for Bard's Library Unified Music Player
// Supports search for all songs, artists, soundtracks, and live ambient streams

export interface YouTubeTrack {
  id: string; // YouTube Video ID
  title: string;
  channel: string;
  thumbnail: string;
}

export const CURATED_YOUTUBE_TRACKS: YouTubeTrack[] = [
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio 📚 - beats to relax/study to",
    channel: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
  },
  {
    id: "-gDinVAmtA0",
    title: "Chopin - Nocturnes Complete Collection (Classical Piano)",
    channel: "HALIDONMUSIC",
    thumbnail: "https://i.ytimg.com/vi/-gDinVAmtA0/hqdefault.jpg",
  },
  {
    id: "4xDzrJKXOOY",
    title: "synthwave radio 🌌 - chill synth / retro beats to study to",
    channel: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg",
  },
  {
    id: "mPZkdNFkNps",
    title: "Heavy Rain & Thunder at Night (Cozy Bedroom Ambience)",
    channel: "Relaxing White Noise",
    thumbnail: "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg",
  },
  {
    id: "5yx6BWlEVcY",
    title: "Warm Cozy Coffee Shop Ambience & Smooth Bossa Jazz",
    channel: "Calm Cafe",
    thumbnail: "https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg",
  },
  {
    id: "8ZhnJkcTU-k",
    title: "Medieval Tavern Fireplace & Celtic Fantasy Ambience",
    channel: "The Vault of Ambience",
    thumbnail: "https://i.ytimg.com/vi/8ZhnJkcTU-k/hqdefault.jpg",
  },
];

export async function searchYouTube(query: string): Promise<YouTubeTrack[]> {
  if (!query.trim()) return CURATED_YOUTUBE_TRACKS;

  const apiKey =
    localStorage.getItem("bards_youtube_api_key") ||
    import.meta.env.VITE_YOUTUBE_API_KEY ||
    "";

  if (!apiKey) {
    console.warn("No YouTube API key provided. Returning curated library.");
    return CURATED_YOUTUBE_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()),
    );
  }

  const cleanQuery = encodeURIComponent(query.trim());
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${cleanQuery}&key=${apiKey}`;

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

    // Decode HTML entities in YouTube titles (e.g. &amp;, &#39;)
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
    // Filter curated tracks if search fails
    return CURATED_YOUTUBE_TRACKS.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase()),
    );
  }
}
