'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Calendar, User, MessageCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { GiftCardActions } from './gift-card-actions';

interface GiftCardDetailProps {
  giftCard: {
    id: string;
    code: string;
    amount: number;
    balance: number;
    expiresAt: number;
    status: string;
    message: string | null;
    createdAt: number;
    deliveredAt: number | null;
    openedAt: number | null;
  };
  userRole: 'sender' | 'recipient';
}

export function GiftCardDetail({ giftCard, userRole }: GiftCardDetailProps) {
  const [showFullCode, setShowFullCode] = useState(false);
  
  const isExpired = giftCard.expiresAt < Date.now();
  const isFullyRedeemed = giftCard.balance === 0;
  const isActive = giftCard.status === 'active' && !isExpired && !isFullyRedeemed;
  
  const getStatusConfig = () => {
    if (isExpired) {
      return { label: 'Expirada', color: 'destructive', icon: AlertCircle };
    }
    if (isFullyRedeemed || giftCard.status === 'redeemed') {
      return { label: 'Canjeada', color: 'secondary', icon: CheckCircle };
    }
    if (giftCard.status === 'blocked') {
      return { label: 'Bloqueada', color: 'destructive', icon: AlertCircle };
    }
    return { label: 'Activa', color: 'default', icon: Gift };
  };
  
  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const maskCode = (code: string) => {
    if (showFullCode) return code;
    const parts = code.split('-');
    return `${parts[0]}-${'•'.repeat(parts[1]?.length || 4)}`;
  };
  
  const formatExpiryMessage = () => {
    const remainingDays = Math.ceil((giftCard.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    if (remainingDays > 0) {
      return `Expira en ${remainingDays} días (${formatDate(giftCard.expiresAt)})`;
    }
    return `Expiró el ${formatDate(giftCard.expiresAt)}`;
  };
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className={`p-6 text-center ${
          isActive ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white' : 'bg-gray-100'
        }`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm mb-4">
            <StatusIcon className="h-3 w-3" />
            <span>{statusConfig.label}</span>
          </div>
          <p className="text-sm opacity-90">Saldo disponible</p>
          <p className="text-5xl font-bold mt-2">Bs. {giftCard.balance.toFixed(2)}</p>
          {giftCard.balance < giftCard.amount && (
            <p className="text-xs opacity-80 mt-2">
              Monto original: Bs. {giftCard.amount.toFixed(2)}
            </p>
          )}
        </div>
        
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <QRCodeSVG value={giftCard.code} size={120} />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Código de la gift card</p>
              <div className="flex items-center gap-2 justify-center mt-1">
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {maskCode(giftCard.code)}
                </code>
                <button
                  onClick={() => setShowFullCode(!showFullCode)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {showFullCode ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            {giftCard.message && (
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Mensaje</span>
                </div>
                <p className="text-right max-w-[60%] italic">"{giftCard.message}"</p>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Fecha de emisión</span>
              </div>
              <p className="text-sm">{formatDate(giftCard.createdAt)}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Fecha de expiración</span>
              </div>
              <p className="text-sm">
                {formatExpiryMessage()}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <GiftCardActions
            giftCardId={giftCard.id}
            type={userRole === 'sender' ? 'sent' : 'received'}
            status={giftCard.status}
            balance={giftCard.balance}
            expiresAt={giftCard.expiresAt}
          />
        </CardContent>
      </Card>
    </div>
  );
}