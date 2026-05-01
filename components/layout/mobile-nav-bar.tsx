"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingCart, Plus, Package, Store } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CategorySheet } from "@/components/productos/category-sheet";
import { QuickPublishModal } from "@/components/productos/quick-publish-modal";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MobileNavBarProps {
  categories: Category[];
}

export function MobileNavBar({ categories }: MobileNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCart((state) => state.getTotalItems());
  
  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);

  const handleCategorySelect = (category: string) => {
    router.push(`/?category=${encodeURIComponent(category)}`);
  };

  const navItems = [
    { href: "/", label: "Inicio", icon: Home },
    { 
      label: "Categorías", 
      icon: Package, 
      onClick: () => setIsCategoryOpen(true),
      isActive: isCategoryOpen 
    },
    { 
      label: "Vender", 
      icon: Plus, 
      isAction: true,
      onClick: () => setIsPublishOpen(true) 
    },
    { 
      href: "/cart", 
      label: "Carrito", 
      icon: ShoppingCart,
      badge: totalItems 
    },
    { href: "/dashboard", label: "Mi Tienda", icon: Store },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-primary/10 md:hidden z-40 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1),0_-4px_10px_-2px_rgba(37,99,235,0.05)]">
        <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : item.isActive;

            if (item.isAction) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="relative -top-5 flex items-center justify-center"
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
              <Link key={item.href} href={item.href} className="flex-1">
                {content}
              </Link>
            ) : (
              <button key={index} onClick={item.onClick} className="flex-1">
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
      />

      <QuickPublishModal 
        categories={categories}
        open={isPublishOpen}
        onOpenChange={setIsPublishOpen}
      />
    </>
  );
}