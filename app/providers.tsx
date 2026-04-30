"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/query-provider";
import NextTopLoader from "nextjs-toploader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <QueryProvider>
          <NextTopLoader showSpinner={false} color="#2563EB" shadow="0 0 10px #2563EB,0 0 5px #2563EB" />
          {children}
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
