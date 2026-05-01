"use client";

import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, Filter, Home, Search, Tags, ShoppingBag } from "lucide-react";
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
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState(initialSearch);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const categoriesList = [
    { value: "todos", label: "Todos", icon: "✨" },
    ...initialCategories.map(c => ({ value: c.name, label: c.name, icon: c.icon }))
  ];

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 drop-shadow-lg">
            Lo Mejor de Bolivia <br className="md:hidden" /> en tus Manos
          </h1>
          <p className="text-lg md:text-xl text-blue-50 mb-8 max-w-2xl mx-auto font-medium drop-shadow-sm">
            Descubre, explora y compra productos locales con total seguridad y envío a todo el país.
          </p>
        </div>
      </div>

      {/* Floating Search & Filters */}
      <div className={`sticky top-20 z-30 transition-all duration-300 px-4 max-w-3xl mx-auto -mt-16 mb-10 ${isScrolled ? 'top-4 drop-shadow-2xl' : ''}`}>
        <div className="glass-card rounded-2xl p-2 flex items-center gap-2 border border-white/20 dark:border-white/10">
          <div className="relative flex-1">
            <input
              id="mobile-search"
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="w-px h-8 bg-border hidden sm:block"></div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 hover:bg-accent hover:text-primary transition-colors">
                <Filter className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2rem] shadow-premium border-t-0 p-6 max-h-[85vh]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold">Filtros Avanzados</SheetTitle>
              </SheetHeader>
              <div className="py-2 space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 rounded-xl text-base bg-muted/50 border-0 focus:ring-2 focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-glass">
                      {categoriesList.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-base py-3 cursor-pointer">
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
              <SheetFooter className="pt-8 flex-col sm:flex-row gap-3 mt-auto">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl text-base font-semibold"
                  onClick={() => {
                    setCategory("todos");
                    setSearch("");
                    setIsFilterOpen(false);
                  }}
                >
                  Limpiar todo
                </Button>
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold bg-brand-gradient text-white border-0 shadow-md hover:shadow-lg transition-all"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Ver resultados
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Categorías Pills */}
      <div className="container mx-auto px-4 mb-10">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x">
          {categoriesList.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 snap-center border-2 flex items-center gap-2 ${
                category === cat.value
                  ? "bg-foreground text-background border-foreground shadow-md scale-105"
                  : "bg-card text-muted-foreground border-transparent hover:border-primary/20 hover:text-foreground shadow-sm"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

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

      {/* Navegación inferior flotante (Mobile) */}
      <nav className="fixed bottom-6 left-4 right-4 bg-background/85 backdrop-blur-xl border border-border shadow-glass rounded-full md:hidden z-40 overflow-visible transition-all duration-300">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-foreground active:scale-90 transition-transform"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none mt-1">Inicio</span>
          </button>
          
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setTimeout(() => {
                document.getElementById('mobile-search')?.focus();
              }, 400);
            }}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none mt-1">Buscar</span>
          </button>
          
          <div className="relative -top-6 flex items-center justify-center">
             <button
               onClick={() => {
                  setCategory("todos");
                  window.scrollTo({ top: 0, behavior: "smooth" });
               }}
               className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-gradient text-white shadow-premium hover:shadow-2xl active:scale-90 transition-all border-4 border-background ring-2 ring-primary/20 group"
             >
               <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
             </button>
          </div>
          
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
          >
            <Filter className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none mt-1">Filtros</span>
          </button>
          
          <button
            onClick={() => {
              window.scrollTo({ top: 300, behavior: "smooth" });
            }}
            className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
          >
            <Tags className="w-5 h-5" />
            <span className="text-[10px] font-bold leading-none mt-1">Tags</span>
          </button>
        </div>
      </nav>
    </div>
  );
}