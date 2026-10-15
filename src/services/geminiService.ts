// Google Gemini API integration for Bard's Library AI Assistant
// Allows summarizing chapters, explaining words, and generating book-specific ambient playlists

export async function askGemini(prompt: string, contextText?: string): Promise<string> {
  const apiKey =
    localStorage.getItem("bards_gemini_api_key") ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    "";

  if (!apiKey) {
    return "Please provide a Google Gemini API Key in Settings or your .env file to use the AI Companion.";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = contextText
    ? `You are an erudite, literary companion inside an e-reader called Bard's Library. The user is currently reading an excerpt: "${contextText.slice(0, 1500)}". Keep responses concise, atmospheric, and insightful.`
    : "You are an erudite, literary companion inside an e-reader called Bard's Library. Help the reader with literary analysis, archaic vocabulary, and thematic context.";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemInstruction },
              { text: prompt },
            ],
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
    console.error("Gemini API request failed:", error);
    return `AI Assistant Error: ${error.message || "Failed to contact Gemini API."}`;
  }
}
