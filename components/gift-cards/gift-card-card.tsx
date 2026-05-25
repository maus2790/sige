'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, AlertCircle, CheckCircle, Calendar, ChevronRight, Send, Cake, Heart, GraduationCap, CalendarDays, Baby, Handshake, TreePine, Sparkles, Home, PartyPopper, Download, Eye, X, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { deleteGiftCard } from '@/app/actions/gift-cards';
import { toast } from 'sonner';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from './gift-card-templates';

import { GiftCardSendDialog } from './gift-card-send-dialog';

interface GiftCardCardProps {
  giftCard: {
    id: string;
    code: string;
    amount: number;
    balance: number;
    expiresAt: Date | number;
    status: string;
    message: string | null;
    templateId?: number | null;
    occasion?: string | null;
    recipientId?: string | null;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
    recipientName?: string | null;
    cardImageUrl?: string | null;
  };
  type: 'sent' | 'received' | 'saved';
}

export function GiftCardCard({ giftCard, type }: GiftCardCardProps) {
  const expiresAtMs = giftCard.expiresAt instanceof Date
    ? giftCard.expiresAt.getTime()
    : Number(giftCard.expiresAt);

  const isExpired = expiresAtMs < Date.now();
  const isFullyRedeemed = giftCard.balance <= 0;
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente esta tarjeta?')) return;
    
    setIsDeleting(true);
    const result = await deleteGiftCard(giftCard.id);
    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success('Tarjeta eliminada correctamente');
      setShowPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!giftCard.cardImageUrl) return;
    try {
      const response = await fetch(giftCard.cardImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gift-card-${giftCard.code}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  const getOccasionIcon = (occ: string | null | undefined) => {
    switch (occ) {
      case 'cumpleaños': return <Cake className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'boda': return <Heart className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'graduación': return <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'aniversario': return <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'nacimiento': return <Baby className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'agradecimiento': return <Handshake className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'navidad': return <TreePine className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'san valentín': return <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'hogar': return <Home className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'otros': return <PartyPopper className="h-4 w-4 lg:h-5 lg:w-5" />;
      default: return <Gift className="h-4 w-4 lg:h-5 lg:w-5" />;
    }
  };

  const isActive = giftCard.status === 'active' && !isExpired && !isFullyRedeemed;
  const balancePct = Math.round((giftCard.balance / giftCard.amount) * 100);
  const remainingDays = Math.ceil((expiresAtMs - Date.now()) / (1000 * 60 * 60 * 24));
  
  const template = getGiftCardTemplate(giftCard.templateId);
  const deliveryLabel = type === 'saved'
    ? 'Guardada'
    : giftCard.recipientPhone
      ? 'WhatsApp'
      : giftCard.recipientId
        ? 'SIGE'
        : giftCard.recipientEmail
          ? 'Email'
          : null;

  return (
    <div className="block group">
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogTrigger asChild>
          <div className={`aspect-[1.9/1] lg:aspect-[1.8/1] w-full max-w-[420px] mx-auto rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white shadow-lg group-hover:shadow-2xl group-hover:scale-[1.01] transition-all duration-700 relative overflow-hidden ring-1 ring-white/20 cursor-pointer card-shine ${template.className}`}>
            
            {/* Decorative Gift Icon Background */}
            <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-10 pointer-events-none">
              <Gift size={120} />
            </div>

            {(isExpired || isFullyRedeemed) && (
              <Button
                variant="destructive"
                size="icon"
                className={`absolute top-4 right-4 z-30 h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-red-600/80 hover:bg-red-600 border border-white/20 backdrop-blur-md shadow-xl transition-all ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                onClick={handleDelete}
                disabled={isDeleting}
                title="Eliminar tarjeta"
              >
                <Trash2 className="h-4 w-4 lg:h-4 lg:w-4 text-white" />
              </Button>
            )}

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1 lg:space-y-3 flex-1 min-w-0">
                  <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/40">
                    {getOccasionIcon(giftCard.occasion)}
                  </div>
                  
                  <div className="space-y-0.5 lg:space-y-1">
                    <p className="text-[7px] lg:text-[8px] opacity-70 uppercase tracking-widest font-black">
                      {type === 'sent' ? '📤 Enviada a' : type === 'received' ? '📥 Recibida' : '💾 Guardada'}
                    </p>
                    <p className="text-sm lg:text-lg font-bold truncate leading-none">
                      {type === 'sent' ? (giftCard.recipientName || 'Sin nombre') : type === 'received' ? 'Para Mí' : (giftCard.recipientName || 'Mi Inventario')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[8px] lg:text-[10px] font-black tracking-widest opacity-90 uppercase">SIGE DIGITAL</p>
                  <p className="text-[6px] lg:text-[7px] font-bold opacity-60 tracking-wider">
                    {getGiftCardTemplate(giftCard.templateId).name || 'PLATINUM CARD'}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    {deliveryLabel && (
                      <Badge variant="outline" className="bg-white/20 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">
                        {deliveryLabel}
                      </Badge>
                    )}
                    {isExpired ? (
                      <Badge variant="outline" className="bg-red-500/30 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">EXPIRADA</Badge>
                    ) : isFullyRedeemed ? (
                      <Badge variant="outline" className="bg-white/20 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">CANJEADA</Badge>
                    ) : type === 'saved' ? (
                      <Badge variant="outline" className="bg-amber-500/30 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">GUARDADA</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/30 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">ACTIVA</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Código de Canje Centrado Superior */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <p className="text-[6px] lg:text-[7px] opacity-60 uppercase tracking-[0.2em] font-bold mb-0.5">Código</p>
                <p className="text-[9px] lg:text-[11px] font-mono font-black tracking-widest bg-white/15 px-3 py-0.5 lg:py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                  {giftCard.code}
                </p>
              </div>


              {/* Message snippet if exists */}
              {giftCard.message && type !== 'saved' && (
                <div className="bg-black/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 w-full my-2">
                  <p className="text-[10px] italic opacity-90 leading-none text-center whitespace-nowrap overflow-hidden">
                    "{giftCard.message.slice(0, 60)}"
                  </p>
                </div>
              )}

              <div className="flex justify-between items-end border-t border-white/10 pt-2 lg:pt-3 mt-auto">
                <div className="space-y-0.5">
                  <p className="text-[8px] lg:text-[9px] opacity-80 uppercase tracking-widest font-black">
                    {type === 'received' ? 'Saldo Disponible' : 'Monto de Tarjeta'}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs lg:text-sm font-bold opacity-90">Bs.</span>
                    <span className="text-2xl lg:text-4xl font-black tracking-tighter">
                      {(type === 'received' ? giftCard.balance : giftCard.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                   <div className="flex items-center gap-1 text-[8px] lg:text-[10px] opacity-70 font-bold group-hover:opacity-100 transition-opacity">
                    Click para opciones <Eye className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                  </div>
                  <div className="flex items-center gap-1 text-[7px] lg:text-[8px] opacity-60">
                    <Calendar className="h-2.5 w-2.5" />
                    {isExpired ? 'Expiró' : 'Expira'}: {new Date(expiresAtMs).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 p-0 overflow-hidden">
          <DialogHeader className={`p-6 pb-4 text-left ${template.className}`}>
            <DialogTitle className="text-lg font-bold text-white mb-1">Opciones de Tarjeta</DialogTitle>
            <DialogDescription className="text-white/60 text-xs">Visualiza o descarga tu tarjeta de regalo personalizada.</DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {giftCard.cardImageUrl ? (
              <div className="relative group/preview rounded-xl overflow-hidden border border-white/10 shadow-2xl aspect-[1.8/1]">
                <img 
                  src={giftCard.cardImageUrl} 
                  alt="Gift Card Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    className="bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/30"
                    onClick={() => window.open(giftCard.cardImageUrl!, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ampliar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border-2 border-dashed border-white/5 rounded-xl p-8 text-center space-y-2">
                <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Gift className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium">No hay imagen generada</p>
                <p className="text-xs text-muted-foreground">Esta tarjeta fue creada antes de habilitar las capturas.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                variant="outline" 
                className="rounded-xl h-11 border-white/10 hover:bg-white/5"
                onClick={handleDownload}
                disabled={!giftCard.cardImageUrl}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
              <Link href={`/gift-cards/${giftCard.id}`} className="w-full">
                <Button className="w-full rounded-xl h-11 bg-white text-black hover:bg-zinc-200">
                  Ver Detalles
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Area for Saved Cards - Now BELOW the card and SMALLER */}
      {type === 'saved' && isActive && (
        <div className="mt-4 flex justify-center animate-in slide-in-from-top-4 duration-500">
           <GiftCardSendDialog 
             giftCard={giftCard} 
             trigger={
               <Button className="gift-card-primary-action bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-blue-500/10 border border-white/10 uppercase tracking-wider text-[10px] gap-2">
                 <Send className="h-3.5 w-3.5" />
                 Enviar este Regalo
               </Button>
             }
           />
        </div>
      )}
    </div>
  );
}
