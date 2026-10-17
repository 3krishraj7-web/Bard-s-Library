import React from "react";

interface BardsLogoProps {
  className?: string;
  size?: number;
}

/**
 * Bard's Library Official Logo
 * Concept: Harp with a Bookmark Ribbon
 * A classical harp whose strings emerge from an open book's spine,
 * with an amber ribbon bookmark draping from the bottom.
 */
export const BardsLogo: React.FC<BardsLogoProps> = ({ className = "w-6 h-6", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Golden harp frame gradient */}
        <linearGradient id="bardsHarpGrad" x1="12" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Book spine & pages gradient */}
        <linearGradient id="bardsBookGrad" x1="6" y1="28" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Amber/Red bookmark ribbon gradient */}
        <linearGradient id="bardsRibbonGrad" x1="22" y1="34" x2="26" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>

      {/* 1. Open Book Pages at Base */}
      <path
        d="M8 35C14 32.5 19.5 33 24 35.5C28.5 33 34 32.5 40 35V27C34 24.5 28.5 25 24 27.5C19.5 25 14 24.5 8 27V35Z"
        fill="#F1F5F9"
        fillOpacity="0.9"
        stroke="#6366F1"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M24 27.5V36"
        stroke="#475569"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* 2. Classical Harp Frame rising from Spine */}
      {/* Outer Pillar & Harmonic Arch */}
      <path
        d="M17 33C17 24 16 11 22 7C27 3.5 33 6.5 35 12C36.5 16.5 34.5 22 31 33"
        stroke="url(#bardsHarpGrad)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Harp Base on Book */}
      <path
        d="M15 33H33"
        stroke="url(#bardsHarpGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 3. Harp Strings (delicate and fanning out from the soundbox) */}
      <line x1="21" y1="9" x2="19" y2="33" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.85" />
      <line x1="24.5" y1="8" x2="23" y2="33" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.85" />
      <line x1="28" y1="9" x2="27" y2="33" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.85" />
      <line x1="31.5" y1="11.5" x2="30.5" y2="33" stroke="#FBBF24" strokeWidth="1.2" strokeOpacity="0.85" />

      {/* 4. Amber/Red Ribbon Bookmark hanging from bottom spine */}
      <path
        d="M22 34V45L24 43L26 45V34H22Z"
        fill="url(#bardsRibbonGrad)"
        stroke="#B45309"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* Accent Sparkle */}
      <circle cx="34" cy="7" r="1.5" fill="#FDE68A" />
    </svg>
  );
};
