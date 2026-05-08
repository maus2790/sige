'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Gift, AlertCircle, CheckCircle, Calendar, ChevronRight } from 'lucide-react';

const TEMPLATES = [
  { id: 1, name: 'Azul SIGE', className: 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900' },
  { id: 2, name: 'Noche Oscura', className: 'bg-linear-to-br from-zinc-800 via-zinc-900 to-black' },
  { id: 3, name: 'Oro Real', className: 'bg-linear-to-br from-yellow-400 via-amber-500 to-orange-600' },
  { id: 4, name: 'Amor Eterno', className: 'bg-linear-to-br from-rose-500 via-pink-600 to-fuchsia-700' },
  { id: 5, name: 'Esmeralda', className: 'bg-linear-to-br from-emerald-500 via-green-600 to-teal-800' },
  { id: 6, name: 'Púrpura Galaxia', className: 'bg-linear-to-br from-purple-600 via-violet-700 to-indigo-950' },
  { id: 7, name: 'Atardecer', className: 'bg-linear-to-br from-orange-400 via-red-500 to-rose-600' },
  { id: 8, name: 'Neon Cyber', className: 'bg-zinc-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' },
];

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
  
  const template = TEMPLATES.find(t => t.id === giftCard.templateId) || TEMPLATES[0];

  return (
    <Link href={`/gift-cards/${giftCard.id}`} className="block group">
      <div className={`aspect-[1.9/1] lg:aspect-[1.8/1] w-full max-w-[420px] mx-auto rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white shadow-lg group-hover:shadow-2xl group-hover:scale-[1.01] transition-all duration-700 relative overflow-hidden ring-1 ring-white/20 ${template.className}`}>
        
        {/* Decorative Gift Icon Background */}
        <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-10 pointer-events-none">
          <Gift size={120} />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1 lg:space-y-3 flex-1 min-w-0">
              <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/40">
                <Gift className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
              
              <div className="space-y-0.5 lg:space-y-1">
                <p className="text-[7px] lg:text-[8px] opacity-70 uppercase tracking-widest font-black">
                  {type === 'sent' ? '📤 Enviada a' : '📥 Recibida'}
                </p>
                <p className="text-sm lg:text-lg font-bold truncate leading-none">
                  {type === 'sent' ? (giftCard.recipientName || 'Sin nombre') : 'Para Mí'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[8px] lg:text-[10px] font-black tracking-widest opacity-90 uppercase">SIGE DIGITAL</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {isExpired ? (
                  <Badge variant="outline" className="bg-red-500/30 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">EXPIRADA</Badge>
                ) : isFullyRedeemed ? (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/20 text-[7px] lg:text-[8px] px-1.5 h-4 lg:h-5">CANJEADA</Badge>
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
          {giftCard.message && (
            <div className="bg-black/10 backdrop-blur-sm px-2 py-1 rounded border border-white/5 max-w-[80%] my-1">
              <p className="text-[9px] italic opacity-90 leading-none truncate">
                "{giftCard.message}"
              </p>
            </div>
          )}

          <div className="flex justify-between items-end border-t border-white/10 pt-2 lg:pt-3 mt-auto">
            <div className="space-y-0.5">
              <p className="text-[8px] lg:text-[9px] opacity-80 uppercase tracking-widest font-black">
                {type === 'received' ? 'Saldo Disponible' : 'Monto Enviado'}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xs lg:text-sm font-bold opacity-90">Bs.</span>
                <span className="text-2xl lg:text-4xl font-black tracking-tighter">
                  {(type === 'received' ? giftCard.balance : giftCard.amount).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
               <div className="flex items-center gap-1 text-[8px] lg:text-[10px] opacity-70 font-bold group-hover:translate-x-1 transition-transform">
                Ver detalle <ChevronRight className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
              </div>
              <div className="flex items-center gap-1 text-[7px] lg:text-[8px] opacity-60">
                <Calendar className="h-2.5 w-2.5" />
                {isExpired ? 'Expiró' : 'Expira'}: {new Date(expiresAtMs).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}