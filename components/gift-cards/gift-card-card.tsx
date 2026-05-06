'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

interface GiftCardCardProps {
  giftCard: {
    id: string;
    code: string;
    amount: number;
    balance: number;
    expiresAt: number;
    status: string;
    message: string | null;
  };
  type: 'sent' | 'received';
}

export function GiftCardCard({ giftCard, type }: GiftCardCardProps) {
  const isExpired = giftCard.expiresAt < Date.now();
  const isFullyRedeemed = giftCard.balance === 0;
  const isActive = giftCard.status === 'active' && !isExpired && !isFullyRedeemed;
  
  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Expirada</Badge>;
    }
    if (isFullyRedeemed || giftCard.status === 'redeemed') {
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" />Canjeada</Badge>;
    }
    if (giftCard.status === 'blocked') {
      return <Badge variant="destructive">Bloqueada</Badge>;
    }
    return <Badge variant="default" className="bg-green-500 gap-1"><Gift className="h-3 w-3" />Activa</Badge>;
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const remainingDays = Math.ceil((giftCard.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <Link href={`/gift-cards/${giftCard.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {type === 'sent' ? 'Enviada' : 'Recibida'}
              </p>
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="mt-3">
            <p className="text-2xl font-bold">
              {type === 'received' ? 'Bs. ' + giftCard.balance.toFixed(2) : 'Bs. ' + giftCard.amount.toFixed(2)}
            </p>
            {type === 'received' && giftCard.balance < giftCard.amount && (
              <p className="text-xs text-muted-foreground">
                Original: Bs. {giftCard.amount.toFixed(2)}
              </p>
            )}
          </div>
          
          {type === 'received' && isActive && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {remainingDays > 0 
                  ? `Expira en ${remainingDays} días`
                  : `Expirada el ${formatDate(giftCard.expiresAt)}`}
              </span>
            </div>
          )}
          
          {type === 'sent' && giftCard.message && (
            <div className="mt-2 text-xs text-muted-foreground line-clamp-1">
              "{giftCard.message}"
            </div>
          )}
          
          {type === 'received' && isActive && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${(giftCard.balance / giftCard.amount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}