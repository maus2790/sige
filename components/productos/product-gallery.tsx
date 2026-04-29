"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  imageUrls: string[];
  productName: string;
}

export function ProductGallery({ imageUrls, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const images = imageUrls.length > 0 ? imageUrls : [];

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPos({ x, y });
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground border">
        <Package className="w-20 h-20 opacity-20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Viewer */}
      <div 
        className="relative aspect-square bg-card rounded-2xl overflow-hidden border shadow-sm group cursor-crosshair"
        ref={containerRef}
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Main Image */}
        <Image
          src={images[activeIndex]}
          alt={`${productName} - Imagen ${activeIndex + 1}`}
          fill
          className={cn(
            "object-contain p-4 transition-opacity duration-300",
            showZoom ? "opacity-0" : "opacity-100"
          )}
          priority
        />

        {/* Zoomed Image / Magnifier */}
        {showZoom && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `url(${images[activeIndex]})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: "250%",
              backgroundRepeat: "no-repeat"
            }}
          />
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-40 h-11 w-11 hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-40 h-11 w-11 hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="w-4 h-4" />
        </div>

        {/* Pagination Indicator (Mobile/Dots) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
          {images.map((_, idx) => (
            <div 
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                activeIndex === idx ? "bg-primary w-4" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {images.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative w-20 h-20 rounded-xl border-2 bg-card shrink-0 overflow-hidden transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20",
                activeIndex === idx 
                  ? "border-primary shadow-md scale-105" 
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={url}
                alt={`${productName} miniatura ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
