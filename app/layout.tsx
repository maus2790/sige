import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/pwa/register-sw";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SIGE Marketplace - Tu tienda en Bolivia",
  description: "Plataforma de comercio electrónico con videos, notificaciones push y PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIGE",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    apple: [
      { url: "/icons/icon-192.png" },
      { url: "/icons/icon-192.png", sizes: "152x152" },
      { url: "/icons/icon-192.png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
          <Toaster />
          <RegisterSW />
        </Providers>
      </body>
    </html>
  );
}