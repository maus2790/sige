"use client";

import { useInView } from "react-intersection-observer";
import { useMemo, useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-card-skeleton";
import { Loader2, Package, ShoppingCart, Store, Save, X, Palette, CheckCircle2, MapPin, Phone, Search, Plus, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreProducts, getStoreDrafts, refreshStoreFeed } from "@/app/actions/storefront";
import { RefreshButton } from "@/components/marketplace/refresh-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { StoreCustomizer } from "@/components/tienda/store-customizer";
import { ArrowLeft, Settings, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { StoreMap } from "@/components/tienda/store-map";
import { getCurrentUser } from "@/app/actions/auth";
import { getPremiumThemeColor, isPremiumTheme, PremiumTheme, usePremiumTheme } from "@/hooks/use-premium-theme";

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
  latitude?: number | null;
  longitude?: number | null;
  themeConfig?: string | null;
}

interface StoreFeedProps {
  store: StoreData;
  initialProducts: any[];
  myUserId?: string | null;
  categories?: any[];
}

export function StoreFeed({ store, initialProducts, myUserId, categories = [] }: StoreFeedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { premiumTheme } = usePremiumTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(myUserId ?? null);
  const [storeThemeOverride, setStoreThemeOverride] = useState<PremiumTheme | null>(null);

  useEffect(() => {
    // If myUserId is not provided (e.g. static generation / ISR mode), fetch current user on client
    if (!myUserId) {
      getCurrentUser()
        .then((user) => {
          if (user?.id) {
            setCurrentUserId(user.id);
          }
        })
        .catch((err) => {
          console.error("Error fetching current user on client:", err);
        });
    }
  }, [myUserId]);
  
  // Determine ownership client-side so the server component doesn't need getCurrentUser()
  const isOwner = !!currentUserId && currentUserId === store.userId;

  const isSystemGradient = store.bannerUrl?.startsWith('gradient:');
  const customBannerUrl = store.bannerUrl && !isSystemGradient ? store.bannerUrl : null;
  const savedStoreTheme = useMemo(() => {
    if (!store.themeConfig) return null;

    try {
      const parsed = JSON.parse(store.themeConfig);
      const theme = typeof parsed === "string" ? parsed : parsed?.premiumTheme;
      return isPremiumTheme(theme) ? theme : null;
    } catch {
      return isPremiumTheme(store.themeConfig) ? store.themeConfig : null;
    }
  }, [store.themeConfig]);
  const effectiveStoreTheme: PremiumTheme = storeThemeOverride ?? savedStoreTheme ?? (isOwner ? premiumTheme : "blue");
  const storeThemeClass = effectiveStoreTheme === "blue" ? "" : `theme-premium theme-${effectiveStoreTheme}`;

  useEffect(() => {
    const themeClasses = [
      "theme-premium",
      "theme-gold",
      "theme-black",
      "theme-rose",
      "theme-emerald",
      "theme-purple",
      "theme-ocean",
      "theme-sunset",
      "theme-cyan",
      "theme-ruby",
    ];

    document.body.classList.remove(...themeClasses);
    if (effectiveStoreTheme !== "blue") {
      document.body.classList.add("theme-premium", `theme-${effectiveStoreTheme}`);
    }
    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeColorMeta?.content;
    if (themeColorMeta) {
      themeColorMeta.content = getPremiumThemeColor(effectiveStoreTheme);
    }

    window.dispatchEvent(
      new CustomEvent("sige-store-theme-change", {
        detail: { theme: effectiveStoreTheme, active: true },
      })
    );

    return () => {
      document.body.classList.remove(...themeClasses);
      if (themeColorMeta && previousThemeColor) {
        themeColorMeta.content = previousThemeColor;
      }
      window.dispatchEvent(
        new CustomEvent("sige-store-theme-change", {
          detail: { theme: "blue", active: false },
        })
      );
    };
  }, [effectiveStoreTheme]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("todos");
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const categoriesList = [
    { value: "todos", label: "Todos", icon: "âœ¨" },
    ...categories.map(c => ({ value: c.name, label: c.name, icon: c.icon }))
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const refreshData = () => {
      if (isOwner) {
        getStoreDrafts(store.id, debouncedSearch, category !== "todos" ? category : undefined).then(setDrafts);
      }
      queryClient.invalidateQueries({ queryKey: ["store-products", store.id] });
    };

    if (isOwner) {
      refreshData();
    }

    window.addEventListener('product-status-changed', refreshData);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener('product-status-changed', refreshData);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOwner, store.id, queryClient, debouncedSearch, category]);

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading,
    refetch
  } = useStoreInfiniteScroll({ 
    storeId: store.id, 
    initialData: initialProducts,
    search: debouncedSearch,
    category: category !== "todos" ? category : undefined
  });

  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log("[StoreFeed] Global refresh event received.");
      refetch();
    };
    window.addEventListener("sige-refresh-feed", handleGlobalRefresh);
    return () => window.removeEventListener("sige-refresh-feed", handleGlobalRefresh);
  }, [refetch]);

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
  const showComplexLayout = !!(store.latitude && store.longitude && (products.length > 0 || isOwner));

  return (
    <div className={cn("store-theme-scope min-h-screen bg-background pb-24", storeThemeClass)}>
      {/* â”€â”€â”€ PREMIUM STORE HEADER â”€â”€â”€ */}
      <div className="relative">
        <div className={cn(
          "store-hero relative overflow-hidden rounded-b-[3rem] shadow-xl text-white",
          customBannerUrl
            ? "h-70 md:h-87.5"
            : "bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900 pb-20 pt-16 md:pb-24 md:pt-20"
        )}>
          
          {/* Banner Background */}
          {customBannerUrl ? (
            <>
              <img src={customBannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
              {/* Minimal glass for custom images */}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            </>
          ) : (
            <>
              <div className="store-hero-texture absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              {/* Standard glass for gradients */}
              <div className="absolute inset-0 bg-black/20 backdrop-blur-md" />
            </>
          )}

          <div className="relative z-10 max-w-5xl mx-auto px-4 h-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Top Navigation / Actions */}
            <div className="absolute top-6 left-4 right-4 flex items-center justify-between">
              <button
                onClick={() => router.push('/')}
                className="store-hero-control flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="store-hero-control w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all text-white shadow-lg cursor-pointer"
                    title="Personalizar tienda"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="relative group">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 rounded-4xl border-4 border-white/30 shadow-2xl mb-6 bg-white/10 backdrop-blur-md transition-transform group-hover:scale-105">
                <AvatarImage src={store.logoUrl || ""} alt={store.name} className="object-cover" />
                <AvatarFallback className="store-default-logo text-3xl font-black text-blue-600 bg-white">
                  {store.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {store.verified && (
                <div className="store-verified-badge absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center border-4 border-white shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight drop-shadow-xl text-white mb-3">
                {store.name}
              </h1>
              
              <p className="store-hero-copy text-blue-50/90 text-sm md:text-base font-medium mb-6 line-clamp-2 drop-shadow-md">
                {store.description || "Bienvenidos a nuestra tienda oficial en SIGE Mercado."}
              </p>

              <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm font-bold">
                {store.address && (
                  <div className="store-hero-chip flex items-center gap-1.5 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/10">
                    <MapPin className="w-3.5 h-3.5" />
                    {store.address}
                  </div>
                )}
                {store.phone && (
                  <div className="store-hero-chip flex items-center gap-1.5 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/10">
                    <Phone className="w-3.5 h-3.5" />
                    {store.phone}
                  </div>
                )}
                <div className="store-hero-chip flex items-center gap-1.5 px-4 py-2 bg-white/15 rounded-full backdrop-blur-md border border-white/10">
                  <Package className="w-3.5 h-3.5" />
                  {products.length}+ Productos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ SEARCH & ACTIONS BAR â”€â”€â”€ */}
      <div className={`sticky top-16 z-40 transition-all duration-300 px-4 w-full max-w-6xl mx-auto -mt-6 mb-8 ${isScrolled ? 'drop-shadow-2xl' : ''}`}>
        <div className="flex items-center gap-3">
          
          {/* BotÃ³n AÃ‘ADIR PRODUCTO (Solo DueÃ±o) */}
          {isOwner && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-publish-modal'))}
              className="market-action store-action hidden md:flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-black text-xs shadow-xl dark:shadow-[0_0_15px_rgba(37,99,235,0.4)] border-2 border-blue-300 dark:border-blue-400/50 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all shrink-0 uppercase tracking-wider btn-shine cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              AÃ±adir Producto
            </button>
          )}
          {/* BotÃ³n ACTUALIZAR (Refresh) */}
          <div className="hidden lg:flex">
            <RefreshButton 
              refreshAction={() => refreshStoreFeed(store.id)} 
              onRefresh={() => refetch()} 
              className="market-action store-action h-12 px-6 rounded-2xl bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 font-black text-xs shadow-xl dark:shadow-[0_0_15px_rgba(168,85,247,0.4)] border-2 border-purple-300 dark:border-purple-400/50 hover:bg-purple-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all uppercase tracking-wider btn-shine"
              iconClassName="h-5 w-5 text-purple-600 dark:text-purple-400"
              labelClassName="font-black"
            />
          </div>


          {/* Buscador Central (Market Style) */}
          <div className="market-search-shell store-search-shell glass-card flex-1 rounded-2xl p-1 flex items-center border border-zinc-300 dark:border-white/40 shadow-xl dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] backdrop-blur-xl bg-white dark:bg-zinc-900/90 btn-shine">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Â¿QuÃ© estÃ¡s buscando en esta tienda?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-11 pr-4 rounded-xl bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-bold text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            
            <div className="hidden sm:flex items-center pr-1">
              <Select 
                value={category} 
                onValueChange={setCategory}
              >
                <SelectTrigger className="h-9 w-30 rounded-xl text-[10px] font-black uppercase bg-transparent border border-border focus:ring-0">
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


        </div>
      </div>

      {/* Filtro Activo Badge */}
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
                onClick={() => setCategory("todos")}
                className="w-5 h-5 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">Filtro activo</span>
          </div>
        </div>
      )}

      {/* Store Map (Standalone for Mobile or simple layout) */}
      {store.latitude && store.longitude && (
        <div className={cn(
          "max-w-7xl mx-auto px-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
          showComplexLayout && "md:hidden"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="store-section-accent h-8 w-1.5 rounded-full bg-emerald-500"></div>
            <h2 className="text-xl font-black tracking-tight">UbicaciÃ³n</h2>
          </div>
          <StoreMap 
            latitude={store.latitude} 
            longitude={store.longitude} 
            storeName={store.name} 
            storeAddress={store.address || undefined} 
            logoUrl={store.logoUrl}
          />
        </div>
      )}

      {/* Grid de Productos */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
          {/* Header: use same grid so titles align perfectly with their content below */}
          {showComplexLayout ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-6">
            {/* Products title â€” spans same cols as the product cards */}
            <div className={cn(
              "col-span-2 flex items-center justify-between",
              products.length === 1 && !isOwner && "md:col-span-1"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("store-section-accent h-10 w-1.5 rounded-full", searchTerm ? "bg-purple-600" : "bg-blue-600")}></div>
                <h2 className="text-2xl font-black tracking-tight">
                  {searchTerm || category !== "todos" ? "Resultados de bÃºsqueda" : "Productos Publicados"}
                </h2>
              </div>
              {/* Badge only on mobile (desktop badge is below) */}
              <Badge variant="outline" className="md:hidden rounded-full px-3 border-muted-foreground/20 text-muted-foreground font-bold text-xs">
                {products.length} {products.length === 1 ? 'Item' : 'Items'}
              </Badge>
            </div>

            {/* Map title â€” spans same cols as the map, hidden on mobile */}
            <div className={cn(
              "hidden md:flex items-center justify-between",
              products.length === 1 && !isOwner
                ? "md:col-span-2 lg:col-span-3 xl:col-span-4"
                : "md:col-span-1 lg:col-span-2 xl:col-span-3"
            )}>
              <div className="flex items-center gap-3">
                <div className="store-section-accent h-10 w-1.5 rounded-full bg-emerald-500"></div>
                <h2 className="text-2xl font-black tracking-tight">UbicaciÃ³n de la Tienda</h2>
              </div>
              <Badge variant="outline" className="rounded-full px-3 border-muted-foreground/20 text-muted-foreground font-bold text-xs">
                {products.length} {products.length === 1 ? 'Item' : 'Items'}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={cn("store-section-accent h-10 w-1.5 rounded-full", searchTerm ? "bg-purple-600" : "bg-blue-600")}></div>
              <h2 className="text-2xl font-black tracking-tight">
                {searchTerm || category !== "todos" ? "Resultados de bÃºsqueda" : "Productos Publicados"}
              </h2>
            </div>
            <Badge variant="outline" className="rounded-full px-4 border-muted-foreground/20 text-muted-foreground font-bold">
              {products.length} {products.length === 1 ? 'Item' : 'Items'}
            </Badge>
          </div>
        )}

        {isLoading ? (
          <ProductGridSkeleton count={10} />
        ) : products.length === 0 && !isOwner ? (
          <div className="text-center py-24 bg-card rounded-4xl border border-dashed border-muted-foreground/20">
            <div className="w-20 h-20 bg-muted rounded-4xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold">
              {searchTerm ? "Sin resultados" : "Sin productos"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "No encontramos productos que coincidan con tu bÃºsqueda." 
                : "Esta tienda aÃºn no tiene productos publicados."}
            </p>
          </div>
        ) : (
          <>
            <div className="store-products-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {/* Primeros 2 productos reales */}
              {products.slice(0, 2).map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <ProductCard product={product} isStoreOwner={isOwner} />
                </div>
              ))}

              {/* CTA placeholder cards para dueÃ±os con menos de 2 productos */}
              {isOwner && products.length < 2 && Array.from({ length: 2 - products.length }).map((_, i) => {
                const labels = products.length === 0
                  ? ["tu primer producto", "tu segundo producto"]
                  : ["tu segundo producto"];
                return (
                  <button
                    key={`cta-slot-${i}`}
                    onClick={() => window.dispatchEvent(new CustomEvent('open-publish-modal'))}
                    className="store-add-placeholder group relative rounded-4xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-4 p-6 min-h-60 animate-in fade-in shadow-lg hover:shadow-2xl dark:shadow-[0_0_20px_rgba(37,99,235,0.05)] dark:hover:shadow-[0_0_35px_rgba(37,99,235,0.15)]"
                    style={{ animationDelay: `${(products.length + i) * 80}ms` }}
                  >
                    <div className="store-add-placeholder-icon w-14 h-14 rounded-2xl bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 flex items-center justify-center transition-colors shadow-inner">
                      <Plus className="store-add-placeholder-symbol w-7 h-7 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-black text-sm text-muted-foreground group-hover:text-blue-600 transition-colors uppercase tracking-wide">Publicar</p>
                      <p className="font-bold text-xs text-muted-foreground/70 group-hover:text-blue-500 transition-colors">{labels[i]}</p>
                    </div>
                    <div className="absolute inset-0 rounded-4xl ring-2 ring-inset ring-transparent group-hover:ring-blue-500/20 transition-all" />
                  </button>
                );
              })}

              {/* Mapa integrado en el grid (Solo Desktop y Layout Complejo) */}
              {showComplexLayout && (
                <div className={cn(
                  "hidden md:block animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200",
                  products.length === 1 && !isOwner
                    ? "md:col-span-2 lg:col-span-3 xl:col-span-4"
                    : "md:col-span-1 lg:col-span-2 xl:col-span-3"
                )}>
                  <StoreMap 
                    latitude={store.latitude!} 
                    longitude={store.longitude!} 
                    storeName={store.name} 
                    storeAddress={store.address || undefined} 
                    logoUrl={store.logoUrl}
                    className="h-75 md:h-87.5 lg:h-100"
                  />
                </div>
              )}

              {/* Resto de productos */}
              {products.slice(2).map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${((index + 2) % 10) * 50}ms` }}
                >
                  <ProductCard product={product} isStoreOwner={isOwner} />
                </div>
              ))}

              {/* Trailing CTA â€” visible para dueÃ±os con 2+ productos */}
              {isOwner && products.length >= 2 && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-publish-modal'))}
                  className="store-add-placeholder group relative rounded-4xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-4 p-6 min-h-60 animate-in fade-in shadow-lg hover:shadow-2xl dark:shadow-[0_0_20px_rgba(37,99,235,0.05)] dark:hover:shadow-[0_0_35px_rgba(37,99,235,0.15)]"
                >
                  <div className="store-add-placeholder-icon w-14 h-14 rounded-2xl bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 flex items-center justify-center transition-colors shadow-inner">
                    <Plus className="store-add-placeholder-symbol w-7 h-7 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="font-black text-sm text-muted-foreground group-hover:text-blue-600 transition-colors uppercase tracking-wide">Publicar producto</p>
                  <div className="absolute inset-0 rounded-4xl ring-2 ring-inset ring-transparent group-hover:ring-blue-500/20 transition-all" />
                </button>
              )}
            </div>

            {/* Infinite Scroll Loader */}
            <div ref={ref} className="flex justify-center py-6">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-card border rounded-full shadow-premium animate-bounce">
                  <Loader2 className="store-loader w-5 h-5 animate-spin text-blue-600" />
                  <span className="store-loader-text text-sm font-black text-blue-600 uppercase tracking-widest">Cargando catÃ¡logo...</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {isOwner && drafts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-4 mb-16">
          <div className="flex items-center justify-between mb-8 border-t pt-8 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 bg-yellow-500 rounded-full"></div>
              <h2 className="text-2xl font-black tracking-tight text-yellow-600 dark:text-yellow-500">
                {searchTerm || category !== "todos" ? "Borradores encontrados" : "Productos No Publicados (Borradores)"}
              </h2>
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

      {/* Store Settings Modal */}
      {isOwner && (
        <StoreCustomizer
          store={store}
          open={showSettings}
          onOpenChange={setShowSettings}
          onThemeChange={setStoreThemeOverride}
        />
      )}

    </div>
  );
}
