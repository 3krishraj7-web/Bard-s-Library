import React, { useState } from "react";
import { useTheme, THEME_PRESETS, ThemeColors } from "../../context/ThemeContext";
import { Palette, Code2, RotateCcw, Check, Type, Key, Bot, CheckCircle } from "lucide-react";

export const ThemeSettings: React.FC = () => {
  const { theme, setPreset, setColor, setTypography, setCustomCss, resetTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"colors" | "typography" | "css" | "keys">("colors");

  // API keys state
  const [geminiKey, setGeminiKey] = useState<string>(
    () => localStorage.getItem("bards_gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || "",
  );
  const [youtubeKey, setYoutubeKey] = useState<string>(
    () => localStorage.getItem("bards_youtube_api_key") || import.meta.env.VITE_YOUTUBE_API_KEY || "",
  );
  const [keySavedMessage, setKeySavedMessage] = useState<string>("");

  const handleSaveKeys = () => {
    localStorage.setItem("bards_gemini_api_key", geminiKey.trim());
    localStorage.setItem("bards_youtube_api_key", youtubeKey.trim());
    setKeySavedMessage("API keys successfully saved to local storage!");
    setTimeout(() => setKeySavedMessage(""), 3000);
  };

  const colorLabels: { key: keyof ThemeColors; label: string; desc: string }[] = [
    { key: "bgPrimary", label: "Primary Background", desc: "Main canvas and window base" },
    { key: "bgSecondary", label: "Secondary Background", desc: "Sidebar and header navigation" },
    { key: "bgSurface", label: "Surface Background", desc: "Cards, panels, and dropdowns" },
    { key: "bgHover", label: "Hover / Active", desc: "Hover state for buttons and list items" },
    { key: "accent", label: "Accent Color", desc: "Primary brand accent, sliders, highlights" },
    { key: "accentHover", label: "Accent Hover", desc: "Interactive hover state for accent items" },
    { key: "textPrimary", label: "Primary Text", desc: "Main content titles and body text" },
    { key: "textSecondary", label: "Secondary Text", desc: "Subtitles, metadata, and labels" },
    { key: "textMuted", label: "Muted Text", desc: "Timestamps, hints, and icons" },
    { key: "borderColor", label: "Border Color", desc: "Dividers, card borders, and outlines" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="w-6 h-6 text-[var(--accent)]" />
            Appearance & System Settings
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Customize real-time CSS variables, manage API integrations, or inject raw custom CSS.
          </p>
        </div>
        <button
          onClick={resetTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-color)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Theme Defaults
        </button>
      </div>

      {/* Preset Selector */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Theme Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(THEME_PRESETS).map(([key, preset]) => {
            const isSelected = theme.preset === key;
            return (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--border-color)] hover:border-[var(--text-muted)]"
                }`}
                style={{ backgroundColor: preset.colors.bgSecondary }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: preset.colors.textPrimary }}
                  >
                    {preset.name}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5" style={{ color: preset.colors.accent }} />
                  )}
                </div>
                <div className="flex gap-1.5 items-center">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: preset.colors.bgPrimary }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: preset.colors.bgSurface }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("colors")}
          className={`pb-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "colors"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Palette className="w-4 h-4" />
          Color Variables
        </button>
        <button
          onClick={() => setActiveTab("typography")}
          className={`pb-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "typography"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Type className="w-4 h-4" />
          Typography
        </button>
        <button
          onClick={() => setActiveTab("keys")}
          className={`pb-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "keys"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Key className="w-4 h-4" />
          API Keys & Integrations
        </button>
        <button
          onClick={() => setActiveTab("css")}
          className={`pb-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "css"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Custom CSS Injection
        </button>
      </div>

      {/* Tab 1: Color Customization */}
      {activeTab === "colors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colorLabels.map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
                <div className="text-xs text-[var(--text-muted)]">{desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  {theme.colors[key]}
                </span>
                <input
                  type="color"
                  value={theme.colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Typography Settings */}
      {activeTab === "typography" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
            <label className="block text-sm font-medium">Font Family</label>
            <select
              value={theme.typography.fontFamily}
              onChange={(e) => setTypography("fontFamily", e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                System Sans (Modern / Clean)
              </option>
              <option value="Georgia, Cambria, 'Times New Roman', serif">
                Classic Serif (Book / Editorial)
              </option>
              <option value="'Courier New', Courier, monospace">Monospace (Code / Retro)</option>
              <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                Default Font Size
              </label>
              <input
                type="text"
                value={theme.typography.readerFontSize}
                onChange={(e) => setTypography("readerFontSize", e.target.value)}
                placeholder="18px"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                Line Height
              </label>
              <input
                type="text"
                value={theme.typography.readerLineHeight}
                onChange={(e) => setTypography("readerLineHeight", e.target.value)}
                placeholder="1.7"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                Page Margin
              </label>
              <input
                type="text"
                value={theme.typography.readerMargin}
                onChange={(e) => setTypography("readerMargin", e.target.value)}
                placeholder="32px"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: API Keys & Integrations */}
      {activeTab === "keys" && (
        <div className="space-y-5">
          {keySavedMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{keySavedMessage}</span>
            </div>
          )}

          {/* Gemini AI Key */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Bot className="w-4 h-4 text-[var(--accent)]" />
                Google Gemini API Key
              </label>
              {geminiKey ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Configured
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  Missing
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Powers the in-reader AI Companion for chapter summaries, vocabulary analysis, and reading discussion.
            </p>
            <input
              type="password"
              placeholder="AIzaSy... or AQ.Ab8..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* YouTube Data API v3 Key */}
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-red-500" />
                YouTube Data API v3 Key
              </label>
              {youtubeKey ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Configured
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  Missing
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Powers instant search across all songs, artists, albums, and live 24/7 ambient streams on YouTube.
            </p>
            <input
              type="password"
              placeholder="Enter YouTube Data API v3 Key (AIzaSy...)..."
              value={youtubeKey}
              onChange={(e) => setYoutubeKey(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-2.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveKeys}
              className="px-5 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-md transition-colors"
            >
              Save Configuration to Local Storage
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Raw Custom CSS Injection */}
      {activeTab === "css" && (
        <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[var(--accent)]" />
              Runtime Custom CSS
            </label>
            <span className="text-xs text-[var(--text-muted)]">
              Injected live into document &lt;head&gt;
            </span>
          </div>
          <textarea
            rows={8}
            value={theme.customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            placeholder="/* Example: body { filter: contrast(105%); } */"
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Custom styles take effect instantly without reloading and persist across restarts.
          </p>
        </div>
      )}
    </div>
  );
};
