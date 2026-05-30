"use client";

import { useCallback, useEffect, useState } from "react";

export type PremiumTheme =
  | "blue"
  | "black"
  | "gold"
  | "rose"
  | "emerald"
  | "purple"
  | "ocean"
  | "sunset"
  | "cyan"
  | "ruby";

export const PREMIUM_THEMES: Array<{
  value: PremiumTheme;
  label: string;
  shortLabel: string;
  swatchGradient: string;
}> = [
  {
    value: "blue",
    label: "Blue Premium",
    shortLabel: "BLUE CARD",
    swatchGradient: "linear-gradient(135deg, #7dd3fc 0%, #3b82f6 48%, #312e81 100%)",
  },
  {
    value: "gold",
    label: "Gold Premium",
    shortLabel: "GOLD CARD",
    swatchGradient: "linear-gradient(135deg, #fde68a 0%, #f59e0b 48%, #92400e 100%)",
  },
  {
    value: "rose",
    label: "Rose Premium",
    shortLabel: "ROSE CARD",
    swatchGradient: "linear-gradient(135deg, #fecdd3 0%, #f43f5e 48%, #86198f 100%)",
  },
  {
    value: "emerald",
    label: "Emerald Premium",
    shortLabel: "EMERALD CARD",
    swatchGradient: "linear-gradient(135deg, #a7f3d0 0%, #10b981 48%, #115e59 100%)",
  },
  {
    value: "purple",
    label: "Purple Premium",
    shortLabel: "PURPLE CARD",
    swatchGradient: "linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 48%, #312e81 100%)",
  },
  {
    value: "ocean",
    label: "Ocean Premium",
    shortLabel: "OCEAN CARD",
    swatchGradient: "linear-gradient(135deg, #bfdbfe 0%, #06b6d4 48%, #1e3a8a 100%)",
  },
  {
    value: "sunset",
    label: "Orange Premium",
    shortLabel: "ORANGE CARD",
    swatchGradient: "linear-gradient(135deg, #fb923c 0%, #ef4444 48%, #e11d48 100%)",
  },
  {
    value: "cyan",
    label: "Cyan Premium",
    shortLabel: "CYAN CARD",
    swatchGradient: "linear-gradient(135deg, #cffafe 0%, #22d3ee 48%, #115e59 100%)",
  },
  {
    value: "ruby",
    label: "Ruby Premium",
    shortLabel: "RUBY CARD",
    swatchGradient: "linear-gradient(135deg, #fecaca 0%, #dc2626 48%, #1c1917 100%)",
  },
  {
    value: "black",
    label: "Neon Premium",
    shortLabel: "NEON CARD",
    swatchGradient: "linear-gradient(135deg, #020617 0%, #0891b2 48%, #22d3ee 100%)",
  },
];

const THEME_CLASSES = PREMIUM_THEMES.map((theme) => `theme-${theme.value}`);

const STORAGE_KEY = "sige-premium-theme";
const PREMIUM_THEME_CHANGE_EVENT = "sige-premium-theme-change";

const PREMIUM_THEME_COLORS: Record<PremiumTheme, string> = {
  blue: "#2563eb",
  gold: "#d97706",
  rose: "#e11d48",
  emerald: "#059669",
  purple: "#7c3aed",
  ocean: "#0284c7",
  sunset: "#ea580c",
  cyan: "#0891b2",
  ruby: "#dc2626",
  black: "#06b6d4",
};

export function getPremiumThemeColor(theme: PremiumTheme) {
  return PREMIUM_THEME_COLORS[theme] || PREMIUM_THEME_COLORS.sunset;
}

function applyThemeColor(theme: PremiumTheme) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = getPremiumThemeColor(theme);
  }
}

function applyPremiumTheme(theme: PremiumTheme) {
  document.documentElement.classList.remove("theme-premium", ...THEME_CLASSES);

  if (theme !== "blue") {
    document.documentElement.classList.add("theme-premium", `theme-${theme}`);
  }

  applyThemeColor(theme);
}

function readPremiumTheme(): PremiumTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return PREMIUM_THEMES.some((theme) => theme.value === saved)
      ? (saved as PremiumTheme)
      : "sunset";
  } catch {
    return "sunset";
  }
}

export function isPremiumTheme(value: unknown): value is PremiumTheme {
  return PREMIUM_THEMES.some((theme) => theme.value === value);
}

export function usePremiumTheme() {
  const [premiumTheme, setPremiumTheme] = useState<PremiumTheme>(() => {
    if (typeof window === "undefined") return "sunset";
    return readPremiumTheme();
  });

  useEffect(() => {
    const savedTheme = readPremiumTheme();
    applyPremiumTheme(savedTheme);

    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<PremiumTheme>).detail;
      if (isPremiumTheme(nextTheme)) {
        setPremiumTheme(nextTheme);
        applyPremiumTheme(nextTheme);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const nextTheme = isPremiumTheme(event.newValue) ? event.newValue : "sunset";
        setPremiumTheme(nextTheme);
        applyPremiumTheme(nextTheme);
      }
    };

    window.addEventListener(PREMIUM_THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(PREMIUM_THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setTheme = useCallback((nextTheme: PremiumTheme) => {
    setPremiumTheme(nextTheme);
    applyPremiumTheme(nextTheme);

    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Keep the current document in sync even when storage is unavailable.
    }

    window.dispatchEvent(
      new CustomEvent(PREMIUM_THEME_CHANGE_EVENT, { detail: nextTheme })
    );
  }, []);

  const toggleTheme = useCallback(() => {
    const currentIndex = PREMIUM_THEMES.findIndex((theme) => theme.value === premiumTheme);
    const nextTheme = PREMIUM_THEMES[(currentIndex + 1) % PREMIUM_THEMES.length]?.value || "sunset";
    setTheme(nextTheme);
  }, [premiumTheme, setTheme]);

  return { premiumTheme, setTheme, toggleTheme, themes: PREMIUM_THEMES };
}
