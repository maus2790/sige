"use client";

import React, { useState, useCallback, useRef } from "react";
import Map, { Marker, NavigationControl, Popup, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation, LocateFixed, Loader2, Maximize, Minimize, Store, Sun, Moon, Layers, ZoomIn, ZoomOut, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

interface StoreMapProps {
  latitude: number;
  longitude: number;
  storeName: string;
  storeAddress?: string;
  logoUrl?: string | null;
  className?: string;
}

export function StoreMap({ latitude, longitude, storeName, storeAddress, logoUrl, className }: StoreMapProps) {
  const [showPopup, setShowPopup] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [viewState, setViewState] = useState({ longitude, latitude, zoom: 15, bearing: 0, pitch: 0 });
  const { mapStyle, styleKey, theme, toggleTheme, setManualStyle } = useMapStyle();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);

  const handleDirections = async () => {
    const dest = `${latitude},${longitude}`;
    
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

  const handleFocusStore = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 2000,
        essential: true
      });
      setTimeout(() => setShowPopup(true), 1000);
    } else {
      setViewState((prev) => ({ 
        ...prev, 
        latitude, 
        longitude, 
        zoom: 15
      }));
      setShowPopup(true);
    }
  }, [latitude, longitude]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setShowUserPopup(true);
        setViewState((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng, zoom: 15 }));
        toast.success("Ubicación encontrada.");
        setIsLocating(false);
      },
      () => {
        toast.error("No se pudo obtener la ubicación. Verifica los permisos.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full h-[300px] rounded-[32px] overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl dark:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-all duration-500", 
        className
      )}
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={mapStyle}
        interactiveLayerIds={[]}
      >
        {/* Custom Navigation Controls */}
        <div className="absolute bottom-6 right-3 flex flex-col gap-1 z-10">
          <button
            type="button"
            onClick={() => {
              mapRef.current?.zoomIn();
            }}
            className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-t-xl border border-border/50 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => {
              mapRef.current?.zoomOut();
            }}
            className="w-8 h-8 bg-white dark:bg-zinc-800 border-x border-b border-border/50 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title="Disminuir zoom"
          >
            <ZoomOut className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            onClick={() => {
              mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 1000 });
            }}
            className="w-8 h-8 mt-1 bg-white dark:bg-zinc-800 rounded-b-xl border border-border/50 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors group"
            title="Restablecer orientación"
          >
            <Compass 
              className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-300" 
              style={{ transform: `rotate(${-(viewState.bearing || 0)}deg)` }}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-2.5 flex flex-col gap-2 z-10">
          {/* Locate Me button */}
          <button
            type="button"
            onClick={handleLocate}
            disabled={isLocating}
            className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
            title="Mi ubicación"
          >
            {isLocating
              ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              : <LocateFixed className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            }
          </button>

          {/* Focus Store button */}
          <button
            type="button"
            onClick={handleFocusStore}
            className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            title="Ver tienda"
          >
            <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Theme toggle button */}
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

        {/* User location pulse */}
        {userLocation && (
          <>
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
              <div className="relative">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10" />
                <div className="w-4 h-4 bg-blue-500 rounded-full absolute top-0 left-0 animate-ping opacity-75" />
              </div>
            </Marker>
            {showUserPopup && (
              <Popup
                longitude={userLocation.lng}
                latitude={userLocation.lat}
                anchor="bottom"
                onClose={() => setShowUserPopup(false)}
                closeButton={false}
                offset={10}
                className="z-50"
              >
                <div className="px-2 py-0.5 font-black text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Yo
                </div>
              </Popup>
            )}
          </>
        )}

        {/* Store Marker - Premium Design */}
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <div
            className="relative flex flex-col items-center group cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowPopup(true);
            }}
          >
            {/* Pulsing effect */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-black/20 rounded-[100%] blur-[2px] group-hover:scale-150 transition-transform" />
            
            {/* Outer Glow / Aura */}
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse-slow opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* The Pin/Beacon */}
            <div className="relative mb-1 transition-transform duration-500 group-hover:-translate-y-2">
              {/* Main Badge */}
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border-4 border-blue-600 dark:border-blue-500 shadow-2xl flex items-center justify-center overflow-hidden rotate-45 relative z-10">
                <div className="-rotate-45 w-full h-full flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>
              
              {/* Pin Point */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 dark:bg-blue-500 rotate-45 z-0" />
              
              {/* Inner Pulse */}
              <div className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-20 z-0" />
            </div>
            
            {/* Store Label (Optional, shown on hover) */}
            <div className="absolute -top-10 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest shadow-xl">
              {storeName}
            </div>
          </div>
        </Marker>

        {showPopup && (
          <Popup
            longitude={longitude}
            latitude={latitude}
            anchor="bottom"
            onClose={() => setShowPopup(false)}
            closeButton={false}
            closeOnClick={false}
            offset={45}
            className="rounded-xl overflow-hidden"
            maxWidth="300px"
          >
            <div className="p-2 flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} className="w-full h-full object-cover" alt={storeName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-black text-[10px]">
                      {storeName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-sm leading-tight truncate">{storeName}</h3>
                  {storeAddress && (
                    <p className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">{storeAddress}</p>
                  )}
                </div>
              </div>

              <Button
                onClick={handleDirections}
                className="w-full h-8 mt-1 text-[10px] uppercase font-bold tracking-wider rounded-lg gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                size="sm"
              >
                <Navigation className="w-3 h-3" />
                Cómo llegar
              </Button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
