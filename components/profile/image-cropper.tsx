'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Crop, ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
  cropShape?: 'round' | 'rect';
}

export function ImageCropper({ 
  image, 
  onCropComplete, 
  onCancel, 
  aspect = 1,
  cropShape = aspect === 1 ? 'round' : 'rect'
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: any) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary" />
            Recortar Imagen
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ajusta y recorta tu foto de perfil
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[250px] sm:h-[320px] mt-4 bg-muted">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            cropShape={cropShape}
            showGrid={false}
          />
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <ZoomOut className="w-3 h-3" />
                Zoom
              </div>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="py-1"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl gap-2 text-xs font-bold"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-bold shadow-lg shadow-blue-500/20"
            >
              <Check className="w-4 h-4" />
              Guardar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
