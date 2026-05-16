"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Search, Navigation, LocateFixed, Maximize, Minimize, Sun, Moon, ZoomIn, ZoomOut, Compass, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMapStyle } from "@/hooks/use-map-style";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface LocationPickerMapProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
  mapClassName?: string;
}

const DEFAULT_CENTER = { lat: -16.5, lng: -68.15 };

export function LocationPickerMap({
  initialLatitude,
  initialLongitude,
  onLocationChange,
  className,
  mapClassName,
}: LocationPickerMapProps) {
  const { mapStyle, styleKey, theme, toggleTheme, setManualStyle } = useMapStyle();
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLatitude && initialLongitude
      ? { lat: initialLatitude, lng: initialLongitude }
      : null
  );
  const [viewState, setViewState] = useState({
    longitude: initialLongitude || DEFAULT_CENTER.lng,
    latitude: initialLatitude || DEFAULT_CENTER.lat,
    zoom: initialLatitude && initialLongitude ? 14 : 5,
    bearing: 0,
    pitch: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 1000);
  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen API
  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Nominatim geocoding
  useEffect(() => {
    async function performSearch() {
      if (!debouncedSearch || debouncedSearch.length < 3) return;
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedSearch)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);
          setViewState((prev) => ({ ...prev, latitude: newLat, longitude: newLng, zoom: 15 }));
          setMarker({ lat: newLat, lng: newLng });
          onLocationChange(newLat, newLng, display_name);
        } else {
          toast.error("No se encontraron resultados para la búsqueda.");
        }
      } catch {
        toast.error("Error al buscar la dirección.");
      } finally {
        setIsSearching(false);
      }
    }
    performSearch();
  }, [debouncedSearch, onLocationChange]);

  const onMapClick = useCallback((e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarker({ lat, lng });
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  const onMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
  }, []);

  const onMarkerDragEnd = useCallback((e: any) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    setMarker({ lat, lng });
    onLocationChange(lat, lng);
  }, [onLocationChange]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    toast.info("Obteniendo tu ubicación...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setViewState((prev) => ({ 
          ...prev, 
          longitude: lng, 
          latitude: lat, 
          zoom: 16 
        }));
        setMarker({ lat, lng });
        onLocationChange(lat, lng);
        toast.success("Ubicación actualizada.");
      },
      () => {
        toast.error("No se pudo obtener la ubicación. Verifica los permisos.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ciudad, calle, zona..."
            className="pl-9 h-10 rounded-xl"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              Buscando...
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleGetCurrentLocation}
          className="shrink-0 h-10 rounded-xl gap-2 hidden sm:flex"
        >
          <Navigation className="w-4 h-4" />
          Mi Ubicación
        </Button>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className={cn("h-[300px] rounded-xl overflow-hidden border bg-muted relative", mapClassName)}
      >
        <Map
          ref={mapRef}
          {...viewState}
          onMove={onMapMove}
          mapStyle={mapStyle}
          onClick={onMapClick}
          interactiveLayerIds={[]}
          cursor="crosshair"
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

          {/* Unified Map Tools (Top Right) */}
          <div className="absolute top-3 right-2.5 flex flex-col gap-2 z-10">
            {/* Locate Me button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleGetCurrentLocation(); }}
              className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              title="Mi ubicación"
            >
              <LocateFixed className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Theme toggle button */}
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); toggleTheme(); }}
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
              onClick={(e) => { e.preventDefault(); handleFullscreen(); }}
              className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-md shadow-[0_0_0_2px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen
                ? <Minimize className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                : <Maximize className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              }
            </button>
          </div>

          {marker && (
            <Marker
              longitude={marker.lng}
              latitude={marker.lat}
              anchor="bottom"
              draggable
              onDragEnd={onMarkerDragEnd}
            >
              <div className="relative flex flex-col items-center group cursor-grab active:cursor-grabbing">
                {/* Glow / Aura */}
                <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl animate-pulse opacity-50 group-hover:opacity-100 transition-opacity" />
                
                {/* The Pin/Beacon */}
                <div className="relative mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border-2 border-red-600 dark:border-red-500 shadow-xl flex items-center justify-center overflow-hidden rotate-45 relative z-10">
                    <div className="-rotate-45 w-full h-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  
                  {/* Pin Point */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 dark:bg-red-500 rotate-45 z-0" />
                  
                  {/* Inner Pulse */}
                  <div className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-20 z-0" />
                </div>
                
                {/* Drag hint */}
                <div className="absolute -top-8 bg-black/80 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                  Arrastra para mover
                </div>
              </div>
            </Marker>
          )}
        </Map>
      </div>

      <p className="text-xs text-muted-foreground">
        Haz clic en el mapa o arrastra el marcador para definir la ubicación exacta de tu tienda.
      </p>
    </div>
  );
}
