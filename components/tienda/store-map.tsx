"use client";

import React, { useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoreMapProps {
  latitude: number;
  longitude: number;
  storeName: string;
  storeAddress?: string;
}

export function StoreMap({ latitude, longitude, storeName, storeAddress }: StoreMapProps) {
  const [showPopup, setShowPopup] = useState(true);

  const handleDirections = () => {
    // Open Google Maps directions
    const url = `https://maps.google.com/?daddr=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative w-full h-[300px] rounded-3xl overflow-hidden border shadow-sm">
      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom: 15,
        }}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        interactiveLayerIds={[]}
      >
        <NavigationControl position="bottom-right" />
        
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <div 
            className="text-red-600 drop-shadow-md relative group cursor-pointer hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setShowPopup(true);
            }}
          >
            <MapPin className="w-10 h-10 fill-current" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        </Marker>

        {showPopup && (
          <Popup
            longitude={longitude}
            latitude={latitude}
            anchor="top"
            onClose={() => setShowPopup(false)}
            closeButton={false}
            closeOnClick={false}
            offset={15}
            className="rounded-xl overflow-hidden"
            maxWidth="300px"
          >
            <div className="p-3 bg-white text-slate-800 flex flex-col gap-2 min-w-[200px]">
              <h3 className="font-bold text-sm leading-tight">{storeName}</h3>
              {storeAddress && (
                <p className="text-xs text-muted-foreground leading-tight">{storeAddress}</p>
              )}
              <Button 
                onClick={handleDirections}
                className="w-full h-8 mt-1 text-[10px] uppercase font-bold tracking-wider rounded-lg gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
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
