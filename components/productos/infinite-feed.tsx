"use client";

import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, Filter, Home, Search, Tags, ShoppingBag, X, Gift } from "lucide-react";
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-brand-gradient text-white pb-16 pt-12 px-4 sm:px-6 lg:px-8 shadow-premium rounded-b-[2.5rem] md:rounded-b-[4rem] mb-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 rounded-2xl backdrop-blur-md mb-6 shadow-glass border border-white/20">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-lg text-white">
            SIGE Mercado <br className="md:hidden" /> Lo mejor de Bolivia
          </h1>
          <p className="text-lg md:text-xl text-blue-50 mb-8 max-w-2xl mx-auto font-medium drop-shadow-sm">
            Explora el mercado global con productos locales, envíos seguros y la mejor experiencia de compra.
          </p>
        </div>
      </div>

      {/* Floating Gift Card Button */}
      {!search && (
        <Link 
          href="/gift-cards" 
          className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 group"
        >
          <div className="relative">
            {/* Ping animation effect */}
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20 group-hover:opacity-40"></span>
            
            <Button 
              size="lg" 
              className="relative w-14 h-14 md:w-auto md:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center md:px-6"
            >
              <Gift className="w-6 h-6 md:mr-2 animate-bounce-slow" />
              <span className="hidden md:inline font-black tracking-tight">Gift Cards</span>
            </Button>
          </div>
        </Link>
      )}

      {/* Floating Search & Filters */}
      <div className={`sticky top-20 z-30 transition-all duration-300 px-4 max-w-3xl mx-auto -mt-16 mb-6 ${isScrolled ? 'top-4 drop-shadow-2xl' : ''}`}>
        <div className="glass-card rounded-2xl p-1.5 flex items-center gap-2 border border-white/20 dark:border-white/10">
          <div className="relative flex-1">
            <input
              id="mobile-search"
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-10 pl-11 pr-4 rounded-xl bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground font-medium text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-2 pr-2">
            <Select 
              value={category} 
              onValueChange={updateCategory}
            >
              <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs bg-muted/50 border-0 focus:ring-1 focus:ring-primary/20">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-glass">
                {categoriesList.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-sm py-2">
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
      </div>

      {/* Selected Category Indicator */}
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