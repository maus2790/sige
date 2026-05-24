import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/pwa/register-sw";
import { Navbar } from "@/components/layout/nav-bar";
import { MobileNavBar } from "@/components/layout/mobile-nav-bar";
import { Providers } from "./providers";
import { getCategories } from "./actions/categories";
import { getMyStoreId } from "./actions/storefront";
import { OneSignalProvider } from "@/components/providers/onesignal-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "SIGE Mercado - Los mejores productos de Bolivia",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();
  const myStoreId = await getMyStoreId();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Script id="sige-premium-theme-init" strategy="beforeInteractive">
          {`
            try {
              var premiumTheme = localStorage.getItem('sige-premium-theme') || 'blue';
              var allowedThemes = ['blue', 'black', 'gold', 'rose', 'emerald', 'purple', 'ocean', 'sunset', 'cyan', 'ruby'];
              document.documentElement.classList.remove(
                'theme-premium',
                'theme-blue',
                'theme-black',
                'theme-gold',
                'theme-rose',
                'theme-emerald',
                'theme-purple',
                'theme-ocean',
                'theme-sunset',
                'theme-cyan',
                'theme-ruby'
              );
              if (allowedThemes.indexOf(premiumTheme) === -1) {
                premiumTheme = 'blue';
              }
              if (premiumTheme !== 'blue') {
                document.documentElement.classList.add('theme-premium', 'theme-' + premiumTheme);
              }
            } catch (e) {}
          `}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange
          enableColorScheme={false}
        >
          <Providers>
            <OneSignalProvider>
              <Navbar categories={categories} myStoreId={myStoreId} />
              <div>
                {children}
              </div>
              <MobileNavBar categories={categories} myStoreId={myStoreId} />
              <Toaster />
              <RegisterSW />
            </OneSignalProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
