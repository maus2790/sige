'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Gift, Share2, UserPlus } from 'lucide-react';

interface GiftCardActionsProps {
  giftCardId: string;
  type: 'sent' | 'received';
  status: string;
  balance: number;
  expiresAt: number;
}

export function GiftCardActions({ giftCardId, type, status, balance, expiresAt }: GiftCardActionsProps) {
  const router = useRouter();
  const [transferEmail, setTransferEmail] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  
  const isExpired = expiresAt < Date.now();
  const isActive = status === 'active' && !isExpired && balance > 0;
  
  const handleTransfer = async () => {
    if (!transferEmail) {
      toast.error('Ingresa el email del destinatario');
      return;
    }
    
    setIsTransferring(true);
    
    try {
      const response = await fetch('/api/gift-cards/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftCardId, recipientEmail: transferEmail }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Gift card transferida con éxito');
        setTransferDialogOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Error al transferir');
      }
    } catch (error) {
      toast.error('Error al transferir');
    } finally {
      setIsTransferring(false);
    }
  };
  
  const handleShare = () => {
    const url = `${window.location.origin}/gift-cards/${giftCardId}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };
  
  if (type === 'received' && isActive) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href={`/redeem?card=${giftCardId}`}>
            <Gift className="h-4 w-4 mr-2" />
            Canjear
          </a>
        </Button>
        
        <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Transferir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transferir Gift Card</DialogTitle>
              <DialogDescription>
                Ingresa el email de la persona a quien quieres transferir esta gift card.
                El saldo restante (Bs. {balance.toFixed(2)}) será transferido completamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email del destinatario</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="amigo@ejemplo.com"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleTransfer} disabled={isTransferring}>
                {isTransferring ? 'Transferiendo...' : 'Transferir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </div>
    );
  }
  
  if (type === 'sent') {
    return (
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartir enlace
        </Button>
      </div>
    );
  }
  
  return null;
}