"use client";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/pwa/register-sw";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

// Nota: Metadata y Viewport no pueden ser exportados desde un Client Component
// Por lo que los movemos a un archivo separado o los definimos inline

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        <title>SIGE Marketplace - Tu tienda en Bolivia</title>
        <meta name="description" content="Plataforma de comercio electrónico con videos, notificaciones push y PWA" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SIGE" />
        <meta name="format-detection" content="telephone=yes" />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster />
            <RegisterSW />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}