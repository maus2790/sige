"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Search, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

interface LocationPickerMapProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

const DEFAULT_CENTER = { lat: -16.5, lng: -68.15 }; // Default to La Paz, Bolivia or a central location

export function LocationPickerMap({
  initialLatitude,
  initialLongitude,
  onLocationChange,
}: LocationPickerMapProps) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLatitude && initialLongitude
      ? { lat: initialLatitude, lng: initialLongitude }
      : null
  );

  const [viewState, setViewState] = useState({
    longitude: initialLongitude || DEFAULT_CENTER.lng,
    latitude: initialLatitude || DEFAULT_CENTER.lat,
    zoom: initialLatitude && initialLongitude ? 14 : 5,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 1000);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<MapRef>(null);

  // Search using Nominatim
  useEffect(() => {
    async function performSearch() {
      if (!debouncedSearch || debouncedSearch.length < 3) return;
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            debouncedSearch
          )}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);
          
          setViewState((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
            zoom: 15,
          }));
          setMarker({ lat: newLat, lng: newLng });
          onLocationChange(newLat, newLng, display_name);
        } else {
          toast.error("No se encontraron resultados para la búsqueda.");
        }
      } catch (error) {
        console.error("Geocoding error:", error);
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
        setViewState({
          longitude: lng,
          latitude: lat,
          zoom: 15,
        });
        setMarker({ lat, lng });
        onLocationChange(lat, lng);
        toast.success("Ubicación actualizada.");
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("No se pudo obtener la ubicación. Verifica los permisos.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
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
          className="shrink-0 h-10 rounded-xl gap-2"
        >
          <Navigation className="w-4 h-4" />
          Mi Ubicación
        </Button>
      </div>

      <div className="h-[300px] rounded-xl overflow-hidden border bg-muted relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
          onClick={onMapClick}
          interactiveLayerIds={[]}
          cursor="crosshair"
        >
          <NavigationControl position="bottom-right" />
          {marker && (
            <Marker
              longitude={marker.lng}
              latitude={marker.lat}
              draggable
              onDragEnd={onMarkerDragEnd}
              anchor="bottom"
            >
              <div className="text-red-600 drop-shadow-md relative group cursor-grab active:cursor-grabbing">
                <MapPin className="w-8 h-8 fill-current" />
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
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
