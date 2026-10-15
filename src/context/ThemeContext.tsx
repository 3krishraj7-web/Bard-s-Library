import React, { createContext, useContext, useEffect, useState } from "react";

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgSurface: string;
  bgHover: string;
  accent: string;
  accentHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
}

export interface ThemeTypography {
  fontFamily: string;
  readerFontSize: string;
  readerLineHeight: string;
  readerMargin: string;
}

export interface ThemeState {
  preset: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  customCss: string;
}

export const THEME_PRESETS: Record<string, { name: string; colors: ThemeColors; fontFamily: string }> = {
  nuclear: {
    name: "Slate Dark",
    colors: {
      bgPrimary: "#121318",
      bgSecondary: "#1a1b23",
      bgSurface: "#22242f",
      bgHover: "#2b2d3c",
      accent: "#6366f1",
      accentHover: "#4f46e5",
      textPrimary: "#f8fafc",
      textSecondary: "#94a3b8",
      textMuted: "#64748b",
      borderColor: "#2e3243",
    },
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  midnight: {
    name: "Midnight Blue",
    colors: {
      bgPrimary: "#0b0f19",
      bgSecondary: "#111827",
      bgSurface: "#1f2937",
      bgHover: "#374151",
      accent: "#38bdf8",
      accentHover: "#0284c7",
      textPrimary: "#f9fafb",
      textSecondary: "#9ca3af",
      textMuted: "#6b7280",
      borderColor: "#1e293b",
    },
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sepia: {
    name: "Warm Paper",
    colors: {
      bgPrimary: "#fbf0d9",
      bgSecondary: "#f4e4c1",
      bgSurface: "#ebd5aa",
      bgHover: "#dec293",
      accent: "#b45309",
      accentHover: "#92400e",
      textPrimary: "#292524",
      textSecondary: "#57534e",
      textMuted: "#78716c",
      borderColor: "#d6bc8f",
    },
    fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
  },
  oled: {
    name: "OLED Black",
    colors: {
      bgPrimary: "#000000",
      bgSecondary: "#0a0a0a",
      bgSurface: "#141414",
      bgHover: "#1f1f1f",
      accent: "#10b981",
      accentHover: "#059669",
      textPrimary: "#ffffff",
      textSecondary: "#a1a1aa",
      textMuted: "#71717a",
      borderColor: "#262626",
    },
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

const DEFAULT_THEME: ThemeState = {
  preset: "nuclear",
  colors: THEME_PRESETS.nuclear.colors,
  typography: {
    fontFamily: THEME_PRESETS.nuclear.fontFamily,
    readerFontSize: "18px",
    readerLineHeight: "1.7",
    readerMargin: "32px",
  },
  customCss: "/* Injected custom user CSS */\n",
};

const STORAGE_KEY = "bards_library_theme";

interface ThemeContextType {
  theme: ThemeState;
  setPreset: (presetKey: string) => void;
  setColor: (colorKey: keyof ThemeColors, value: string) => void;
  setTypography: (key: keyof ThemeTypography, value: string) => void;
  setCustomCss: (css: string) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_THEME, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load theme from localStorage", e);
    }
    return DEFAULT_THEME;
  });

  // Apply CSS custom properties and custom CSS element
  useEffect(() => {
    const root = document.documentElement;
    // Apply colors
    root.style.setProperty("--bg-primary", theme.colors.bgPrimary);
    root.style.setProperty("--bg-secondary", theme.colors.bgSecondary);
    root.style.setProperty("--bg-surface", theme.colors.bgSurface);
    root.style.setProperty("--bg-hover", theme.colors.bgHover);
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--accent-hover", theme.colors.accentHover);
    root.style.setProperty("--text-primary", theme.colors.textPrimary);
    root.style.setProperty("--text-secondary", theme.colors.textSecondary);
    root.style.setProperty("--text-muted", theme.colors.textMuted);
    root.style.setProperty("--border-color", theme.colors.borderColor);

    // Apply typography
    root.style.setProperty("--font-family", theme.typography.fontFamily);
    root.style.setProperty("--reader-font-size", theme.typography.readerFontSize);
    root.style.setProperty("--reader-line-height", theme.typography.readerLineHeight);
    root.style.setProperty("--reader-margin", theme.typography.readerMargin);

    // Apply Custom CSS directly into a dedicated style tag
    let styleTag = document.getElementById("bards-custom-css") as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "bards-custom-css";
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = theme.customCss;

    // Persist to local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      console.error("Failed to persist theme to localStorage", e);
    }
  }, [theme]);

  const setPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      setTheme((prev) => ({
        ...prev,
        preset: presetKey,
        colors: { ...preset.colors },
        typography: {
          ...prev.typography,
          fontFamily: preset.fontFamily,
        },
      }));
    }
  };

  const setColor = (colorKey: keyof ThemeColors, value: string) => {
    setTheme((prev) => ({
      ...prev,
      preset: "custom",
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const setTypography = (key: keyof ThemeTypography, value: string) => {
    setTheme((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value,
      },
    }));
  };

  const setCustomCss = (css: string) => {
    setTheme((prev) => ({
      ...prev,
      customCss: css,
    }));
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setPreset,
        setColor,
        setTypography,
        setCustomCss,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
