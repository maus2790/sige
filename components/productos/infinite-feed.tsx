"use client";

import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, Filter, Home, Search, Tags, ShoppingBag, X, Gift, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

interface InfiniteFeedProps {
  search?: string;
  initialCategories: Category[];
}

export function InfiniteFeed({ search: initialSearch = "", initialCategories }: InfiniteFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCategory = searchParams.get("category") || "todos";
  
  const [category, setCategory] = useState(urlCategory);
  const [search, setSearch] = useState(initialSearch);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const categoriesList = [
    { value: "todos", label: "Todos", icon: "✨" },
    ...initialCategories.map(c => ({ value: c.name, label: c.name, icon: c.icon }))
  ];

  // Sincronizar estado con la URL
  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const updateCategory = (newCategory: string) => {
    setCategory(newCategory);
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory === "todos") {
      params.delete("category");
    } else {
      params.set("category", newCategory);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteScroll({ category: category !== "todos" ? category : undefined, search });

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
  }, 500);

  const products = data?.pages.flatMap((page) => page.items) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section - Altura Original Restaurada */}
      <div className="relative overflow-hidden bg-brand-gradient text-white pb-16 pt-12 px-4 sm:px-6 lg:px-8 shadow-premium rounded-b-[2.5rem] md:rounded-b-[4rem] mb-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/30 animate-bounce-slow">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-4 drop-shadow-2xl text-white uppercase">
            SIGE Market
          </h1>
          <p className="text-xl md:text-2xl text-blue-50 font-black mb-2 drop-shadow-sm opacity-95 tracking-tight">
            Lo Mejor de Bolivia
          </p>
          <p className="text-sm md:text-lg text-blue-100/80 mb-6 max-w-2xl mx-auto font-medium">
            Explora y encuentra los mejores productos locales.....
          </p>
        </div>
      </div>

      {/* Mobile Gift Card FAB — Más elegante y compacto */}
      <Link
        href="/gift-cards"
        className="fixed bottom-24 right-6 z-40 md:hidden"
      >
        <div className="relative group">
          <span className="absolute inset-0 rounded-full bg-linear-to-tr from-pink-500 to-purple-500 animate-pulse opacity-20"></span>
          <div className="relative w-14 h-14 rounded-full bg-linear-to-tr from-pink-500 via-purple-600 to-indigo-600 text-white shadow-xl flex items-center justify-center transition-all active:scale-90 border border-white/30">
            <Gift className="w-6 h-6" />
          </div>
        </div>
      </Link>

      {/* Sticky Action Bar - Desktop & Mobile (Ajustado al borde del hero) */}
      <div className={`sticky top-16 z-40 transition-all duration-300 px-4 w-full max-w-6xl mx-auto -mt-6 mb-8 ${isScrolled ? 'drop-shadow-2xl' : ''}`}>
        <div className="flex items-center gap-3">
          
          {/* Botón VENDER (Pill llamativa con animación de brillo y bordes más coloridos) */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-publish-modal'))}
            className="hidden md:flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-black text-xs shadow-xl dark:shadow-[0_0_15px_rgba(37,99,235,0.4)] border-2 border-blue-300 dark:border-blue-400/50 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all shrink-0 uppercase tracking-wider btn-shine cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Vender
          </button>

          {/* Buscador Central (Bordes más definidos) */}
          <div className="glass-card flex-1 rounded-2xl p-1 flex items-center border border-zinc-300 dark:border-white/40 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-xl bg-white dark:bg-zinc-900/90 btn-shine">
            <div className="relative flex-1">
              <input
                id="mobile-search"
                type="text"
                placeholder="¿Qué estás buscando?"
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-10 pl-11 pr-4 rounded-xl bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-bold text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            
            <div className="hidden sm:flex items-center pr-1">
              <Select 
                value={category} 
                onValueChange={updateCategory}
              >
                <SelectTrigger className="h-9 w-[120px] rounded-xl text-[10px] font-black uppercase bg-muted/50 border-0 focus:ring-0">
                  <SelectValue placeholder="TODO" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-glass">
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-xs py-2">
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón GIFT CARDS (Pill llamativa con animación de brillo y bordes más coloridos) */}
          <Link
            href="/gift-cards"
            className="hidden md:flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 font-black text-xs shadow-xl dark:shadow-[0_0_15px_rgba(168,85,247,0.4)] border-2 border-purple-300 dark:border-purple-400/50 hover:bg-purple-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all shrink-0 uppercase tracking-wider btn-shine cursor-pointer"
          >
            <Gift className="h-5 w-5" />
            Gift Cards
          </Link>
        </div>
      </div>
      {category !== "todos" && (
        <div className="container mx-auto px-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="pl-3 pr-1 py-1.5 h-8 rounded-full bg-primary/10 text-primary border-primary/20 flex items-center gap-2 font-bold"
            >
              <span>{categoriesList.find(c => c.value === category)?.icon}</span>
              {category}
              <button 
                onClick={() => updateCategory("todos")}
                className="w-5 h-5 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">Filtro activo</span>
          </div>
        </div>
      )}

      {/* Grilla de Productos */}
      <div className="container mx-auto px-4">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border/50">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">No hay resultados</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              No encontramos productos que coincidan con tu búsqueda. Intenta con otros términos o categorías.
            </p>
            <Button 
              variant="outline" 
              className="mt-8 rounded-full px-8 h-12 font-semibold shadow-sm"
              onClick={() => {
                setCategory("todos");
                setSearch("");
              }}
            >
              Ver todos los productos
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Loader para scroll infinito */}
            <div ref={ref} className="flex justify-center py-12">
              {isFetchingNextPage && (
                <div className="flex items-center gap-3 px-6 py-3 bg-card border border-border/50 shadow-sm rounded-full animate-in fade-in zoom-in-95 duration-300">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-semibold text-muted-foreground">Cargando más...</span>
                </div>
              )}
              {!hasNextPage && products.length > 0 && (
                <div className="text-center animate-in fade-in duration-500">
                  <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mb-4"></div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Has visto todos los productos 🎉
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}