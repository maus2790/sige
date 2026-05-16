"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
  imageUrls: string[];
  productName: string;
  imageUrlsThumb?: string[];
  imageUrlsOg?: string[];
}

export function ProductGallery({ imageUrls, productName, imageUrlsThumb, imageUrlsOg }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const images = imageUrls.length > 0 ? imageUrls : [];
  const thumbs = images.map((img, idx) => (imageUrlsThumb && imageUrlsThumb[idx]) ? imageUrlsThumb[idx] : img);
  const highResImages = images.map((img, idx) => (imageUrlsOg && imageUrlsOg[idx]) ? imageUrlsOg[idx] : img);

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    if (!showZoom) setShowZoom(true);

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Prevent scrolling while zooming on image
    if (showZoom) {
      // e.preventDefault(); // Commented out to avoid passive listener warnings, but logic follows
    }

    const touch = e.touches[0];
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    
    // Check if touch is within bounds
    if (touch.clientX >= left && touch.clientX <= left + width && 
        touch.clientY >= top && touch.clientY <= top + height) {
      if (!showZoom) setShowZoom(true);
      const x = ((touch.clientX - left) / width) * 100;
      const y = ((touch.clientY - top) / height) * 100;
      setZoomPos({ x, y });
    } else {
      setShowZoom(false);
    }
  };

  if (images.length === 0) {
    return (
      <div className="aspect-4/3 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground border">
        <Package className="w-20 h-20 opacity-20" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-0 md:gap-4">
      {/* Thumbnails - Izquierda en Desktop, Abajo en Móvil */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto pb-1 md:pb-0 h-[10dvh] md:h-full max-h-[500px] w-full md:w-24 scrollbar-hide no-scrollbar items-center md:items-start shrink-0 order-2 md:order-1 justify-center md:justify-start glass md:bg-transparent md:backdrop-blur-none border-t md:border-0 border-white/20 p-1 md:p-2">
          {images.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative w-[18dvw] md:w-16 h-[85%] md:h-16 rounded-xl border-2 bg-card shrink-0 overflow-hidden transition-all duration-200 outline-none",
                activeIndex === idx 
                  ? "border-primary shadow-md ring-2 ring-primary/20 scale-105 z-10" 
                  : "border-transparent hover:border-border"
              )}
            >
              <Image
                src={thumbs[idx]}
                alt={`${productName} miniatura ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div 
        className={cn(
          "relative bg-card overflow-hidden group cursor-crosshair touch-none transition-all order-1 md:order-2 md:flex-1",
          "rounded-none md:rounded-2xl border-0 md:border shadow-none md:shadow-sm",
          "w-full aspect-4/3"
        )}
        ref={containerRef}
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setShowZoom(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setShowZoom(false)}
      >
        {/* Background Blur for filling spaces */}
        <Image
          src={images[activeIndex]}
          alt=""
          fill
          className="object-cover blur-2xl opacity-20 scale-110 z-0"
          aria-hidden="true"
        />
        
        {/* Main Image */}
        <Image
          src={images[activeIndex]}
          alt={`${productName} - Imagen ${activeIndex + 1}`}
          fill
          className={cn(
            "object-contain p-0 transition-all duration-300 z-10 scale-105",
            showZoom ? "opacity-0" : "opacity-100"
          )}
          priority
        />

        {/* Zoomed Image / Magnifier - Use highest resolution possible */}
        {showZoom && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `url(${highResImages[activeIndex]})`,
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

        {/* Pagination Indicator (Mobile/Dots) - Oculto en móvil por las miniaturas */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden gap-1.5 lg:hidden">
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
    </div>
  );
}
