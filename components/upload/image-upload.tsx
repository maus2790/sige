// components/upload/image-upload.tsx

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { ProductImageCropper, type MultiResUrls } from "@/components/productos/product-image-cropper";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  /** Called when multi-res upload completes for each image added */
  onMultiResChange?: (allUrls: MultiResUrls[]) => void;
  initialImages?: string[];
  maxImages?: number;
  folder?: string;
  label?: string;
  /** If true, uses the cropper + multi-res upload. Default: true */
  useMultiRes?: boolean;
}

interface ImageItem {
  url: string;           // feed URL (primary)
  thumbUrl?: string;     // thumbnail URL
  ogUrl?: string;        // OG/social sharing URL
  isUploading: boolean;
  file?: File;
  previewUrl?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ImageUpload({
  onImagesChange,
  onMultiResChange,
  initialImages = [],
  maxImages = 5,
  folder = "products",
  label = "Imágenes",
  useMultiRes = true,
}: ImageUploadProps) {
  const [imageItems, setImageItems] = React.useState<ImageItem[]>(
    initialImages.map((url) => ({ url, isUploading: false }))
  );

  // Pending crop state
  const [pendingImageSrc, setPendingImageSrc] = React.useState<string | null>(null);

  const onImagesChangeRef = React.useRef(onImagesChange);
  const onMultiResChangeRef = React.useRef(onMultiResChange);

  React.useEffect(() => { onImagesChangeRef.current = onImagesChange; }, [onImagesChange]);
  React.useEffect(() => { onMultiResChangeRef.current = onMultiResChange; }, [onMultiResChange]);

  // Notify parent whenever feed URLs change
  React.useEffect(() => {
    const finalUrls = imageItems
      .filter((item) => !item.isUploading)
      .map((item) => item.url);
    onImagesChangeRef.current(finalUrls);
  }, [imageItems]);

  // Notify parent of all multi-res urls
  React.useEffect(() => {
    if (!onMultiResChangeRef.current) return;
    const all: MultiResUrls[] = imageItems
      .filter((item) => !item.isUploading && item.url)
      .map((item) => ({
        feedUrl: item.url,
        thumbUrl: item.thumbUrl || null,
        ogUrl: item.ogUrl || null,
      }));
    onMultiResChangeRef.current(all);
  }, [imageItems]);

  // ── File selection ──────────────────────────────────────────────────────────

  const handleFileSelect = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      if (imageItems.length + files.length > maxImages) {
        toast.error(`Máximo ${maxImages} imágenes permitidas`);
        return;
      }

      const file = files[0]; // Process one at a time through cropper

      if (useMultiRes) {
        // Open cropper for the first file
        const reader = new FileReader();
        reader.onload = () => {
          setPendingImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // Legacy: direct upload without cropping
        handleLegacyUpload(Array.from(files));
      }

      event.target.value = "";
    },
    [imageItems, maxImages, useMultiRes]
  );

  // ── Crop complete → received URLs from API ───────────────────────────────

  const handleCropComplete = React.useCallback((urls: MultiResUrls) => {
    setPendingImageSrc(null);

    setImageItems((prev) => [
      ...prev,
      {
        url: urls.feedUrl,
        thumbUrl: urls.thumbUrl ?? undefined,
        ogUrl: urls.ogUrl ?? undefined,
        isUploading: false,
      },
    ]);
  }, []);

  const handleCropCancel = React.useCallback(() => {
    setPendingImageSrc(null);
  }, []);

  // ── Legacy upload (fallback, no cropper) ────────────────────────────────

  const handleLegacyUpload = async (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      url: "",
      isUploading: true,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImageItems((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      const formData = new FormData();
      formData.append("file", item.file!);
      formData.append("folder", folder);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          setImageItems((prev) =>
            prev.map((p) =>
              p.previewUrl === item.previewUrl
                ? { url: data.url, isUploading: false }
                : p
            )
          );
        } else {
          toast.error(data.error || "Error al subir imagen");
          setImageItems((prev) =>
            prev.filter((p) => p.previewUrl !== item.previewUrl)
          );
        }
      } catch {
        toast.error("Error al subir imagen");
        setImageItems((prev) =>
          prev.filter((p) => p.previewUrl !== item.previewUrl)
        );
      }
    }
  };

  const handleRemove = React.useCallback((index: number) => {
    setImageItems((prev) => {
      const item = prev[index];
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    toast.info("Imagen eliminada");
  }, []);

  // Cleanup
  React.useEffect(() => {
    return () => {
      imageItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  return (
    <>
      <div className="space-y-4">
        <Label>{label}</Label>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {imageItems.map((item, index) => (
            <div key={index} className="relative group">
              <div className="aspect-4/3 relative rounded-xl overflow-hidden border bg-muted shadow-sm">
                <Image
                  src={
                    item.isUploading
                      ? item.previewUrl!
                      : (item.thumbUrl || item.url)
                  }
                  alt={`Producto ${index + 1}`}
                  fill
                  className={`object-cover transition-opacity ${
                    item.isUploading ? "opacity-50" : "opacity-100"
                  }`}
                />
                {item.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                {/* OG badge */}
                {item.ogUrl && !item.isUploading && (
                  <div className="absolute bottom-1 left-1 bg-green-500/80 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    OG ✓
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                disabled={item.isUploading}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {imageItems.length < maxImages && (
            <label className="aspect-4/3 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors bg-muted/40 hover:bg-muted/70 group">
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] text-muted-foreground group-hover:text-primary font-medium transition-colors">
                  Subir foto
                </span>
              </div>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          JPG, PNG o WEBP · Se generarán 3 tamaños automáticamente (miniatura, feed y WhatsApp)
        </p>
      </div>

      {/* Cropper modal */}
      {pendingImageSrc && (
        <ProductImageCropper
          image={pendingImageSrc}
          onUploadComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}