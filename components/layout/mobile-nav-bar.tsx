"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, Plus, Package, Store, Gift, User, ShoppingCart, Map, Download } from "lucide-react";
import { useSession } from "next-auth/react";
import { CategorySheet } from "@/components/productos/category-sheet";
import { QuickPublishModal } from "@/components/productos/quick-publish-modal";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { isPremiumTheme, PremiumTheme } from "@/hooks/use-premium-theme";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MobileNavBarProps {
  categories: Category[];
  myStoreId?: string | null;
}

export function MobileNavBar({ categories, myStoreId }: MobileNavBarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const { data: session } = useSession();
  
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [storeTheme, setStoreTheme] = React.useState<PremiumTheme>("blue");
  const isStorePage = pathname.startsWith("/tienda/");
  const storeThemeClass = isStorePage && storeTheme !== "blue" ? `theme-premium theme-${storeTheme}` : "";

  React.useEffect(() => {
    setMounted(true);
    const storeThemeHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ theme?: PremiumTheme; active?: boolean }>).detail;
      setStoreTheme(detail?.active && isPremiumTheme(detail.theme) ? detail.theme : "blue");
    };
    window.addEventListener("sige-store-theme-change", storeThemeHandler);
    return () => window.removeEventListener("sige-store-theme-change", storeThemeHandler);
  }, []);

  React.useEffect(() => {
    if (!isStorePage) {
      setStoreTheme("blue");
    }
  }, [isStorePage]);

  // Mostrar en Mercado, Tiendas y Perfil. Ocultar en Gift Cards porque tiene su propio menú inferior.
  const isProfilePage = pathname === "/profile";
  const isCartPage = pathname === "/cart";
  const isMapPage = pathname === "/mapa";
  if (pathname !== "/" && !isStorePage && !isProfilePage && !isCartPage && !isMapPage) return null;

  const handleCategorySelect = (category: string) => {
    router.push(`/?category=${encodeURIComponent(category)}`);
  };

  const navItems: Array<{ href?: string; label: string; icon: any; isAction?: boolean; onClick?: () => void; badge?: number }> = [
    { href: "/", label: "Mercado", icon: Home },
    { 
      href: "/mapa", 
      label: "Explorar", 
      icon: Map,
    },
    ...(pathname === "/" || (myStoreId && pathname === `/tienda/${myStoreId}`) ? [{ 
      label: "Vender", 
      icon: Plus, 
      isAction: true, 
      onClick: () => {
        if (!session) {
          router.push("/auth/login");
        } else {
          setIsPublishOpen(true);
        }
      },
      badge: 0
    }] : []),
    { 
      href: myStoreId ? `/tienda/${myStoreId}` : "/dashboard", 
      label: "Tienda", 
      icon: Store 
    },
    { 
      href: "/profile", 
      label: "Perfil", 
      icon: User 
    },
  ];

  const currentCategory = searchParams.get("category") || "todos";

  return (
    <>
      <nav className={cn("mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-primary/10 md:hidden z-40 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1),0_-4px_10px_-2px_rgba(37,99,235,0.05)]", storeThemeClass)}>
        <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.isAction) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="relative -top-5 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-brand-gradient text-white shadow-premium hover:shadow-2xl active:scale-90 transition-all border-4 border-background flex items-center justify-center group">
                    <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
              );
            }

            const content = (
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-muted-foreground"}`}>
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]" : ""}`} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 border-none animate-in zoom-in duration-300">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>{item.label}</span>
              </div>
            );

            return item.href ? (
              <Link key={item.href} href={item.href} className="flex-1 cursor-pointer">
                {content}
              </Link>
            ) : (
              <button key={index} onClick={item.onClick} className="flex-1 cursor-pointer">
                {content}
              </button>
            );
          })}
        </div>
      </nav>

      <CategorySheet 
        categories={categories} 
        open={isCategoryOpen} 
        onOpenChange={setIsCategoryOpen}
        onSelect={handleCategorySelect}
        selectedCategory={currentCategory}
      />

      <QuickPublishModal 
        categories={categories}
        open={isPublishOpen}
        onOpenChange={setIsPublishOpen}
        themeClassName={storeThemeClass}
      />
    </>
  );
}
