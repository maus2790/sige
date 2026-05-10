'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Mail, MessageCircle, User, Check, 
  ChevronRight, Sparkles, Clock 
} from 'lucide-react';
import { toast } from 'sonner';
import { getSIGEUsers, updateGiftCardRecipient } from '@/app/actions/gift-cards';

interface GiftCardSendDialogProps {
  giftCard: {
    id: string;
    code: string;
    amount: number;
    recipientName?: string | null;
    recipientEmail?: string | null;
    message?: string | null;
  };
  trigger?: React.ReactNode;
}

export function GiftCardSendDialog({ giftCard, trigger }: GiftCardSendDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp' | 'sige'>('email');
  const [recipientName, setRecipientName] = useState(giftCard.recipientName || '');
  const [recipientEmail, setRecipientEmail] = useState(giftCard.recipientEmail || '');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [sigeUsers, setSigeUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open && sigeUsers.length === 0) {
      getSIGEUsers().then(setSigeUsers);
    }
  }, [open, sigeUsers.length]);

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await updateGiftCardRecipient({
        giftCardId: giftCard.id,
        recipientName,
        recipientEmail: deliveryMethod === 'sige' ? (sigeUsers.find(u => u.id === recipientId)?.email || '') : recipientEmail,
        recipientId: deliveryMethod === 'sige' ? recipientId : undefined,
      });

      if (result.success) {
        if (deliveryMethod === 'whatsapp') {
          const text = `¡Hola ${recipientName}! Te he enviado una Gift Card de SIGE por Bs. ${giftCard.amount.toFixed(2)}. \n\nCódigo de Canje: ${giftCard.code}\n\nMensaje: "${giftCard.message || '¡Disfruta tu regalo!'}"\n\nPuedes canjearlo en: ${window.location.origin}/gift-cards/check`;
          const cleanNumber = whatsappNumber.replace(/\D/g, '');
          const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
          window.open(url, '_blank');
        }
        
        toast.success('¡Gift Card enviada con éxito!');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Error al enviar la Gift Card');
      }
    } catch (error) {
      toast.error('Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-xl">
            <Send className="h-3.5 w-3.5" />
            Enviar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <div className={`p-6 text-white ${
          deliveryMethod === 'whatsapp' ? 'bg-green-600' : 
          deliveryMethod === 'sige' ? 'bg-purple-600' : 'bg-[#EA4335]'
        } transition-colors duration-500`}>
          <DialogHeader>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 border border-white/30 backdrop-blur-md">
              <Send className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">Enviar Gift Card</DialogTitle>
            <DialogDescription className="text-white/80">
              Configura el destinatario y el medio de envío.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sendName">Nombre del destinatario</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="sendName"
                  placeholder="Nombre completo..."
                  className="pl-10 h-12 rounded-xl"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>¿Cómo quieres enviarlo?</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                  className={`h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'email' ? 'bg-[#EA4335] hover:bg-[#D93025]' : ''}`}
                  onClick={() => setDeliveryMethod('email')}
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Por Email</span>
                </Button>
                <Button
                  type="button"
                  variant={deliveryMethod === 'whatsapp' ? 'default' : 'outline'}
                  className={`h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => setDeliveryMethod('whatsapp')}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </Button>
                <Button
                  type="button"
                  variant={deliveryMethod === 'sige' ? 'default' : 'outline'}
                  className={`h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  onClick={() => setDeliveryMethod('sige')}
                >
                  <User className="h-4 w-4" />
                  <span className="text-[10px] font-bold">Usuario SIGE</span>
                </Button>
              </div>
            </div>

            {deliveryMethod === 'email' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="sendEmail">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="sendEmail"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="pl-10 h-12 rounded-xl"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {deliveryMethod === 'whatsapp' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="sendWa">Número de WhatsApp</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="sendWa"
                    type="tel"
                    placeholder="+591 7XXXXXXX"
                    className="pl-10 h-12 rounded-xl"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {deliveryMethod === 'sige' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="sendSigeUser">Seleccionar Usuario SIGE</Label>
                <select
                  id="sendSigeUser"
                  className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                  <option value="">Selecciona un usuario...</option>
                  {sigeUsers.map(user => (
                    <option key={user.id} value={user.id}>
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
                deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 
                deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 
                'bg-[#EA4335] hover:bg-[#D93025] shadow-red-500/20'
              }`}
              onClick={handleSend}
              disabled={
                loading || 
                !recipientName || 
                (deliveryMethod === 'email' && !recipientEmail) || 
                (deliveryMethod === 'whatsapp' && !whatsappNumber) ||
                (deliveryMethod === 'sige' && !recipientId)
              }
            >
              {loading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {deliveryMethod === 'email' ? 'Enviar por Email' : 
                   deliveryMethod === 'whatsapp' ? 'Enviar por WhatsApp' : 'Enviar a Usuario SIGE'}
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
