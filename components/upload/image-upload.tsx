// components/upload/image-upload.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  initialImages?: string[];
  maxImages?: number;
}

interface ImageItem {
  url: string;
  isUploading: boolean;
  file?: File;
  previewUrl?: string;
}

export function ImageUpload({
  onImagesChange,
  initialImages = [],
  maxImages = 5
}: ImageUploadProps) {
  // Inicializar estado con las imágenes existentes
  const [imageItems, setImageItems] = useState<ImageItem[]>(
    initialImages.map(url => ({ url, isUploading: false }))
  );

  // Sincronizar con el componente padre cuando cambien las URLs finales
  useEffect(() => {
    const finalUrls = imageItems
      .filter(item => !item.isUploading)
      .map(item => item.url);
    onImagesChange(finalUrls);
  }, [imageItems, onImagesChange]);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (imageItems.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    const newFiles = Array.from(files);

    // Crear previsualizaciones locales inmediatas
    const newItems: ImageItem[] = newFiles.map(file => ({
      url: "",
      isUploading: true,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setImageItems(prev => [...prev, ...newItems]);

    // Subir cada archivo
    for (const item of newItems) {
      const formData = new FormData();
      formData.append("file", item.file!);
      formData.append("folder", "products");

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setImageItems(prev => prev.map(p =>
            p.previewUrl === item.previewUrl
              ? { url: data.url, isUploading: false }
              : p
          ));
        } else {
          toast.error(data.error || "Error al subir imagen");
          setImageItems(prev => prev.filter(p => p.previewUrl !== item.previewUrl));
        }
      } catch (error) {
        console.error("Error uploading:", error);
        toast.error("Error al subir imagen");
        setImageItems(prev => prev.filter(p => p.previewUrl !== item.previewUrl));
      }
    }

    event.target.value = "";
  }, [imageItems, maxImages]);

  const handleRemove = useCallback((index: number) => {
    setImageItems(prev => {
      const item = prev[index];
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
    toast.info("Imagen eliminada");
  }, []);

  // Limpiar memoria de los ObjectURLs al desmontar
  useEffect(() => {
    return () => {
      imageItems.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  return (
    <div className="space-y-4">
      <Label>Imágenes del producto</Label>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageItems.map((item, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square relative rounded-lg overflow-hidden border bg-slate-100">
              <Image
                src={item.isUploading ? item.previewUrl! : item.url}
                alt={`Producto ${index + 1}`}
                fill
                className={`object-cover transition-opacity ${item.isUploading ? "opacity-50" : "opacity-100"}`}
              />
              {item.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              disabled={item.isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {imageItems.length < maxImages && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-50">
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Subir imagen
              </span>
            </div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleUpload}
              className="hidden"
              multiple
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Formatos permitidos: JPG, PNG, WEBP, GIF. Máximo 5MB por imagen.
      </p>
    </div>
  );
}