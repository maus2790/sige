'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { GiftCardBottomNav } from './gift-card-bottom-nav';
import { GiftCardCard } from './gift-card-card';
import { RechargeDialog } from './recharge-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift, Send, Clock,
  TrendingUp, ChevronRight, Wallet, Sparkles, Inbox
} from 'lucide-react';

interface GiftCardWalletProps {
  sent: any[];
  received: any[];
  saved?: any[];
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

export function GiftCardWallet({ sent, received, saved = [], totalBalance, stats }: GiftCardWalletProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'sent';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Optional: update URL without full reload
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/gift-cards?${params.toString()}`, { scroll: false });
  };

  // Sync activeTab with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // State for Check Balance feature
  const [code, setCode] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');

  const now = Date.now();
  const isCardActive = (c: any) => {
    const exp = c.expiresAt instanceof Date ? c.expiresAt.getTime() : Number(c.expiresAt);
    return c.status === 'active' && exp > now && c.balance > 0;
  };

  const activeSent = sent.filter(isCardActive);
  const activeReceived = received.filter(isCardActive);
  const activeSaved = saved.filter(isCardActive);

  const historyCards = [...sent, ...received, ...saved].filter(c => !isCardActive(c)).sort((a, b) => {
    const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt || 0).getTime();
    const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });

  return (
    <div className="gift-card-section min-h-screen bg-background">
      {/* ── HERO MOBILE: full-width gradient card ── */}
      <div className="gift-card-hero bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-10">
          {/* Title */}
          <div className="flex items-center gap-2 mb-6">
            <div className="gift-card-hero-icon w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
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
              En {activeReceived.length + activeSaved.length} gift card{activeReceived.length + activeSaved.length !== 1 ? 's' : ''} activas
            </p>
          </div>

          {/* Action buttons - thumb zone */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              asChild
              className="gift-card-hero-button h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
            >
              <Link href="/gift-cards/buy">
                <Gift className="h-4 w-4 mr-1.5" />
                Regalar
              </Link>
            </Button>
            <Button
              className="gift-card-hero-button h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
              onClick={() => setRechargeOpen(true)}
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recargar
            </Button>
          </div>
        </div>

      </div>

      {/* ── STATS ROW AS NAVIGATION TABS ── */}
      <div className="max-w-4xl mx-auto px-4 mt-5 mb-6">
        <div className="gift-card-tabs-nav flex items-center gap-1 rounded-2xl border bg-card/80 p-1.5 shadow-sm backdrop-blur-xl">
          {[
            { id: 'sent', label: 'Enviadas', value: activeSent.length, icon: Send },
            { id: 'received', label: 'Recibidas', value: activeReceived.length, icon: Inbox },
            { id: 'saved', label: 'Guardadas', value: activeSaved.length, icon: Wallet },
            { id: 'history', label: 'Historial', value: historyCards.length, icon: Clock },
          ].map(({ id, label, value, icon: Icon }) => (
            <button 
              key={id} 
              onClick={() => handleTabChange(id)}
              className={`gift-card-tabs-trigger flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all cursor-pointer
                ${activeTab === id ? 'gift-card-tabs-trigger-active bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
              <span className={`gift-card-tabs-count rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                activeTab === id ? 'bg-white/20 text-current' : 'bg-muted text-muted-foreground'
              }`}>
                {value}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CARDS TABS ── */}
      <div className="max-w-4xl mx-auto px-4 pb-32">
        <Tabs value={activeTab} onValueChange={handleTabChange}>

          <TabsContent value="sent" className="space-y-4 mt-0">
            {activeSent.length === 0 ? (
              <EmptyState
                icon={<Send className="h-10 w-10" />}
                title="No tienes regalos enviados activos"
                description="Sorprende a alguien especial con una Gift Card del mercado SIGE."
                action={{ label: 'Comprar Gift Card', href: '/gift-cards/buy' }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {activeSent.map((gc) => (
                  <GiftCardCard key={gc.id} giftCard={gc} type="sent" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4 mt-0">
            {activeReceived.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-10 w-10" />}
                title="Aún no recibiste ningún regalo activo"
                description="Cuando alguien te envíe una Gift Card, aparecerá aquí."
                action={{ label: 'Regalar a alguien', href: '/gift-cards/buy' }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {activeReceived.map((gc) => (
                  <GiftCardCard key={gc.id} giftCard={gc} type="received" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4 mt-0">
            {activeSaved.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-10 w-10" />}
                title="No tienes tarjetas guardadas activas"
                description="Aquí aparecerán las tarjetas que compres para ti o que aún no hayas enviado."
                action={{ label: 'Comprar para mí', href: '/gift-cards/buy' }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {activeSaved.map((gc) => (
                  <GiftCardCard key={gc.id} giftCard={gc} type="saved" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-0">
            {historyCards.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-10 w-10" />}
                title="Historial limpio"
                description="No tienes tarjetas expiradas o con saldo cero en tu historial."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Transacciones completadas</h3>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (confirm('¿Estás seguro de eliminar todas las tarjetas del historial?')) {
                        const { deleteAllHistoryCards } = await import('@/app/actions/gift-cards');
                        const result = await deleteAllHistoryCards();
                        if (result.error) {
                          alert(result.error);
                        } else {
                          window.location.reload();
                        }
                      }
                    }}
                    className="h-8 text-xs"
                  >
                    Eliminar todas
                  </Button>
                </div>
                <div className="space-y-2">
                  {historyCards.map((gc) => {
                    const type = sent.some(s => s.id === gc.id) ? 'sent' : received.some(r => r.id === gc.id) ? 'received' : 'saved';
                    const isExpired = new Date(gc.expiresAt) < new Date();
                    const statusLabel = isExpired ? 'Expirada' : gc.balance === 0 ? 'Canjeada' : 'Inactiva';
                    
                    return (
                      <div key={gc.id} className="flex items-center justify-between p-4 bg-card border rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {type === 'sent' && <Send className="h-4 w-4 text-muted-foreground" />}
                            {type === 'received' && <Inbox className="h-4 w-4 text-muted-foreground" />}
                            {type === 'saved' && <Wallet className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-bold text-sm">{gc.recipientName}</span>
                            <span className="text-xs text-muted-foreground">• {statusLabel}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Bs. {gc.amount.toFixed(2)} • {gc.code}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(gc.createdAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('¿Eliminar esta tarjeta del historial?')) {
                              const { deleteGiftCard } = await import('@/app/actions/gift-cards');
                              const result = await deleteGiftCard(gc.id);
                              if (result.error) {
                                alert(result.error);
                              } else {
                                window.location.reload();
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} />
    </div>
  );
}

function EmptyState({
  icon, title, description, action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-16 px-6">
      <div className="gift-card-empty-icon w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{description}</p>
      {action && (
        <Button asChild className="gift-card-primary-action rounded-2xl h-12 font-bold px-6 gap-2">
          <Link href={action.href}>
            {action.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
