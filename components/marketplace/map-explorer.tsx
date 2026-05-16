"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import MapGL, { Marker, NavigationControl, Popup, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { getNearbyStores, searchProductsGeo } from "@/app/actions/map";
import { useDebounce } from "use-debounce";
import { formatDistance } from "@/lib/haversine";
import { Search, MapPin, Navigation, LocateFixed, ArrowLeft, Loader2, Store, Sun, Moon, Maximize, Minimize, Layers, Package, ZoomIn, ZoomOut, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMapStyle, MapStyleKey } from "@/hooks/use-map-style";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const DEFAULT_CENTER = { lat: -16.5, lng: -68.15 };

export function MapExplorer() {
  const router = useRouter();
  const { mapStyle, styleKey, theme, toggleTheme, setManualStyle } = useMapStyle();
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const mapRef = React.useRef<MapRef>(null);

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleFullscreen = React.useCallback(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const searchParams = useSearchParams();
  const [radius, setRadius] = useState<number>(parseInt(searchParams.get("r") || "50")); 
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedSearch] = useDebounce(searchQuery, 800);
  
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.lng,
    latitude: DEFAULT_CENTER.lat,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  const fetchUserLocation = useCallback((manual = false) => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      setUserLocation(DEFAULT_CENTER);
      return;
    }
    if (manual) {
      toast.info("Obteniendo tu ubicación...");
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });
        setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng, zoom: 16 }));
        if (manual) toast.success("Ubicación actualizada.");
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permiso de ubicación denegado. Actívalo en la configuración de tu navegador.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.warning("Señal de GPS débil. Activa la ubicación de alta precisión en tu dispositivo.");
        } else {
          toast.warning("No pudimos obtener tu ubicación exacta, mostrando ubicación general.");
        }
        if (!userLocation) setUserLocation(DEFAULT_CENTER);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get user location on mount
  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!userLocation) return;
      setIsLoading(true);
      setSelectedItem(null);
      
      try {
        if (debouncedSearch.trim() === "") {
          const fetchedStores = await getNearbyStores(userLocation.lat, userLocation.lng, radius);
          setStores(fetchedStores);
          setProducts([]);
        } else {
          const fetchedProducts = await searchProductsGeo(debouncedSearch, userLocation.lat, userLocation.lng, radius);
          setProducts(fetchedProducts);
          setStores([]);
        }
      } catch (error) {
        console.error("Failed to fetch map data", error);
        toast.error("Error al cargar los datos del mapa.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [userLocation, radius, debouncedSearch]);

  const handleDirections = async (lat: number, lng: number) => {
    const dest = `${lat},${lng}`;
    
    // Si no tenemos la ubicación, intentamos obtenerla antes de abrir el mapa
    let currentOrigin = userLocation ? `${userLocation.lat},${userLocation.lng}` : null;
    
    if (!currentOrigin) {
      toast.info("Obteniendo tu ubicación para trazar la ruta...");
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true, 
            timeout: 5000 
          });
        });
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        currentOrigin = `${loc.lat},${loc.lng}`;
      } catch (error) {
        console.warn("Could not get location for directions, defaulting to My Location");
        currentOrigin = 'My+Location';
      }
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin}&destination=${dest}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const isProductSearch = debouncedSearch.trim() !== "";
  
  // Group products by store to show them together on the map
  const productsByStore = useMemo(() => {
    if (!isProductSearch) return [];
    
    const storeMap = new Map<string, any>();
    products.forEach(p => {
      const sId = p.store.id;
      if (!storeMap.has(sId)) {
        storeMap.set(sId, {
          store: p.store,
          distance: p.distance,
          products: []
        });
      }
      storeMap.get(sId).products.push(p);
    });
    
    return Array.from(storeMap.values());
  }, [products, isProductSearch]);

  const handleFocusAll = useCallback(() => {
    if (!mapRef.current) return;
    
    const coords: [number, number][] = [];
    if (isProductSearch) {
      productsByStore.forEach(g => coords.push([g.store.longitude, g.store.latitude]));
    } else {
      stores.forEach(s => coords.push([s.longitude, s.latitude]));
    }
    
    if (userLocation) coords.push([userLocation.lng, userLocation.lat]);
    if (coords.length === 0) return;

    const bounds = coords.reduce(
      (acc, coord) => [
        [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
        [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])],
      ],
      [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]
    );

    mapRef.current.fitBounds(bounds as [[number, number], [number, number]], {
      padding: 100,
      duration: 1000
    });
  }, [stores, productsByStore, isProductSearch, userLocation]);

  const renderMarkers = () => {
    if (isProductSearch) {
      return productsByStore.map((group: any) => (
        <Marker
          key={group.store.id}
          longitude={group.store.longitude as number}
          latitude={group.store.latitude as number}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedItem({ type: 'store_products', data: group });
          }}
        >
          <div className="relative flex flex-col items-center group cursor-pointer">
            {/* Glow / Aura */}
            <div className="absolute -inset-3 bg-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* The Pin/Beacon */}
            <div className="relative mb-1 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border-2 border-purple-600 dark:border-purple-500 shadow-xl flex items-center justify-center overflow-hidden rotate-45 relative z-10">
                <div className="-rotate-45 w-full h-full flex items-center justify-center">
                  {group.store.logoUrl ? (
                    <img src={group.store.logoUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Store className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
              </div>
              
              {/* Product Count Badge */}
              <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-20">
                {group.products.length}
              </div>
              
              {/* Pin Point */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-600 dark:bg-purple-500 rotate-45 z-0" />
            </div>
          </div>
        </Marker>
      ));
    } else {
      return stores.map((store) => (
        <Marker
          key={store.id}
          longitude={store.longitude as number}
          latitude={store.latitude as number}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedItem({ type: 'store', data: store });
          }}
        >
          <div className="relative flex flex-col items-center group cursor-pointer">
            {/* Glow / Aura */}
            <div className="absolute -inset-3 bg-blue-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* The Pin/Beacon */}
            <div className="relative mb-1 transition-transform duration-300 group-hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border-2 border-blue-600 dark:border-blue-500 shadow-xl flex items-center justify-center overflow-hidden rotate-45 relative z-10">
                <div className="-rotate-45 w-full h-full flex items-center justify-center">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>
              
              {/* Pin Point */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 dark:bg-blue-500 rotate-45 z-0" />
            </div>
          </div>
        </Marker>
      ));
    }
  };

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] flex flex-col md:flex-row bg-background overflow-hidden border-t">
      
      {/* ─── SIDEBAR / LIST ─── */}
      <div className="w-full md:w-[380px] lg:w-[420px] h-[60dvh] md:h-full bg-card border-r border-border shadow-xl z-10 flex flex-col order-2 md:order-1">
        <div className="p-3 md:p-4 border-b space-y-2 md:space-y-3 bg-muted/30">
          <button
            onClick={() => router.back()}
            className="hidden md:flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-bold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          
          <h1 className="hidden md:flex text-2xl font-black tracking-tight items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            Explorar
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos o tiendas..."
              className="pl-9 h-9 md:h-11 rounded-xl bg-background border-border/60 text-xs md:text-sm"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>
          
          <div className="flex gap-1 md:gap-2 items-center overflow-x-auto no-scrollbar">
            <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase shrink-0">Radio:</span>
            {[5, 10, 25, 50, 0].map(r => (
              <Button
                key={r}
                variant={radius === r ? "default" : "outline"}
                size="sm"
                className={`h-6 md:h-7 text-[9px] md:text-[10px] uppercase font-black rounded-full px-2 md:px-3 shrink-0 ${radius === r ? 'bg-blue-600' : ''}`}
                onClick={() => setRadius(r)}
              >
                {r === 0 ? "Todo" : `${r}km`}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : isProductSearch ? (
            products.length > 0 ? (
              products.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-background border rounded-2xl p-3 flex gap-3 hover:border-purple-400 transition-colors shadow-sm cursor-pointer"
                  onClick={() => {
                    setViewState((prev) => ({ 
                      ...prev, 
                      latitude: product.store.latitude, 
                      longitude: product.store.longitude, 
                      zoom: 16 
                    }));
                    
                    const group = productsByStore.find(g => g.store.id === product.store.id);
                    if (group) {
                      setSelectedItem({ type: 'store_products', data: group });
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-xl bg-muted shrink-0 overflow-hidden">
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Store className="w-3 h-3" /> {product.store.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-black text-sm">Bs. {product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta}</span>
                      <Badge variant="secondary" className="text-[10px] rounded-md h-5 px-1.5 font-bold">
                        {formatDistance(product.distance)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-bold text-sm">No se encontraron productos.</p>
              </div>
            )
          ) : (
            stores.length > 0 ? (
              stores.map((store) => (
                <div 
                  key={store.id} 
                  className="bg-background border rounded-2xl p-3 flex gap-3 hover:border-blue-400 transition-colors cursor-pointer shadow-sm"
                  onClick={() => {
                    setViewState((prev) => ({ 
                      ...prev, 
                      longitude: store.longitude as number, 
                      latitude: store.latitude as number, 
                      zoom: 15 
                    }));
                    setSelectedItem({ type: 'store', data: store });
                  }}
                >
                  <div className="w-16 h-16 rounded-xl bg-muted shrink-0 overflow-hidden">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-xl">
                        {store.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm truncate">{store.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{store.address}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Link href={`/tienda/${store.id}`} className="text-[10px] font-bold text-blue-600 hover:underline">
                        Ver tienda
                      </Link>
                      <Badge variant="secondary" className="text-[10px] rounded-md h-5 px-1.5 font-bold text-blue-600 bg-blue-50">
                        {formatDistance(store.distance)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Store className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-bold text-sm">No se encontraron tiendas cercanas.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ─── MAP LAYER ─── */}
      <div ref={mapContainerRef} className="flex-none md:flex-1 relative order-1 md:order-2 h-[40dvh] md:h-full">
        <MapGL
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle={mapStyle}
          dragRotate={true}
          touchZoomRotate={true}
          pitchWithRotate={true}
          attributionControl={false}
        >
          {/* Custom Navigation Controls (Top Left) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            <button
              type="button"
              onClick={() => {
                mapRef.current?.zoomIn();
              }}
              className="w-9 h-9 bg-white dark:bg-zinc-900 rounded-t-xl border border-border/50 shadow-premium flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => {
                mapRef.current?.zoomOut();
              }}
              className="w-9 h-9 bg-white dark:bg-zinc-900 border-x border-b border-border/50 shadow-premium flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              title="Disminuir zoom"
            >
              <ZoomOut className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => {
                mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 1000 });
              }}
              className="w-9 h-9 mt-1 bg-white dark:bg-zinc-900 rounded-b-xl border border-border/50 shadow-premium flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
              title="Restablecer orientación"
            >
              <Compass 
                className="w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-300" 
                style={{ transform: `rotate(${-(viewState.bearing || 0)}deg)` }}
              />
            </button>
          </div>
          
          {/* Unified Map Tools (Top Right) */}
          <div className="absolute top-3 right-2.5 flex flex-col gap-2 z-10">
            {/* Locate Me button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); fetchUserLocation(true); }}
              disabled={isLocating}
              className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
              title="Mi ubicación"
            >
              {isLocating
                ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                : <LocateFixed className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              }
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              title={theme === "light" ? "Modo oscuro del mapa" : "Modo claro del mapa"}
            >
              {theme === "light" 
                ? <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                : <Sun className="w-4 h-4 text-yellow-500" />
              }
            </button>

            {/* Layer switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors outline-none"
                  title="Cambiar capa del mapa"
                >
                  <Layers className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="left" className="rounded-2xl shadow-premium border-white/20 dark:border-white/10 p-1.5 min-w-[140px] z-100 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">Estilos de Mapa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setManualStyle('positron')}
                  className={cn("rounded-xl text-xs font-bold gap-2 px-3 py-2 cursor-pointer", styleKey === 'positron' && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-200" /> Positron (Claro)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setManualStyle('dark')}
                  className={cn("rounded-xl text-xs font-bold gap-2 px-3 py-2 cursor-pointer", styleKey === 'dark' && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-900" /> Oscuro
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setManualStyle('liberty')}
                  className={cn("rounded-xl text-xs font-bold gap-2 px-3 py-2 cursor-pointer", styleKey === 'liberty' && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" /> Liberty (Color)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setManualStyle('bright')}
                  className={cn("rounded-xl text-xs font-bold gap-2 px-3 py-2 cursor-pointer", styleKey === 'bright' && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400")}
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-400" /> Brillante
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={handleFullscreen}
              className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen
                ? <Minimize className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                : <Maximize className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              }
            </button>
          </div>
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative z-10"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full absolute top-0 left-0 animate-ping opacity-75"></div>
              </div>
            </Marker>
          )}

          {renderMarkers()}

          {/* Popup */}
          {selectedItem && (
            <Popup
              longitude={selectedItem.data.store?.longitude || selectedItem.data.longitude}
              latitude={selectedItem.data.store?.latitude || selectedItem.data.latitude}
              anchor="bottom"
              onClose={() => setSelectedItem(null)}
              closeButton={true}
              closeOnClick={false}
              offset={25}
              className="rounded-2xl overflow-hidden z-50"
              maxWidth="320px"
            >
              <div className="p-2 pt-2">
                {selectedItem.type === 'store' ? (
                  <div className="space-y-2 bg-background text-foreground">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border shadow-sm">
                        {selectedItem.data.logoUrl ? (
                          <img src={selectedItem.data.logoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-xs">
                            {selectedItem.data.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base leading-tight truncate">{selectedItem.data.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{selectedItem.data.address}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button 
                        onClick={() => handleDirections(selectedItem.data.latitude, selectedItem.data.longitude)}
                        className="flex-1 h-8 text-[10px] uppercase tracking-wider rounded-lg bg-blue-600 font-bold"
                        size="sm"
                      >
                        Cómo llegar
                      </Button>
                      <Link href={`/tienda/${selectedItem.data.id}`} className="flex-1">
                        <Button variant="outline" className="w-full h-8 text-[10px] uppercase tracking-wider rounded-lg font-bold" size="sm">
                          Ver tienda
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-background text-foreground">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 border border-border shadow-sm">
                        {selectedItem.data.store.logoUrl ? (
                          <img src={selectedItem.data.store.logoUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-black text-[10px]">
                            {selectedItem.data.store.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-purple-700 leading-tight truncate">
                          {selectedItem.data.store.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate">Encontrados en esta tienda</p>
                      </div>
                    </div>

                    <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {selectedItem.data.products.map((p: any) => (
                        <div key={p.id} className="flex gap-2 items-center bg-muted/30 p-1.5 rounded-lg border">
                          {p.imageUrls?.[0] && (
                            <img src={p.imageUrls[0]} alt={p.name} className="w-8 h-8 rounded-md object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{p.name}</p>
                            <p className="font-black text-[10px] text-green-600">Bs. {p.comercialConfig?.precioOferta || p.comercialConfig?.precioVenta}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handleDirections(selectedItem.data.store.latitude, selectedItem.data.store.longitude)}
                      className="w-full h-8 text-[10px] uppercase tracking-wider rounded-lg bg-purple-600 hover:bg-purple-700 text-white mt-1 font-bold shadow-lg shadow-purple-500/20"
                      size="sm"
                    >
                      Ir a comprar
                    </Button>
                  </div>
                )}
              </div>
            </Popup>
          )}
        </MapGL>
      </div>
    </div>
  );
}
