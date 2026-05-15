"use client";

import React, { useState, useTransition, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, Store, MapPin, Phone, 
  Image as ImageIcon, Camera, Trash2,
  Save, X, Palette, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { updateStore, updateStoreLogo, updateStoreBanner } from '@/app/actions/store-management';
import { ImageCropper } from '@/components/profile/image-cropper';

const SYSTEM_GRADIENTS = [
  { id: 'gradient:blue', name: 'Océano Profundo', class: 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900' },
  { id: 'gradient:sunset', name: 'Atardecer Cálido', class: 'bg-linear-to-br from-orange-500 via-pink-500 to-purple-600' },
  { id: 'gradient:emerald', name: 'Bosque Esmeralda', class: 'bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700' },
  { id: 'gradient:dark', name: 'Noche Estelar', class: 'bg-linear-to-br from-gray-900 via-slate-800 to-gray-900' },
  { id: 'gradient:premium', name: 'Gala Púrpura', class: 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900' },
];

interface StoreCustomizerProps {
  store: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { LocationPickerMap } from '@/components/tienda/location-picker-map';

export function StoreCustomizer({ store, open, onOpenChange }: StoreCustomizerProps) {
  const [isPending, startTransition] = useTransition();
  const [editName, setEditName] = useState(store.name);
  const [editDescription, setEditDescription] = useState(store.description || '');
  const [editAddress, setEditAddress] = useState(store.address || '');
  const [editPhone, setEditPhone] = useState(store.phone || '');
  const [editLatitude, setEditLatitude] = useState<number | null>(store.latitude || null);
  const [editLongitude, setEditLongitude] = useState<number | null>(store.longitude || null);
  
  // Image handling
  const [isCropping, setIsCropping] = useState(false);
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [showSystemDesigns, setShowSystemDesigns] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateStore = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateStore(store.id, {
        name: editName,
        description: editDescription,
        address: editAddress,
        phone: editPhone,
        latitude: editLatitude,
        longitude: editLongitude,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Tienda actualizada correctamente");
        onOpenChange(false);
      }
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande (máximo 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropType(type);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    setIsCropping(false);
    const toastId = toast.loading(cropType === 'logo' ? 'Actualizando logo...' : 'Actualizando portada...');

    try {
      const result = cropType === 'logo' 
        ? await updateStoreLogo(store.id, croppedImage)
        : await updateStoreBanner(store.id, croppedImage);

      if (result.error) {
        toast.error(result.error, { id: toastId });
      } else {
        toast.success(cropType === 'logo' ? 'Logo actualizado' : 'Portada actualizada', { id: toastId });
      }
    } catch (error) {
      toast.error('Error al subir la imagen', { id: toastId });
    } finally {
      setSelectedImage(null);
    }
  };

  const handleSelectGradient = (gradientId: string) => {
    startTransition(async () => {
      const result = await updateStore(store.id, { bannerUrl: gradientId });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Diseño del sistema aplicado");
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 bg-linear-to-r from-blue-600 to-indigo-700 text-white shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Settings className="w-5 h-5" />
              Configuración de la Tienda
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Personaliza la apariencia y datos de tu tienda virtual
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-hide">
            {/* Visual Customization */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Identidad Visual
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {/* Logo Upload */}
                <div className="space-y-2 flex flex-col items-center">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Logo (1:1)</Label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="group relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-1 shadow-inner"
                  >
                    {store.logoUrl ? (
                      <img src={store.logoUrl} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                    ) : (
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => onFileChange(e, 'logo')} 
                    />
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Portada (3:1)</Label>
                    <button 
                      onClick={() => setShowSystemDesigns(!showSystemDesigns)}
                      className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-tighter"
                    >
                      {showSystemDesigns ? 'Cerrar Diseños' : 'Diseños del Sistema'}
                    </button>
                  </div>

                  {showSystemDesigns ? (
                    <div className="grid grid-cols-5 gap-2 h-24 sm:h-32">
                      {SYSTEM_GRADIENTS.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => handleSelectGradient(g.id)}
                          className={`group relative rounded-xl ${g.class} border-2 ${store.bannerUrl === g.id ? 'border-blue-500 shadow-lg' : 'border-transparent'} overflow-hidden transition-all hover:scale-105`}
                          title={g.name}
                        >
                          {store.bannerUrl === g.id && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div 
                      onClick={() => bannerInputRef.current?.click()}
                      className="group relative h-24 sm:h-32 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2"
                    >
                      {store.bannerUrl && !store.bannerUrl.startsWith('gradient:') ? (
                        <img src={store.bannerUrl} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          <span className="text-[10px] font-bold text-muted-foreground">Click para subir</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={bannerInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => onFileChange(e, 'banner')} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Information Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Store className="w-4 h-4" />
                Información General
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nombre de la Tienda</Label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="Ej. Mi Tienda Increíble"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Descripción / Eslogan</Label>
                  <Textarea 
                    value={editDescription} 
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="rounded-xl min-h-[100px] resize-none"
                    placeholder="Cuéntanos sobre tu tienda..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Dirección Física</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={editAddress} 
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="rounded-xl h-11 pl-10"
                        placeholder="Calle, Ciudad..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Teléfono de Contacto</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="rounded-xl h-11 pl-10"
                        placeholder="+591 7XXXXXXX"
                      />
                    </div>
                  </div>
                </div>

                {/* Ubicación en Mapa */}
                <div className="space-y-2 pt-2 border-t mt-4">
                  <Label className="text-xs font-bold">Ubicación Exacta</Label>
                  <LocationPickerMap 
                    initialLatitude={editLatitude}
                    initialLongitude={editLongitude}
                    onLocationChange={(lat, lng, address) => {
                      setEditLatitude(lat);
                      setEditLongitude(lng);
                      if (address && !editAddress) {
                        setEditAddress(address);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t shrink-0">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => handleUpdateStore(new FormData())}
              disabled={isPending}
              className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/20"
            >
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cropper Integration */}
      {isCropping && selectedImage && (
        <ImageCropper
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setSelectedImage(null);
          }}
          aspect={cropType === 'logo' ? 1 : 3/1}
        />
      )}
    </>
  );
}
