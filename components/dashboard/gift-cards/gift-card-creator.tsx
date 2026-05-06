"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Gift, Camera, Video, UploadCloud, X, Cake, Heart, GraduationCap, PartyPopper, Pencil } from "lucide-react";
import { createGiftCard, updateGiftCard } from "@/app/actions/gift-cards";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

const TEMPLATES = [
  { id: "general", label: "General", icon: Gift, color: "bg-blue-500 text-blue-500" },
  { id: "birthday", label: "Cumpleaños", icon: Cake, color: "bg-pink-500 text-pink-500" },
  { id: "anniversary", label: "Aniversario", icon: Heart, color: "bg-red-500 text-red-500" },
  { id: "graduation", label: "Graduación", icon: GraduationCap, color: "bg-indigo-500 text-indigo-500" },
  { id: "wedding", label: "Boda", icon: PartyPopper, color: "bg-amber-500 text-amber-500" },
] as const;

type TemplateID = typeof TEMPLATES[number]["id"];

interface GiftCardCreatorProps {
  editingCard?: any;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function GiftCardCreator({ editingCard, onSuccess, trigger }: GiftCardCreatorProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState("");
  const [templateType, setTemplateType] = useState<TemplateID>("general");
  const [dedicationMessage, setDedicationMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCard && open) {
      setAmount(editingCard.initialAmount.toString());
      setTemplateType(editingCard.templateType || "general");
      setDedicationMessage(editingCard.dedicationMessage || "");
      setExistingPhotoUrl(editingCard.photoUrl);
      setExistingVideoUrl(editingCard.videoUrl);
    }
  }, [editingCard, open]);

  const handleFileUpload = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error subiendo archivo");
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor ingresa un monto válido.");
      return;
    }

    setIsLoading(true);

    try {
      let photoUrl = existingPhotoUrl;
      let videoUrl = existingVideoUrl;

      if (photoFile) {
        toast.info("Subiendo foto...");
        photoUrl = await handleFileUpload(photoFile, "gift-cards/photos");
      }

      if (videoFile) {
        toast.info("Subiendo video...");
        videoUrl = await handleFileUpload(videoFile, "gift-cards/videos");
      }

      const cardData = {
        amount: numAmount,
        templateType,
        dedicationMessage: dedicationMessage.trim() || null,
        photoUrl,
        videoUrl
      };

      let result;
      if (editingCard) {
        result = await updateGiftCard({ id: editingCard.id, ...cardData });
      } else {
        result = await createGiftCard(cardData);
      }

      if (result.success) {
        toast.success(editingCard ? "Tarjeta actualizada" : `Tarjeta creada: ${(result as any).card?.code}`);
        setOpen(false);
        if (!editingCard) resetForm();
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al procesar la tarjeta");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setTemplateType("general");
    setDedicationMessage("");
    setPhotoFile(null);
    setVideoFile(null);
    setExistingPhotoUrl(null);
    setExistingVideoUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val && !editingCard) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-2xl h-12 px-6 bg-brand-gradient border-none font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Tarjeta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black">
              {editingCard ? "Editar Gift Card" : "Personalizar Gift Card"}
            </DialogTitle>
            <DialogDescription>
              {editingCard ? "Modifica los detalles de esta tarjeta." : "Crea una tarjeta única. Selecciona una temática y añade multimedia."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="font-bold">Monto de la Tarjeta (Bs.)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Bs.</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-12 h-14 rounded-2xl text-lg font-bold bg-muted/50 border-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Plantillas */}
            <div className="space-y-3">
              <Label className="font-bold">Motivo / Plantilla</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const isSelected = templateType === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateType(tpl.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-md scale-105" 
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className={cn("p-2 rounded-full", isSelected ? tpl.color.split(' ')[0] + " text-white" : "bg-background " + tpl.color.split(' ')[1])}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-center leading-tight">{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dedicatoria */}
            <div className="space-y-2">
              <Label htmlFor="dedication" className="font-bold">Mensaje de Dedicatoria (Opcional)</Label>
              <Textarea
                id="dedication"
                placeholder="Escribe unas palabras para quien reciba la tarjeta..."
                className="resize-none rounded-2xl bg-muted/50 border-none min-h-[100px]"
                value={dedicationMessage}
                onChange={(e) => setDedicationMessage(e.target.value)}
              />
            </div>

            {/* Multimedia */}
            <div className="space-y-3">
              <Label className="font-bold">Multimedia (Opcional)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Foto */}
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={photoInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPhotoFile(e.target.files[0]);
                        setExistingPhotoUrl(null);
                      }
                    }}
                  />
                  {photoFile || existingPhotoUrl ? (
                    <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border">
                      <Image 
                        src={photoFile ? URL.createObjectURL(photoFile) : existingPhotoUrl!} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setExistingPhotoUrl(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-24 rounded-2xl border-dashed flex flex-col gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-xs font-semibold">Tomar / Subir Foto</span>
                    </Button>
                  )}
                </div>

                {/* Video */}
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    accept="video/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={videoInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.size > 20 * 1024 * 1024) {
                          toast.error("El video no puede superar los 20MB.");
                          return;
                        }
                        setVideoFile(file);
                        setExistingVideoUrl(null);
                      }
                    }}
                  />
                  {videoFile || existingVideoUrl ? (
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border flex items-center justify-center">
                      <Video className="w-8 h-8 text-white/50" />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-[10px] p-1.5 rounded text-center truncate">
                        {videoFile ? videoFile.name : "Video cargado"}
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setExistingVideoUrl(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="h-24 rounded-2xl border-dashed flex flex-col gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Video className="w-6 h-6" />
                      <span className="text-xs font-semibold">Grabar / Subir Video</span>
                    </Button>
                  )}
                </div>

              </div>
            </div>

          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl font-black text-lg bg-brand-gradient shadow-xl hover:shadow-2xl transition-all" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {editingCard ? <Pencil className="w-6 h-6 mr-2" /> : <Gift className="w-6 h-6 mr-2" />}
                  {editingCard ? "Guardar Cambios" : "Generar Tarjeta"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
