"use client";

import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, ShoppingBag, Store, Save, X, Palette, CheckCircle2, MapPin, Phone, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProducts, getStoreDrafts } from "@/app/actions/storefront";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { useStoreInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { StoreCustomizer } from "@/components/tienda/store-customizer";
import { ArrowLeft, Settings, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface StoreData {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  phone: string | null;
  verified: boolean | null;
  rating: number | null;
}

interface StoreFeedProps {
  store: StoreData;
  initialProducts: any[];
  isOwner?: boolean;
}

export function StoreFeed({ store, initialProducts, isOwner = false }: StoreFeedProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);

  const SYSTEM_GRADIENTS: Record<string, string> = {
    'gradient:blue': 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900',
    'gradient:sunset': 'bg-linear-to-br from-orange-500 via-pink-500 to-purple-600',
    'gradient:emerald': 'bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700',
    'gradient:dark': 'bg-linear-to-br from-gray-900 via-slate-800 to-gray-900',
    'gradient:premium': 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900',
  };

  const isSystemGradient = store.bannerUrl?.startsWith('gradient:');
  const gradientClass = isSystemGradient ? SYSTEM_GRADIENTS[store.bannerUrl!] : 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900';
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isOwner) {
      getStoreDrafts(store.id).then(setDrafts);
    }
  }, [isOwner, store.id]);

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useStoreInfiniteScroll({ 
    storeId: store.id, 
    initialData: initialProducts,
    search: debouncedSearch
  });

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const products: any[] = data?.pages.flatMap((page: any) => page) || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ─── PREMIUM STORE HEADER ─── */}
      <div className="relative">
        <div className={`relative overflow-hidden ${store.bannerUrl && !isSystemGradient ? 'h-[280px] md:h-[350px]' : (isSystemGradient ? 'h-[280px] md:h-[350px] ' + gradientClass : 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900 pb-20 pt-16 md:pb-24 md:pt-20')} rounded-b-[3rem] shadow-xl text-white`}>
          
          {/* Banner Background */}
          {store.bannerUrl && !isSystemGradient ? (
            <>
              <img src={store.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              {/* Minimal glass for custom images */}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            </>
          ) : (
            <>
              {!isSystemGradient && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>}
              {/* Standard glass for gradients */}
              <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
            </>
          )}

          <div className="relative z-10 max-w-5xl mx-auto px-4 h-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Top Navigation / Actions */}
            <div className="absolute top-6 left-4 right-4 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-publish-modal'))}
                    className="hidden md:flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir Producto
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all text-white shadow-lg cursor-pointer"
                    title="Personalizar tienda"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="relative group">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-white/30 shadow-2xl mb-6 bg-white/10 backdrop-blur-md transition-transform group-hover:scale-105">
                <AvatarImage src={store.logoUrl || ""} alt={store.name} className="object-cover" />
                <AvatarFallback className="text-3xl font-black text-blue-600 bg-white">
                  {store.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {store.verified && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center border-4 border-white shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-xl text-white mb-3">
                {store.name}
              </h1>
              
              <p className="text-blue-50/90 text-sm md:text-base font-medium mb-6 line-clamp-2 drop-shadow-md">
                {store.description || "Bienvenidos a nuestra tienda oficial en SIGE Mercado."}
              </p>

              <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm font-bold">
                {store.address && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/10">
                    <MapPin className="w-3.5 h-3.5" />
                    {store.address}
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/10">
                    <Phone className="w-3.5 h-3.5" />
                    {store.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/10">
                  <Package className="w-3.5 h-3.5" />
                  {products.length}+ Productos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-16 z-40 px-4 w-full max-w-4xl mx-auto -mt-6 mb-8">
        <div className="glass-card w-full rounded-2xl p-1 flex items-center border border-zinc-300 dark:border-white/40 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-xl bg-white dark:bg-zinc-900/90 btn-shine">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar en esta tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-zinc-500 font-bold text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Drafts Section */}
      {isOwner && drafts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 bg-yellow-500 rounded-full"></div>
              <h2 className="text-2xl font-black tracking-tight text-yellow-600 dark:text-yellow-500">Productos No Publicados (Borradores)</h2>
            </div>
            <Badge variant="outline" className="rounded-full px-4 border-yellow-500/20 text-yellow-600 font-bold">
              {drafts.length} Items
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 opacity-80 hover:opacity-100 transition-opacity">
            {drafts.map((product: any, index: number) => (
              <div key={product.id}>
                <ProductCard product={product} isStoreOwner={isOwner} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1.5 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-black tracking-tight">Catálogo Exclusivo</h2>
          </div>
          <Badge variant="outline" className="rounded-full px-4 border-muted-foreground/20 text-muted-foreground font-bold">
            {products.length} Items
          </Badge>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-4xl border border-dashed border-muted-foreground/20">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">Sin productos</h3>
            <p className="text-muted-foreground">Esta tienda aún no tiene productos publicados.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <ProductCard product={product} isStoreOwner={isOwner} />
                </div>
              ))}
            </div>

            {/* Infinite Scroll Loader */}
            <div ref={ref} className="flex justify-center py-16">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-card border rounded-full shadow-premium animate-bounce">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Cargando catálogo...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Store Settings Modal */}
      {isOwner && (
        <StoreCustomizer 
          store={store} 
          open={showSettings} 
          onOpenChange={setShowSettings} 
        />
      )}
    </div>
  );
}
