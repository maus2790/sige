"use client";

import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, ShoppingBag, Store, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProducts } from "@/app/actions/storefront";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface StoreData {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  verified: boolean | null;
  rating: number | null;
}

interface StoreFeedProps {
  store: StoreData;
  initialProducts: any[];
}

export function StoreFeed({ store, initialProducts }: StoreFeedProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialProducts.length === 20);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage]);

  const loadMore = async () => {
    setIsFetchingNextPage(true);
    const nextPage = page + 1;
    const newProducts = await getStoreProducts(store.id, nextPage);
    
    if (newProducts.length < 20) {
      setHasNextPage(false);
    }
    
    setProducts([...products, ...newProducts]);
    setPage(nextPage);
    setIsFetchingNextPage(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Store Header */}
      <div className="relative overflow-hidden bg-brand-gradient text-white pb-20 pt-16 px-4 shadow-premium rounded-b-[2.5rem] md:rounded-b-[4rem] mb-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-white/20 shadow-2xl mb-6 bg-white/10 backdrop-blur-md">
            <AvatarImage src={store.logoUrl || ""} alt={store.name} />
            <AvatarFallback className="text-3xl font-black bg-white/20">
              {store.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-lg">
              {store.name}
            </h1>
            {store.verified && (
              <Badge className="bg-blue-500 text-white border-none text-[10px] uppercase font-black px-2 py-0.5 shadow-lg">
                Verificada
              </Badge>
            )}
          </div>
          
          <p className="text-blue-50 max-w-2xl mx-auto font-medium mb-6 line-clamp-2">
            {store.description || "Bienvenidos a nuestra tienda oficial en SIGE Mercado."}
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            {store.address && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                <MapPin className="w-4 h-4" />
                {store.address}
              </div>
            )}
            {store.phone && (
              <div className="flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                <Phone className="w-4 h-4" />
                {store.phone}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
              <Package className="w-4 h-4" />
              {products.length}+ Productos
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-1.5 bg-primary rounded-full"></div>
          <h2 className="text-2xl font-black tracking-tight">Catálogo de Productos</h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Sin productos</h3>
            <p className="text-muted-foreground">Esta tienda aún no tiene productos publicados.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Loader */}
            <div ref={ref} className="flex justify-center py-12">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 px-6 py-3 bg-card border rounded-full shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-bold text-muted-foreground">Cargando...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
