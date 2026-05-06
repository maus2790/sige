'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GiftCardCard } from './gift-card-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift, Plus, Search, Inbox, Send, Clock,
  TrendingUp, ChevronRight, Wallet, Sparkles
} from 'lucide-react';

interface GiftCardWalletProps {
  sent: any[];
  received: any[];
  totalBalance: number;
  stats: {
    totalCards: number;
    sentCount: number;
    receivedCount: number;
    activeCount: number;
    totalBalance: number;
    expiredCount: number;
    redeemedCount: number;
  } | null;
}

export function GiftCardWallet({ sent, received, totalBalance, stats }: GiftCardWalletProps) {
  const [activeTab, setActiveTab] = useState('received');

  const activeReceived = received.filter(c => {
    const exp = c.expiresAt instanceof Date ? c.expiresAt.getTime() : Number(c.expiresAt);
    return c.status === 'active' && exp > Date.now() && c.balance > 0;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO MOBILE: full-width gradient card ── */}
      <div className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
          {/* Title */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Mis Gift Cards</h1>
              <p className="text-[11px] opacity-70">Billetera de regalos SIGE</p>
            </div>
          </div>

          {/* Big balance */}
          <div className="text-center mb-6">
            <p className="text-sm opacity-80 mb-1">Saldo total disponible</p>
            <p className="text-5xl font-black tracking-tighter">
              Bs. {totalBalance.toFixed(2)}
            </p>
            <p className="text-xs opacity-60 mt-2">
              En {activeReceived.length} gift card{activeReceived.length !== 1 ? 's' : ''} activas
            </p>
          </div>

          {/* Action buttons - thumb zone */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              className="h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
            >
              <Link href="/gift-cards/buy">
                <Plus className="h-4 w-4 mr-2" />
                Regalar
              </Link>
            </Button>
            <Button
              asChild
              className="h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
            >
              <Link href="/gift-cards/check">
                <Search className="h-4 w-4 mr-2" />
                Consultar saldo
              </Link>
            </Button>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="h-6 bg-background rounded-t-4xl" />
      </div>

      {/* ── STATS ROW ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-1 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Recibidas', value: stats?.receivedCount ?? 0, sub: `${stats?.activeCount ?? 0} activas`, icon: Inbox, color: 'text-blue-500' },
            { label: 'Enviadas', value: stats?.sentCount ?? 0, sub: 'regalos', icon: Send, color: 'text-purple-500' },
            { label: 'Expiradas', value: stats?.expiredCount ?? 0, sub: 'vencidas', icon: Clock, color: 'text-red-400' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="bg-card rounded-2xl p-3 border shadow-sm text-center">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className="text-xl font-black">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
              <p className="text-[9px] text-muted-foreground/60">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARDS TABS ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-11 rounded-2xl mb-5 bg-muted/60">
            <TabsTrigger value="received" className="flex-1 rounded-xl gap-2 text-sm font-bold data-[state=active]:shadow-sm">
              <Inbox className="h-4 w-4" />
              Recibidas
              {activeReceived.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
                  {activeReceived.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 rounded-xl gap-2 text-sm font-bold data-[state=active]:shadow-sm">
              <Send className="h-4 w-4" />
              Enviadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4 mt-0">
            {received.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-10 w-10" />}
                title="Aún no recibiste ningún regalo"
                description="Cuando alguien te envíe una Gift Card, aparecerá aquí."
                action={{ label: 'Regalar a alguien', href: '/gift-cards/buy' }}
              />
            ) : (
              received.map((gc) => (
                <GiftCardCard key={gc.id} giftCard={gc} type="received" />
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4 mt-0">
            {sent.length === 0 ? (
              <EmptyState
                icon={<Gift className="h-10 w-10" />}
                title="No has enviado ningún regalo"
                description="Sorprende a alguien especial con una Gift Card del mercado SIGE."
                action={{ label: 'Comprar Gift Card', href: '/gift-cards/buy' }}
              />
            ) : (
              sent.map((gc) => (
                <GiftCardCard key={gc.id} giftCard={gc} type="sent" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── FLOATING ACTION - thumb zone ── */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex flex-col gap-3 items-end">
        <Link href="/gift-cards/buy">
          <Button
            size="lg"
            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/30 font-black gap-2 pr-5 group"
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            </div>
            Regalar
          </Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyState({
  icon, title, description, action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{description}</p>
      <Button asChild className="rounded-2xl h-12 font-bold px-6 gap-2">
        <Link href={action.href}>
          {action.label}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
