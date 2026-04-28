// components/productos/infinite-feed.tsx

"use client";

import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface InfiniteFeedProps {
  search?: string;
  initialCategories: Category[];
}

export function InfiniteFeed({ search: initialSearch = "", initialCategories }: InfiniteFeedProps) {
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState(initialSearch);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const categoriesList = [
    { value: "todos", label: "Todos los productos" },
    ...initialCategories.map(c => ({ value: c.name, label: c.name }))
  ];

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

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
    <div className="min-h-screen bg-linear-to-b from-white to-slate-50">
      {/* Header con búsqueda y filtros */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 focus:outline-none focus:border-primary transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl">
                <SheetHeader>
                  <SheetTitle>Filtrar productos</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesList.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setCategory("todos");
                      setSearch("");
                      setIsFilterOpen(false);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Aplicar
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Categorías rápidas (scroll horizontal) */}
      <div className="sticky top-[57px] z-10 bg-white border-b overflow-x-auto">
        <div className="container mx-auto px-4 py-2 flex gap-2">
          {categoriesList.slice(0, 10).map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat.value
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay productos</h3>
            <p className="text-muted-foreground">
              No encontramos productos que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Loader para scroll infinito */}
            <div ref={ref} className="flex justify-center py-8">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              )}
              {!hasNextPage && products.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Has llegado al final 🎉
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Navegación inferior (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t md:hidden z-30">
        <div className="flex justify-around items-center py-2">
          <a
            href="/"
            className="flex flex-col items-center gap-1 px-4 py-1 text-primary"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs">Inicio</span>
          </a>
          <a
            href="/search"
            className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs">Buscar</span>
          </a>
          <a
            href="/categories"
            className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span className="text-xs">Categorías</span>
          </a>
          <a
            href="/auth/login"
            className="flex flex-col items-center gap-1 px-4 py-1 text-muted-foreground"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs">Mi cuenta</span>
          </a>
        </div>
      </nav>

      {/* Espacio para navegación inferior en mobile */}
      <div className="h-16 md:h-0" />
    </div>
  );
}