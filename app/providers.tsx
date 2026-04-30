"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/query-provider";
import NextTopLoader from "nextjs-toploader";
import { useTheme } from "next-themes";
import { useEffect } from "react";

function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // #0a1929 is the base color of the dark mode glass navbar
    // #f4f6ff es la mezcla visual aproximada del navbar glass sobre el fondo claro
    const color = resolvedTheme === "dark" ? "#0a1929" : "#f4f6ff";
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", color);
    } else {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      metaThemeColor.setAttribute("content", color);
      document.head.appendChild(metaThemeColor);
    }
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeColorUpdater />
      <SessionProvider>
        <QueryProvider>
          <NextTopLoader showSpinner={false} color="#2563EB" shadow="0 0 10px #2563EB,0 0 5px #2563EB" />
          {children}
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
