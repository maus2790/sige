// components/products/product-image-gallery.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center text-muted-foreground">
        <Package className="w-6 h-6" />
      </div>
    );
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative w-12 h-12 rounded-md overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity">
          <Image
            src={images[0]}
            alt={productName}
            fill
            className="object-cover"
          />
          {images.length > 1 && (
            <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl-md">
              +{images.length - 1}
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none sm:rounded-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{productName}</DialogTitle>
          <DialogDescription>Galería de imágenes del producto</DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[80vh] flex items-center justify-center">
          {/* Navegación lateral */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 text-white hover:bg-white/20"
                onClick={prevImage}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 text-white hover:bg-white/20"
                onClick={nextImage}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Imagen Principal */}
          <div className="relative w-full h-full">
            <Image
              src={images[currentIndex]}
              alt={`${productName} - ${currentIndex + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Indicador de contador */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Miniaturas */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-4 overflow-x-auto">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${currentIndex === idx ? "border-primary scale-110" : "border-transparent opacity-50"
                  }`}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${idx}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
