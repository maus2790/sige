"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Crop,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MultiResUrls {
  feedUrl: string;
  thumbUrl: string | null;
  ogUrl: string | null;
}

interface ProductImageCropperProps {
  /** data-URL de la imagen original seleccionada */
  image: string;
  onUploadComplete: (urls: MultiResUrls) => void;
  onCancel: () => void;
}

// ─── Utilidades de canvas ─────────────────────────────────────────────────────

function createImageEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

/**
 * Recorta la imagen fuente con los pixelCrop dados y la redimensiona al
 * ancho/alto de salida indicados. Devuelve un Blob JPEG con la calidad
 * especificada.
 */
async function buildVariantBlob(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outW: number,
  outH: number,
  quality: number
): Promise<Blob> {
  const img = await createImageEl(imageSrc);

  // Canvas intermedio con el crop exacto
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = pixelCrop.width;
  cropCanvas.height = pixelCrop.height;
  const cropCtx = cropCanvas.getContext("2d")!;
  cropCtx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Canvas de salida con el tamaño final
  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d")!;
  outCtx.drawImage(cropCanvas, 0, 0, outW, outH);

  return new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo generar el blob de la imagen"));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Para la variante OG (1200×630, ratio 1.91:1) necesitamos recortar el
 * centro de la imagen 4:3 y añadir un poco de relleno lateral de forma
 * que no se vea estirada.  Calculamos un pixelCrop derivado del principal.
 */
function deriveOgCrop(
  baseCrop: { x: number; y: number; width: number; height: number }
) {
  // De la altura del crop 4:3 obtenemos la altura OG (1.91:1 → h= w/1.91)
  const ogW = baseCrop.width;
  const ogH = Math.round(ogW / 1.91);
  const yOffset = Math.round((baseCrop.height - ogH) / 2);
  return {
    x: baseCrop.x,
    y: baseCrop.y + Math.max(0, yOffset),
    width: ogW,
    height: Math.min(baseCrop.height, ogH),
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductImageCropper({
  image,
  onUploadComplete,
  onCancel,
}: ProductImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsUploading(true);

    const toastId = toast.loading("Procesando y subiendo imágenes...");

    try {
      // 1) Generar los 3 blobs en el cliente (canvas)
      const ogCrop = deriveOgCrop(croppedAreaPixels);

      const [feedBlob, thumbBlob, ogBlob] = await Promise.all([
        buildVariantBlob(image, croppedAreaPixels, 1200, 900, 0.90),
        buildVariantBlob(image, croppedAreaPixels, 400, 300, 0.40),
        buildVariantBlob(image, ogCrop, 1200, 630, 0.70),
      ]);

      // 2) Subir al endpoint multi-resolución
      const fd = new FormData();
      fd.append("feed", feedBlob, "feed.jpg");
      fd.append("thumb", thumbBlob, "thumb.jpg");
      fd.append("og", ogBlob, "og.jpg");

      const res = await fetch("/api/upload/product-images", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al subir imágenes");
      }

      toast.success("¡Imagen subida correctamente!", { id: toastId });

      onUploadComplete({
        feedUrl: data.feedUrl,
        thumbUrl: data.thumbUrl,
        ogUrl: data.ogUrl,
      });
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la imagen", {
        id: toastId,
      });
      setIsUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[700px] sm:h-[92vh] p-0 overflow-hidden bg-background border-none shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className="p-3 pb-1 flex-none border-b bg-muted/20">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Crop className="w-4 h-4 text-primary" />
            Recortar Imagen
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ajusta el recorte de la imagen del producto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* ── Crop area ── */}
          <div className="relative w-full h-[300px] sm:h-[40vh] bg-black/90 flex-none">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={4 / 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid
            />
          </div>

          {/* ── Controls section ── */}
          <div className="p-4 space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ── Zoom slider ── */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
                  <div className="flex items-center gap-1.5">
                    <ZoomOut className="w-3.5 h-3.5" />
                    Zoom
                  </div>
                  <span className="text-primary">{Math.round(zoom * 100)}%</span>
                </div>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.05}
                  onValueChange={(v) => setZoom(v[0])}
                  className="py-1"
                />
              </div>

              {/* ── Variants labels ── */}
              <div className="space-y-2 sm:text-right">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                  Formatos Optimizados:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {[
                    { label: "Thumb", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30" },
                    { label: "Feed", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30" },
                    { label: "WhatsApp", color: "bg-green-100 text-green-700 dark:bg-green-900/30" },
                  ].map((v) => (
                    <span
                      key={v.label}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold ${v.color}`}
                    >
                      <Check className="w-2.5 h-2.5" />
                      {v.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-tight">
                <strong>Tip:</strong> Usa el mouse o gestos para centrar el producto. Se generarán 3 tamaños automáticamente para asegurar rapidez en el Market y previsualización en WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-none p-3 bg-background border-t">
          <DialogFooter className="flex gap-2 justify-stretch! flex-row! max-w-[400px] mx-auto">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-9 rounded-lg gap-2 text-xs font-bold"
              disabled={isUploading}
            >
              <X className="w-3.5 h-3.5" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold shadow-md shadow-blue-500/20"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {isUploading ? "Subiendo..." : "Guardar"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
