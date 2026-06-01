'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, AlertCircle, CheckCircle, Calendar, ChevronRight, Send, Cake, Heart, GraduationCap, CalendarDays, Baby, Handshake, TreePine, Sparkles, Home, PartyPopper, Download, Eye, X, Trash2, ArrowLeft, Wallet, Mail, MessageCircle, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { deleteGiftCard, getSIGEUsers, updateGiftCardRecipient } from '@/app/actions/gift-cards';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from './gift-card-templates';
import { CUSTOM_CARD_ICONS } from './gift-card-designer';

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
    customStyle?: string | null;
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

  const router = useRouter();
  
  // Redesigned modal states
  const [isRegalarMode, setIsRegalarMode] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Delivery Form State
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp' | 'sige'>(
    giftCard.recipientPhone ? 'whatsapp' : giftCard.recipientId ? 'sige' : 'email'
  );
  const [recipientName, setRecipientName] = useState(giftCard.recipientName || '');
  const [recipientEmail, setRecipientEmail] = useState(giftCard.recipientEmail || '');
  const [whatsappNumber, setWhatsappNumber] = useState(giftCard.recipientPhone || '');
  const [recipientId, setRecipientId] = useState<string>(giftCard.recipientId || '');
  const [sigeUsers, setSigeUsers] = useState<any[]>([]);

  // Load SIGE users when Regalar mode is activated
  useEffect(() => {
    if (isRegalarMode && sigeUsers.length === 0) {
      getSIGEUsers().then(setSigeUsers);
    }
  }, [isRegalarMode, sigeUsers.length]);

  const handleOpenChange = (open: boolean) => {
    setShowPreview(open);
    if (!open) {
      setIsRegalarMode(false);
      setIsCheckingBalance(false);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await updateGiftCardRecipient({
        giftCardId: giftCard.id,
        recipientName,
        recipientEmail: deliveryMethod === 'sige' ? (sigeUsers.find(u => u.id === recipientId)?.email || '') : recipientEmail,
        recipientId: deliveryMethod === 'sige' ? recipientId : undefined,
        recipientPhone: deliveryMethod === 'whatsapp' ? whatsappNumber : undefined,
      });

      if (result.success) {
        if (deliveryMethod === 'whatsapp') {
          const text = `¡Hola ${recipientName}! Te he enviado una Gift Card de SIGE por Bs. ${giftCard.amount.toFixed(2)}. \n\nCódigo de Canje: ${giftCard.code}\n\nMensaje: "${giftCard.message || '¡Disfruta tu regalo!'}"\n\nPuedes canjearlo en: ${window.location.origin}/gift-cards/check`;
          const cleanNumber = whatsappNumber.replace(/\D/g, '');
          const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
          window.open(url, '_blank');
        }
        
        toast.success('¡Gift Card enviada con éxito!');
        setShowPreview(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Error al enviar la Gift Card');
      }
    } catch (error) {
      toast.error('Algo salió mal');
    } finally {
      setIsSending(false);
    }
  };

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

  const getOccasionIconComponent = (occ: string | null | undefined) => {
    switch (occ) {
      case 'cumpleaños': return Cake;
      case 'boda': return Heart;
      case 'graduación': return GraduationCap;
      case 'aniversario': return CalendarDays;
      case 'nacimiento': return Baby;
      case 'agradecimiento': return Handshake;
      case 'navidad': return TreePine;
      case 'san valentín': return Sparkles;
      case 'hogar': return Home;
      case 'otros': return PartyPopper;
      default: return Gift;
    }
  };

  let customBgStyle: React.CSSProperties = {};
  let cfg: any = {};
  if (giftCard.templateId === 99) {
    try {
      cfg = giftCard.customStyle ? JSON.parse(giftCard.customStyle) : {};
      const colors = cfg.colors && Array.isArray(cfg.colors) 
        ? cfg.colors 
        : [cfg.color1 || '#ec4899', cfg.color2 || '#8b5cf6'];
      const angle = cfg.angle ?? 135;
      
      if (cfg.type === 'radial') {
        customBgStyle = { background: `radial-gradient(circle, ${colors.join(', ')})` };
      } else if (cfg.type === 'conic') {
        customBgStyle = { background: `conic-gradient(from ${angle}deg at center, ${colors.join(', ')})` };
      } else if (cfg.type === 'reflected') {
        const mirroredColors = [...colors, ...colors.slice(0, -1).reverse()];
        customBgStyle = { background: `linear-gradient(${angle}deg, ${mirroredColors.join(', ')})` };
      } else if (cfg.type === 'diamond') {
        const quad = [...colors, ...colors.slice(1, -1).reverse()];
        const fullCycle = [...quad, ...quad, ...quad, ...quad, colors[0]];
        const stops = fullCycle.map((color, index) => {
          const pct = (index / (fullCycle.length - 1)) * 100;
          return `${color} ${pct}%`;
        });
        customBgStyle = { background: `conic-gradient(from 45deg at center, ${stops.join(', ')})` };
      } else {
        customBgStyle = { background: `linear-gradient(${angle}deg, ${colors.join(', ')})` };
      }
    } catch (e) {
      customBgStyle = { background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' };
    }
  }

  const BadgeIconComponent = giftCard.templateId === 99 && cfg.iconId && CUSTOM_CARD_ICONS[cfg.iconId] 
    ? CUSTOM_CARD_ICONS[cfg.iconId] 
    : getOccasionIconComponent(giftCard.occasion);

  const WatermarkIconComponent = giftCard.templateId === 99 && cfg.bgIconId && CUSTOM_CARD_ICONS[cfg.bgIconId] 
    ? CUSTOM_CARD_ICONS[cfg.bgIconId] 
    : Gift;

  const isActive = giftCard.status === 'active' && !isExpired && !isFullyRedeemed;
  
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
      <Dialog open={showPreview} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <div 
            className={`aspect-[1.9/1] lg:aspect-[1.8/1] w-full max-w-[420px] mx-auto rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white shadow-lg group-hover:shadow-2xl group-hover:scale-[1.01] transition-all duration-700 relative overflow-hidden ring-1 ring-white/20 cursor-pointer card-shine ${giftCard.templateId === 99 ? '' : template.className}`}
            style={giftCard.templateId === 99 ? customBgStyle : undefined}
          >
            
            {/* Decorative Gift Icon Background */}
            <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-10 pointer-events-none">
              <WatermarkIconComponent size={120} />
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
                    <BadgeIconComponent className="h-4 w-4 lg:h-5 lg:w-5" />
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
                    {giftCard.templateId === 99 ? 'PERSONALIZADA' : (template.name || 'PLATINUM CARD')}
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
                    ) : giftCard.status === 'pending_payment' ? (
                      <Badge variant="outline" className="bg-amber-500/50 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">EN VERIFICACIÓN</Badge>
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

        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 p-0 overflow-hidden text-white">
          <DialogHeader className={`p-6 pb-4 text-left ${
            isRegalarMode 
              ? (deliveryMethod === 'whatsapp' ? 'bg-green-600' : deliveryMethod === 'sige' ? 'bg-purple-600' : 'bg-[#EA4335]')
              : isCheckingBalance 
                ? 'bg-blue-600' 
                : template.className
          } transition-colors duration-500`}>
            <div className="flex items-center gap-3">
              {(isRegalarMode || isCheckingBalance) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-white/15 text-white p-0 border border-white/10"
                  onClick={() => {
                    if (isRegalarMode) setIsRegalarMode(false);
                    else if (isCheckingBalance) setIsCheckingBalance(false);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-lg font-bold text-white mb-0.5">
                  {isRegalarMode 
                    ? 'Enviar Gift Card' 
                    : isCheckingBalance 
                      ? 'Consulta de Saldo' 
                      : 'Opciones de Tarjeta'}
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs">
                  {isRegalarMode 
                    ? 'Configura el destinatario y el medio de envío.' 
                    : isCheckingBalance 
                      ? 'Verifica el saldo disponible y consumido de tu tarjeta.' 
                      : 'Visualiza, descarga, regala o consulta el saldo de tu tarjeta.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {isRegalarMode ? (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sendNameModal" className="text-zinc-400 text-xs font-bold">Nombre del destinatario</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="sendNameModal"
                      placeholder="Nombre completo..."
                      className="pl-10 h-12 rounded-xl bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 focus:border-purple-500"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-zinc-400 text-xs font-bold">¿Cómo quieres enviarlo?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                      className={`h-14 flex flex-col gap-1 rounded-xl px-1 border-white/10 ${deliveryMethod === 'email' ? 'bg-[#EA4335] hover:bg-[#D93025] text-white border-none' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setDeliveryMethod('email')}
                    >
                      <Mail className="h-4 w-4" />
                      <span className="text-[10px] font-bold">Por Email</span>
                    </Button>
                    <Button
                      type="button"
                      variant={deliveryMethod === 'whatsapp' ? 'default' : 'outline'}
                      className={`h-14 flex flex-col gap-1 rounded-xl px-1 border-white/10 ${deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 text-white border-none' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setDeliveryMethod('whatsapp')}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-[10px] font-bold">WhatsApp</span>
                    </Button>
                    <Button
                      type="button"
                      variant={deliveryMethod === 'sige' ? 'default' : 'outline'}
                      className={`h-14 flex flex-col gap-1 rounded-xl px-1 border-white/10 ${deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700 text-white border-none' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setDeliveryMethod('sige')}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span className="text-[10px] font-bold">Usuario SIGE</span>
                    </Button>
                  </div>
                </div>

                {deliveryMethod === 'email' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="sendEmailModal" className="text-zinc-400 text-xs font-bold">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="sendEmailModal"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="pl-10 h-12 rounded-xl bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {deliveryMethod === 'whatsapp' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="sendWaModal" className="text-zinc-400 text-xs font-bold">Número de WhatsApp</Label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="sendWaModal"
                        type="tel"
                        placeholder="+591 7XXXXXXX"
                        className="pl-10 h-12 rounded-xl bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 focus:border-green-500"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {deliveryMethod === 'sige' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="sendSigeUserModal" className="text-zinc-400 text-xs font-bold">Seleccionar Usuario SIGE</Label>
                    <select
                      id="sendSigeUserModal"
                      className="w-full h-12 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      value={recipientId}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setRecipientId(uid);
                        const user = sigeUsers.find(u => u.id === uid);
                        if (user) {
                          setRecipientName(user.name);
                          setRecipientEmail(user.email);
                        }
                      }}
                    >
                      <option value="" className="bg-zinc-950 text-white">Selecciona un usuario...</option>
                      {sigeUsers.map(user => (
                        <option key={user.id} value={user.id} className="bg-zinc-950 text-white">
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  className={`h-14 text-lg font-bold gap-2 rounded-2xl shadow-lg transition-all ${
                    deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20 text-white animate-pulse' : 
                    deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 text-white' : 
                    'bg-[#EA4335] hover:bg-[#D93025] shadow-red-500/20 text-white'
                  }`}
                  onClick={handleSend}
                  disabled={
                    isSending || 
                    !recipientName || 
                    (deliveryMethod === 'email' && !recipientEmail) || 
                    (deliveryMethod === 'whatsapp' && !whatsappNumber) ||
                    (deliveryMethod === 'sige' && !recipientId)
                  }
                >
                  {isSending ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      {deliveryMethod === 'email' ? 'Enviar por Email' : 
                       deliveryMethod === 'whatsapp' ? 'Enviar por WhatsApp' : 'Enviar a Usuario SIGE'}
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="hover:bg-white/5 text-zinc-400 rounded-xl"
                  onClick={() => setIsRegalarMode(false)} 
                  disabled={isSending}
                >
                  Atrás
                </Button>
              </div>
            </div>
          ) : isCheckingBalance ? (
            <div className="p-6 space-y-6">
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Wallet className="h-8 w-8" />
                </div>
                
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Saldo Disponible</p>
                  <p className="text-3xl font-black text-white mt-1">
                    Bs. {giftCard.balance.toFixed(2)}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Consumido: Bs. {(giftCard.amount - giftCard.balance).toFixed(2)}</span>
                    <span>Monto Total: Bs. {giftCard.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(giftCard.balance / giftCard.amount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Details table */}
                <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-4 text-left text-xs">
                  <div>
                    <p className="text-zinc-500 font-bold">Código de Canje</p>
                    <p className="font-mono text-zinc-300 font-bold text-sm mt-0.5">{giftCard.code}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 font-bold">Estado</p>
                    <p className="font-bold text-zinc-300 mt-0.5 uppercase flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-zinc-500'}`} />
                      {isActive ? 'Activa / Disponible' : 'Inactiva / Canjeada'}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full rounded-xl h-11 border-white/10 hover:bg-white/5"
                onClick={() => setIsCheckingBalance(false)}
              >
                Volver a Opciones
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {giftCard.cardImageUrl ? (
                <div className="relative group/preview rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[1.8/1] max-w-[380px] mx-auto">
                  <img 
                    src={giftCard.cardImageUrl} 
                    alt="Gift Card Preview" 
                    className="w-full h-full object-cover animate-in zoom-in duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button 
                      variant="outline" 
                      className="bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/30 rounded-xl"
                      onClick={() => window.open(giftCard.cardImageUrl!, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ampliar
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`aspect-[1.8/1] w-full max-w-[380px] mx-auto rounded-2xl p-4 text-white shadow-xl relative overflow-hidden ring-1 ring-white/20 ${giftCard.templateId === 99 ? '' : template.className}`}
                  style={giftCard.templateId === 99 ? customBgStyle : undefined}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <WatermarkIconComponent size={90} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/40">
                          <BadgeIconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[6px] opacity-70 uppercase tracking-widest font-black">SIGE DIGITAL</p>
                          <p className="text-[8px] font-bold opacity-60">
                            {giftCard.templateId === 99 ? 'PERSONALIZADA' : (template.name || 'PLATINUM CARD')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-mono font-black tracking-widest bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20">
                          {giftCard.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-end border-t border-white/10 pt-2">
                      <div>
                        <p className="text-[8px] opacity-80 uppercase tracking-widest font-black">Saldo Disponible</p>
                        <p className="text-xl font-black">Bs. {giftCard.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Three buttons grid */}
              <div className={`grid ${type === 'sent' ? 'grid-cols-2' : 'grid-cols-3'} gap-3 pt-2`}>
                <Button 
                  variant="outline" 
                  className="rounded-xl h-14 flex flex-col gap-1 border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-bold"
                  onClick={handleDownload}
                  disabled={!giftCard.cardImageUrl}
                >
                  <Download className="h-4 w-4 text-blue-400" />
                  Descargar
                </Button>

                <Button 
                  variant="outline" 
                  className="rounded-xl h-14 flex flex-col gap-1 border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-bold"
                  onClick={() => setIsCheckingBalance(true)}
                >
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  Saldo
                </Button>

                {type !== 'sent' && (
                  <Button 
                    className="rounded-xl h-14 flex flex-col gap-1 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border border-white/10 shadow-lg shadow-purple-500/10 text-xs font-bold"
                    onClick={() => setIsRegalarMode(true)}
                    disabled={!isActive}
                  >
                    <Send className="h-4 w-4 text-white" />
                    Regalar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
