"use client";

import React, { useEffect, useState, useTransition, useRef } from 'react';
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
  Save, X, Palette, CheckCircle2,
  Maximize2, Minimize2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { updateStore, updateStoreLogo, updateStoreBanner } from '@/app/actions/store-management';
import { ImageCropper } from '@/components/profile/image-cropper';
import { isPremiumTheme, PREMIUM_THEMES, PremiumTheme, usePremiumTheme } from '@/hooks/use-premium-theme';

const SYSTEM_GRADIENTS = [
  { id: 'gradient:blue', name: 'Océano Profundo', class: 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900' },
  { id: 'gradient:sunset', name: 'Atardecer Cálido', class: 'bg-linear-to-br from-orange-500 via-pink-500 to-purple-600' },
  { id: 'gradient:emerald', name: 'Bosque Esmeralda', class: 'bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700' },
  { id: 'gradient:dark', name: 'Noche Estelar', class: 'bg-linear-to-br from-gray-900 via-slate-800 to-gray-900' },
  { id: 'gradient:premium', name: 'Gala Púrpura', class: 'bg-linear-to-br from-slate-900 via-purple-900 to-slate-900' },
  { id: 'gradient:cosmic', name: 'Nebulosa Rosa', class: 'bg-linear-to-br from-indigo-900 via-purple-900 to-pink-800' },
  { id: 'gradient:nature', name: 'Valle Verde', class: 'bg-linear-to-br from-green-500 via-emerald-600 to-teal-800' },
  { id: 'gradient:gold', name: 'Oro Real', class: 'bg-linear-to-br from-yellow-500 via-orange-600 to-red-800' },
  { id: 'gradient:cyber', name: 'Cyberpunk', class: 'bg-linear-to-br from-cyan-500 via-blue-600 to-indigo-900' },
  { id: 'gradient:rose', name: 'Rosa Pasión', class: 'bg-linear-to-br from-rose-500 via-pink-600 to-purple-800' },
];

function parseStoreTheme(themeConfig?: string | null): PremiumTheme | null {
  if (!themeConfig) return null;

  try {
    const parsed = JSON.parse(themeConfig);
    const theme = typeof parsed === "string" ? parsed : parsed?.premiumTheme;
    return isPremiumTheme(theme) ? theme : null;
  } catch {
    return isPremiumTheme(themeConfig) ? themeConfig : null;
  }
}

interface StoreCustomizerProps {
  store: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThemeChange?: (theme: PremiumTheme) => void;
}

import { LocationPickerMap } from '@/components/tienda/location-picker-map';

export function StoreCustomizer({ store, open, onOpenChange, onThemeChange }: StoreCustomizerProps) {
  const [isPending, startTransition] = useTransition();
  const { premiumTheme } = usePremiumTheme();
  const [editLogo, setEditLogo] = useState(store.logoUrl || null);
  const [editBanner, setEditBanner] = useState(store.bannerUrl || null);
  const [editTheme, setEditTheme] = useState<PremiumTheme>(() => parseStoreTheme(store.themeConfig) ?? premiumTheme);
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
  
  const [showSystemDesigns, setShowSystemDesigns] = useState(!store.bannerUrl || store.bannerUrl?.startsWith('gradient:'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const modalThemeClass = editTheme === "blue" ? "" : `theme-premium theme-${editTheme}`;

  useEffect(() => {
    if (!parseStoreTheme(store.themeConfig)) {
      setEditTheme(premiumTheme);
    }
  }, [premiumTheme, store.themeConfig]);


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
    if (cropType === 'logo') {
      setEditLogo(croppedImage);
    } else {
      setEditBanner(croppedImage);
    }
    setSelectedImage(null);
  };

  const handleSelectTheme = (theme: PremiumTheme) => {
    setEditTheme(theme);
    if (editBanner?.startsWith('gradient:')) {
      setEditBanner(null);
    }
  };

  const handleUpdateStore = () => {
    startTransition(async () => {
      try {
        let finalLogo = editLogo;
        let finalBanner = editBanner;

        // Upload images if they are in base64 format
        if (editLogo && editLogo.startsWith('data:image')) {
          const logoRes = await updateStoreLogo(store.id, editLogo);
          if (logoRes.error) {
            toast.error(logoRes.error);
            return;
          }
          finalLogo = logoRes.url;
        }

        if (editBanner && editBanner.startsWith('data:image')) {
          const bannerRes = await updateStoreBanner(store.id, editBanner);
          if (bannerRes.error) {
            toast.error(bannerRes.error);
            return;
          }
          finalBanner = bannerRes.url;
        }

        const result = await updateStore(store.id, {
          name: editName,
          description: editDescription,
          address: editAddress,
          phone: editPhone,
          latitude: editLatitude,
          longitude: editLongitude,
          logoUrl: finalLogo,
          bannerUrl: finalBanner,
          themeConfig: JSON.stringify({ premiumTheme: editTheme }),
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          onThemeChange?.(editTheme);
          toast.success("Tienda actualizada correctamente");
          onOpenChange(false);
        }
      } catch (error) {
        toast.error("Error al guardar los cambios");
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          showCloseButton={false}
          className={cn(
            "store-customizer-modal p-0 overflow-hidden border-none shadow-2xl flex flex-col transition-all duration-300 z-50 gap-0",
            modalThemeClass,
            isFullscreen 
              ? "fixed inset-0 w-screen h-screen max-w-none sm:max-w-none max-h-none rounded-none translate-x-0 translate-y-0 top-0 left-0" 
              : "sm:max-w-[600px] max-h-[90vh] rounded-3xl"
          )}
        >
          <DialogHeader className="store-modal-header py-3 px-6 bg-linear-to-r from-blue-600 to-indigo-700 text-white shrink-0 relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col text-left">
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5" />
                  Configuración de la Tienda
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-xs">
                  Personaliza la apariencia y datos de tu tienda virtual
                </DialogDescription>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className={cn(
            "flex-1 flex flex-col overflow-hidden h-full",
            isFullscreen && "md:flex-row"
          )}>
            {/* Scrollable Form Area */}
            <div className={cn(
              "flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide h-full",
              isFullscreen && "md:w-[380px] md:flex-none md:border-r bg-background"
            )}>
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
                      {editLogo ? (
                        <img src={editLogo} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
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
                        {showSystemDesigns ? 'Subir Imagen' : 'Elegir un Diseño'}
                      </button>
                    </div>

                    {showSystemDesigns ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto scrollbar-hide pr-1 py-1">
                        {PREMIUM_THEMES.map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => handleSelectTheme(theme.value)}
                            className={cn(
                              "group relative rounded-xl h-16 border-2 overflow-hidden transition-all hover:scale-[1.02] shrink-0 text-left",
                              editTheme === theme.value ? "border-primary shadow-lg" : "border-transparent"
                            )}
                            style={{ background: theme.swatchGradient }}
                            title={theme.label}
                          >
                            <span className="absolute inset-x-0 bottom-0 bg-black/35 px-2 py-1 text-[9px] font-black text-white uppercase tracking-tight">
                              {theme.shortLabel}
                            </span>
                            {editTheme === theme.value && (
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
                        className="store-banner-upload group relative h-24 sm:h-32 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2"
                      >
                        {editBanner && !editBanner.startsWith('gradient:') ? (
                          <img src={editBanner} className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
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

                  {/* Ubicación en Mapa (Responsive) */}
                  <div className={cn(
                    "space-y-2 pt-2 border-t mt-4",
                    isFullscreen && "md:hidden"
                  )}>
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

            {/* Desktop Fullscreen Map Pane */}
            {isFullscreen && (
              <div className="hidden md:flex md:flex-1 bg-muted p-4 flex-col border-l">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3" />
                  Geolocalización de la Tienda
                </h3>
                <LocationPickerMap 
                  className="flex-1 flex flex-col space-y-2"
                  mapClassName="flex-1 rounded-2xl shadow-inner border bg-background h-full"
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
            )}
          </div>

          <DialogFooter className="py-3 px-6 bg-muted/30 border-t shrink-0 flex flex-row items-center justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none rounded-xl h-11 text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateStore}
              disabled={isPending}
              className="store-modal-save-button flex-1 sm:flex-none rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 sm:px-8 shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
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
