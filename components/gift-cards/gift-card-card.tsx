'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Gift, AlertCircle, CheckCircle, Calendar, ChevronRight } from 'lucide-react';

const TEMPLATE_GRADIENTS: Record<number, string> = {
  1: 'from-blue-600 to-blue-800',
  2: 'from-gray-700 to-gray-900',
  3: 'from-yellow-500 to-orange-600',
  4: 'from-pink-500 to-rose-600',
};

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
    recipientName?: string | null;
    recipientEmail?: string | null;
  };
  type: 'sent' | 'received';
}

export function GiftCardCard({ giftCard, type }: GiftCardCardProps) {
  const expiresAtMs = giftCard.expiresAt instanceof Date
    ? giftCard.expiresAt.getTime()
    : Number(giftCard.expiresAt);

  const isExpired = expiresAtMs < Date.now();
  const isFullyRedeemed = giftCard.balance === 0;
  const isActive = giftCard.status === 'active' && !isExpired && !isFullyRedeemed;
  const balancePct = Math.round((giftCard.balance / giftCard.amount) * 100);
  const remainingDays = Math.ceil((expiresAtMs - Date.now()) / (1000 * 60 * 60 * 24));
  const gradient = TEMPLATE_GRADIENTS[giftCard.templateId ?? 1] || TEMPLATE_GRADIENTS[1];

  return (
    <Link href={`/gift-cards/${giftCard.id}`} className="block group">
      <div className={`relative w-full rounded-2xl overflow-hidden bg-linear-to-br ${gradient} text-white shadow-lg group-hover:shadow-2xl group-hover:scale-[1.01] transition-all duration-300 cursor-pointer`}>
        {/* Background decoration */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-4 w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                {type === 'sent' ? '📤 Enviada' : '📥 Recibida'}
              </p>
              {type === 'sent' && giftCard.recipientName && (
                <p className="text-xs opacity-80 mt-0.5">Para: {giftCard.recipientName}</p>
              )}
              {type === 'received' && (
                <p className="text-xs opacity-80 mt-0.5">SIGE Gift Card</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isExpired ? (
                <Badge className="bg-red-500/30 text-red-100 border-red-400/30 text-[10px]">
                  <AlertCircle className="h-2.5 w-2.5 mr-1" />Expirada
                </Badge>
              ) : isFullyRedeemed ? (
                <Badge className="bg-white/20 text-white border-white/20 text-[10px]">
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />Canjeada
                </Badge>
              ) : (
                <Badge className="bg-white/20 text-white border-white/20 text-[10px]">
                  <Gift className="h-2.5 w-2.5 mr-1" />Activa
                </Badge>
              )}
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4">
            <p className="text-xs opacity-70 mb-1">{type === 'received' ? 'Saldo disponible' : 'Monto emitido'}</p>
            <p className="text-3xl font-black tracking-tight">
              Bs. {(type === 'received' ? giftCard.balance : giftCard.amount).toFixed(2)}
            </p>
            {type === 'received' && giftCard.balance < giftCard.amount && (
              <p className="text-[10px] opacity-60 mt-0.5">
                de Bs. {giftCard.amount.toFixed(2)} originales
              </p>
            )}
          </div>

          {/* Progress bar (only for received active) */}
          {type === 'received' && isActive && (
            <div className="mb-4">
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${balancePct}%` }}
                />
              </div>
              <p className="text-[10px] opacity-60 mt-1">{balancePct}% de saldo restante</p>
            </div>
          )}

          {/* Message snippet (sent only) */}
          {type === 'sent' && giftCard.message && (
            <p className="text-xs italic opacity-70 line-clamp-1 mb-3">
              "{giftCard.message}"
            </p>
          )}

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] opacity-60">
              <Calendar className="h-3 w-3" />
              {isExpired
                ? `Expiró ${new Date(expiresAtMs).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}`
                : remainingDays > 0
                  ? `Expira en ${remainingDays} días`
                  : 'Expira hoy'}
            </div>
            <div className="flex items-center gap-1 text-[10px] opacity-70 font-bold group-hover:opacity-100 transition-opacity">
              Ver detalle <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}