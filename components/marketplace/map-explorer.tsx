"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import MapGL, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { getNearbyStores, searchProductsGeo } from "@/app/actions/map";
import { useDebounce } from "use-debounce";
import { formatDistance } from "@/lib/haversine";
import { MapPin, Search, Navigation, Store, Package, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_CENTER = { lat: -16.5, lng: -68.15 };

export function MapExplorer() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(50); // Default 50km
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 800);
  
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.lng,
    latitude: DEFAULT_CENTER.lat,
    zoom: 12,
  });

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng, zoom: 13 }));
        },
        (err) => {
          console.warn("Geolocation error:", err);
          toast.warning("No pudimos obtener tu ubicación exacta, mostrando ubicación general.");
          // We will fetch based on DEFAULT_CENTER or ask them
          setUserLocation(DEFAULT_CENTER);
        }
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
    }
  }, []);

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

  const handleDirections = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?daddr=${lat},${lng}`;
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
          <div className="relative group cursor-pointer hover:scale-110 transition-transform">
            <MapPin className="w-8 h-8 text-purple-600 fill-current drop-shadow-md" />
            <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {group.products.length}
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
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
          <div className="relative group cursor-pointer hover:scale-110 transition-transform text-blue-600">
            <MapPin className="w-8 h-8 fill-current drop-shadow-md" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
          </div>
        </Marker>
      ));
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex flex-col md:flex-row bg-background overflow-hidden">
      
      {/* ─── SIDEBAR / LIST ─── */}
      <div className="w-full md:w-[380px] lg:w-[420px] h-[40vh] md:h-full bg-card border-r border-border shadow-xl z-10 flex flex-col order-2 md:order-1">
        <div className="p-4 border-b space-y-3 bg-muted/30">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-bold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            Explorar
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos o tiendas..."
              className="pl-9 h-11 rounded-xl bg-background border-border/60"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Radio:</span>
            {[5, 10, 25, 50].map(r => (
              <Button
                key={r}
                variant={radius === r ? "default" : "outline"}
                size="sm"
                className={`h-7 text-xs rounded-full ${radius === r ? 'bg-blue-600' : ''}`}
                onClick={() => setRadius(r)}
              >
                {r}km
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
                <div key={product.id} className="bg-background border rounded-2xl p-3 flex gap-3 hover:border-purple-400 transition-colors shadow-sm">
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
                    setViewState({ longitude: store.longitude as number, latitude: store.latitude as number, zoom: 15 });
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
      <div className="flex-1 relative order-1 md:order-2 h-[60vh] md:h-full">
        <MapGL
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
        >
          <NavigationControl position="bottom-right" />
          
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
              <div className="p-2 pt-4">
                {selectedItem.type === 'store' ? (
                  <div className="space-y-2">
                    <h3 className="font-black text-base">{selectedItem.data.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedItem.data.address}</p>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => handleDirections(selectedItem.data.latitude, selectedItem.data.longitude)}
                        className="flex-1 h-8 text-[10px] uppercase tracking-wider rounded-lg bg-blue-600"
                        size="sm"
                      >
                        Cómo llegar
                      </Button>
                      <Link href={`/tienda/${selectedItem.data.id}`}>
                        <Button variant="outline" className="flex-1 h-8 text-[10px] uppercase tracking-wider rounded-lg" size="sm">
                          Ver tienda
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="font-black text-sm text-purple-700 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      {selectedItem.data.store.name}
                    </h3>
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
                      className="w-full h-8 text-[10px] uppercase tracking-wider rounded-lg bg-purple-600 hover:bg-purple-700 text-white mt-1"
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
