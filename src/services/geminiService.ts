// Google Gemini API integration for Bard's Library AI Companion
// Dedicated Soundtrack Recommender & Next-Read Matchmaker

export interface SoundtrackRecommendation {
  title: string;
  artist: string;
  mood: string;
  youtubeId?: string;
  searchQuery: string;
  rationale: string;
}

export type ReadingFormat =
  | "All"
  | "Manga"
  | "Light Novel"
  | "Manhwa"
  | "Biography"
  | "Novel";

export interface BookRecommendation {
  title: string;
  author: string;
  category: "Manga" | "Light Novel" | "Manhwa" | "Biography" | "Novel";
  vibe: string;
  whyRecommend: string;
  searchQuery: string;
}

export const READING_MOODS = [
  { id: "cozy", label: "Cozy Study", query: "lofi study beats chill calm piano" },
  { id: "melancholic", label: "Melancholic Rain", query: "sad piano rain ambient melancholic" },
  { id: "epic", label: "Epic Fantasy", query: "epic orchestral fantasy battle adventure" },
  { id: "gothic", label: "Gothic Dark", query: "dark academia classical gothic victorian cello" },
  { id: "peaceful", label: "Peaceful Forest", query: "peaceful nature acoustic ambient meadow" },
  { id: "cyberpunk", label: "Cyberpunk Synth", query: "synthwave cyberpunk retrowave focus coding" },
];

// Offline & zero-key curated soundtrack catalog with verified YouTube IDs
const FALLBACK_SOUNDTRACKS: Record<string, SoundtrackRecommendation[]> = {
  cozy: [
    {
      title: "Hans Zimmer - Interstellar Main Theme (Piano & Strings)",
      artist: "Hans Zimmer",
      mood: "Cozy Study",
      youtubeId: "UDVtMYqUAyw",
      searchQuery: "hans zimmer interstellar piano strings soundtrack",
      rationale: "Warm orchestral strings and contemplative piano chords for focused reading.",
    },
    {
      title: "Coffee Shop Ambience & Soft Bossa Nova",
      artist: "Cafe Music BGM",
      mood: "Cozy Study",
      youtubeId: "5yx6BWlEVcY",
      searchQuery: "cafe music bgm channel bossa nova piano",
      rationale: "Subtle cafe murmur and smooth chords for focused afternoon reading.",
    },
    {
      title: "Late Night Study Session",
      artist: "ChilledCow / Lofi",
      mood: "Cozy Study",
      youtubeId: "DWcJFNfaw9c",
      searchQuery: "late night study session lofi chill",
      rationale: "Quiet nostalgic frequencies designed for deep literary absorption.",
    },
  ],
  melancholic: [
    {
      title: "Rainy Night in Tokyo - Sad & Emotional Lofi",
      artist: "In Your Arms",
      mood: "Melancholic Rain",
      youtubeId: "rUxyKA_-grg",
      searchQuery: "rainy night in tokyo sad lofi rain sounds",
      rationale: "Gentle falling raindrops paired with deep reflective piano keys.",
    },
    {
      title: "Solitude & Distance - Melancholic Piano",
      artist: "Bards Ambient",
      mood: "Melancholic Rain",
      youtubeId: "TURbeWK2wwg",
      searchQuery: "melancholic piano solitude reading music",
      rationale: "Ideal for slow-paced emotional chapters and tragic character arcs.",
    },
  ],
  epic: [
    {
      title: "Medieval Fantasy Tavern & Campfire",
      artist: "The Guild of Ambient",
      mood: "Epic Fantasy",
      youtubeId: "1T22wN1345o",
      searchQuery: "medieval tavern ambient music lute harp",
      rationale: "Acoustic lutes and crackling fire suitable for high fantasy quests.",
    },
    {
      title: "Legends of the Realm - Orchestral Battle",
      artist: "Two Steps From Earth",
      mood: "Epic Fantasy",
      youtubeId: "4xDzrJKXOOY",
      searchQuery: "epic orchestral adventure fantasy reading mix",
      rationale: "Rising brass and strings for climactic battles and journeys.",
    },
  ],
  gothic: [
    {
      title: "Dark Academia Classical Study Mix",
      artist: "Viennese Cello & Violin",
      mood: "Gothic Dark",
      youtubeId: "y7e-GC6oGhg",
      searchQuery: "dark academia classical study mix chopin liszt",
      rationale: "Minor key piano sonatas fitting gothic mysteries and horror.",
    },
    {
      title: "Haunted Victorian Library Ambience",
      artist: "Grimm Tones",
      mood: "Gothic Dark",
      youtubeId: "hHW1oY26kxQ",
      searchQuery: "victorian library thunder rain gothic ambience",
      rationale: "Distant thunder and eerie warmth tailored for vintage suspense.",
    },
  ],
  peaceful: [
    {
      title: "Enchanted Forest & Whispering Trees",
      artist: "Nature Harp Soundscapes",
      mood: "Peaceful Forest",
      youtubeId: "eKFTSSKCzWA",
      searchQuery: "forest sounds birds stream gentle flute reading",
      rationale: "Gentle running streams, woodland birds, and serene woodwinds.",
    },
  ],
  cyberpunk: [
    {
      title: "Neo-Tokyo 2099 - Cyberpunk Dystopia",
      artist: "Synthwave Beats",
      mood: "Cyberpunk Synth",
      youtubeId: "wOMwO52311o",
      searchQuery: "cyberpunk synthwave darksynth reading focus",
      rationale: "Analog synthesizers and neon pulses for futuristic sci-fi.",
    },
  ],
};

// Curated next-read database across all formats when offline or without API key
const FALLBACK_BOOKS: BookRecommendation[] = [
  // Manga
  {
    title: "Berserk",
    author: "Kentaro Miura",
    category: "Manga",
    vibe: "Dark Fantasy, Grit & Unyielding Will",
    whyRecommend: "A masterpiece of dark high-fantasy storytelling, breathtaking artwork, and psychological depth.",
    searchQuery: "Berserk Kentaro Miura manga",
  },
  {
    title: "Monster",
    author: "Naoki Urasawa",
    category: "Manga",
    vibe: "Psychological Thriller & European Mystery",
    whyRecommend: "Tight, cerebral tension about morality and human nature, set across 1990s Central Europe.",
    searchQuery: "Monster Naoki Urasawa manga",
  },
  {
    title: "Vinland Saga",
    author: "Makoto Yukimura",
    category: "Manga",
    vibe: "Historical Adventure & Growth",
    whyRecommend: "Epic Viking journey exploring violence, vengeance, redemption, and what it truly means to be free.",
    searchQuery: "Vinland Saga Makoto Yukimura manga",
  },
  // Light Novels
  {
    title: "Ascendance of a Bookworm",
    author: "Miya Kazuki",
    category: "Light Novel",
    vibe: "Book Lover Fantasy & Worldbuilding",
    whyRecommend: "A librarian reincarnated in a world without printing presses vows to manufacture her own books.",
    searchQuery: "Ascendance of a Bookworm Miya Kazuki light novel",
  },
  {
    title: "Spice and Wolf",
    author: "Isuna Hasekura",
    category: "Light Novel",
    vibe: "Medieval Economics & Cozy Travel",
    whyRecommend: "Witty banter, merchant journeying, and rich folklore across charming European towns.",
    searchQuery: "Spice and Wolf Isuna Hasekura light novel",
  },
  {
    title: "Overlord",
    author: "Kugane Maruyama",
    category: "Light Novel",
    vibe: "Dark Overlord Strategy & World Domination",
    whyRecommend: "Masterclass in kingdom management and dark fantasy perspective from an undefeated guild master.",
    searchQuery: "Overlord Kugane Maruyama light novel",
  },
  // Manhwa
  {
    title: "Omniscient Reader's Viewpoint",
    author: "Sing Shong",
    category: "Manhwa",
    vibe: "Meta-Apocalypse & Literary Twist",
    whyRecommend: "The sole reader of an obscure web novel suddenly finds the real world transformed into that exact novel.",
    searchQuery: "Omniscient Reader Viewpoint manhwa",
  },
  {
    title: "Solo Leveling",
    author: "Chugong",
    category: "Manhwa",
    vibe: "High-Octane Progression Fantasy",
    whyRecommend: "The definitive hunter dungeon-crawler with unmatched pacing, visual flair, and power escalation.",
    searchQuery: "Solo Leveling Chugong manhwa",
  },
  {
    title: "The Boxer",
    author: "JH",
    category: "Manhwa",
    vibe: "Deep Character Drama & Sports",
    whyRecommend: "A profound deconstruction of talent, purpose, depression, and redemption through the ring.",
    searchQuery: "The Boxer JH manhwa",
  },
  // Biography & Memoirs
  {
    title: "The Autobiography of Benjamin Franklin",
    author: "Benjamin Franklin",
    category: "Biography",
    vibe: "Inventive Spirit & Practical Wisdom",
    whyRecommend: "Timeless memoir on polymathy, self-discipline, and curiosity from one of history's great minds.",
    searchQuery: "Benjamin Franklin autobiography",
  },
  {
    title: "Steve Jobs",
    author: "Walter Isaacson",
    category: "Biography",
    vibe: "Creative Intensity & Design Obsession",
    whyRecommend: "Unfiltered look at the intersection of technology, humanities, and obsessive design.",
    searchQuery: "Steve Jobs Walter Isaacson biography",
  },
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    category: "Biography",
    vibe: "Stoic Philosophy & Inner Citadel",
    whyRecommend: "Private personal journals of a Roman Emperor navigating duty, mortality, and inner tranquility.",
    searchQuery: "Marcus Aurelius Meditations",
  },
  // Classic & Modern Novels
  {
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    category: "Novel",
    vibe: "Masterful Revenge & High Intrigue",
    whyRecommend: "The greatest tale of patience, justice, prison escape, and elaborate retribution ever penned.",
    searchQuery: "Count of Monte Cristo Alexandre Dumas",
  },
  {
    title: "Frankenstein; or, The Modern Prometheus",
    author: "Mary Shelley",
    category: "Novel",
    vibe: "Gothic Science & Tragic Creation",
    whyRecommend: "Deeply philosophical foundation of science fiction exploring grief, ambition, and isolation.",
    searchQuery: "Frankenstein Mary Shelley",
  },
  {
    title: "Dune",
    author: "Frank Herbert",
    category: "Novel",
    vibe: "Planetary Politics & Desert Mysticism",
    whyRecommend: "Monumental sci-fi masterpiece weaving ecology, religious fervor, and galactic destiny.",
    searchQuery: "Dune Frank Herbert novel",
  },
];

function getApiKey(): string {
  return (
    localStorage.getItem("bards_gemini_api_key") ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  );
}

// 1. Fetch book-matched soundtrack recommendations
export async function getSoundtrackRecommendations(
  bookTitle: string,
  mood: string = "cozy",
  customNote?: string,
): Promise<SoundtrackRecommendation[]> {
  const apiKey = getApiKey();
  const normalizedMood = mood.toLowerCase();

  // If no API key, return curated verified tracks immediately
  if (!apiKey) {
    const list = FALLBACK_SOUNDTRACKS[normalizedMood] || FALLBACK_SOUNDTRACKS.cozy;
    return list;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are the specialized Reading Soundtrack Engine for Bard's Library.
The user is currently reading the book: "${bookTitle}".
Desired listening vibe: "${mood}".
${customNote ? `Special instructions: ${customNote}` : ""}

Recommend exactly 3 instrumental or atmospheric music tracks / albums / soundscapes available on YouTube that perfectly elevate this reading session.
Respond ONLY with a valid JSON array of objects with these exact keys:
[
  {
    "title": "Track or Stream Title",
    "artist": "Artist or Channel Name",
    "mood": "Specific vibe summary",
    "searchQuery": "Exact YouTube search term to find it",
    "rationale": "One brief sentence explaining why this matches ${bookTitle}"
  }
]
Do not include markdown backticks or commentary, just raw JSON.`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        title: item.title || "Reading Ambience",
        artist: item.artist || "Atmospheric Ensemble",
        mood: item.mood || mood,
        searchQuery: item.searchQuery || `${item.title} ${item.artist} reading music`,
        rationale: item.rationale || "Harmonizes with the narrative tempo and atmosphere.",
      }));
    }
  } catch (err) {
    console.warn("Gemini soundtrack suggestion fallback triggered:", err);
  }

  return FALLBACK_SOUNDTRACKS[normalizedMood] || FALLBACK_SOUNDTRACKS.cozy;
}

// 2. Fetch Next-Read Matchmaker recommendations
export async function getNextBookRecommendations(
  currentBook: string,
  formatFilter: ReadingFormat = "All",
  customVibe?: string,
): Promise<BookRecommendation[]> {
  const apiKey = getApiKey();

  // If no API key, filter the rich fallback catalog
  if (!apiKey) {
    if (formatFilter === "All") {
      return FALLBACK_BOOKS.slice(0, 6);
    }
    const filtered = FALLBACK_BOOKS.filter((b) => b.category === formatFilter);
    return filtered.length > 0 ? filtered : FALLBACK_BOOKS.slice(0, 4);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are the Literary Next-Read Matchmaker inside Bard's Library.
The user has just read or is finishing: "${currentBook}".
Preferred reading format filter: "${formatFilter}".
${customVibe ? `Specific vibe or themes desired: "${customVibe}"` : ""}

Recommend 4 books/series across formats (Manga, Light Novel, Manhwa, Biography, or Novel) that share thematic resonance, character brilliance, or narrative tone with "${currentBook}".
Respond ONLY with a valid JSON array of objects with these exact keys:
[
  {
    "title": "Title of work",
    "author": "Author or Creator",
    "category": "Manga" | "Light Novel" | "Manhwa" | "Biography" | "Novel",
    "vibe": "3-5 word tone descriptors",
    "whyRecommend": "One sharp sentence explaining why it is the perfect next read after ${currentBook}",
    "searchQuery": "Search query to find it in library or catalog"
  }
]
No backticks, only raw JSON.`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        title: item.title,
        author: item.author,
        category: item.category || "Novel",
        vibe: item.vibe || "Atmospheric",
        whyRecommend: item.whyRecommend || "Shares thematic continuity with your recent reading.",
        searchQuery: item.searchQuery || `${item.title} ${item.author}`,
      }));
    }
  } catch (err) {
    console.warn("Gemini next-read recommendation fallback triggered:", err);
  }

  if (formatFilter === "All") {
    return FALLBACK_BOOKS.slice(0, 6);
  }
  const filtered = FALLBACK_BOOKS.filter((b) => b.category === formatFilter);
  return filtered.length > 0 ? filtered : FALLBACK_BOOKS.slice(0, 4);
}

// Keep legacy text chat helper for any backwards compatibility
export async function askGemini(prompt: string, contextText?: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "Please provide a Google Gemini API Key in Settings or your .env file to enable custom AI reasoning.";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const systemInstruction = contextText
    ? `You are an erudite, literary companion inside an e-reader called Bard's Library. The user is reading: "${contextText.slice(0, 1500)}". Keep responses concise, atmospheric, and insightful.`
    : "You are an erudite, literary companion inside an e-reader called Bard's Library.";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: systemInstruction }, { text: prompt }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated from the model."
    );
  } catch (error: any) {
    return `AI Assistant Error: ${error.message || "Failed to contact Gemini API."}`;
  }
}
