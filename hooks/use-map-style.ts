"use client";

import { useState, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";

export const MAP_STYLES = {
  positron: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
  bright: "https://tiles.openfreemap.org/styles/bright",
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;
export type MapTheme = "light" | "dark";

export function useMapStyle() {
  const { resolvedTheme } = useTheme();
  const [manualStyle, setManualStyle] = useState<MapStyleKey | null>(null);

  const activeStyleKey = useMemo(() => {
    if (manualStyle) return manualStyle;
    return resolvedTheme === "dark" ? "dark" : "positron";
  }, [manualStyle, resolvedTheme]);

  const mapStyle = MAP_STYLES[activeStyleKey];

  const toggleTheme = useCallback(() => {
    setManualStyle(prev => {
      const current = prev || (resolvedTheme === "dark" ? "dark" : "positron");
      // Si el estilo actual es oscuro (ya sea el oficial 'dark' o una capa manual oscura), cambiamos a positron
      // Si no, cambiamos a dark.
      return (current === "dark") ? "positron" : "dark";
    });
  }, [resolvedTheme]);

  return { 
    mapStyle, 
    styleKey: activeStyleKey,
    theme: (activeStyleKey === "dark") ? "dark" : "light",
    setManualStyle,
    toggleTheme,
    availableStyles: MAP_STYLES
  };
}

