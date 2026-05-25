'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { GiftCardBottomNav } from './gift-card-bottom-nav';
import { GiftCardCard } from './gift-card-card';
import { RechargeDialog } from './recharge-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift, Plus, Search, Inbox, Send, Clock,
  TrendingUp, ChevronRight, Wallet, Sparkles, CheckCircle, AlertCircle, ArrowRight, RotateCcw,
  RefreshCw
} from 'lucide-react';

type CardInfo = {
  code: string;
  balance: number;
  amount: number;
  status: string;
  expiresAt: string;
  message: string | null;
};

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

  // Sync activeTab with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Optional: update URL without full reload
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/gift-cards?${params.toString()}`, { scroll: false });
  };

  // State for Check Balance feature
  const [code, setCode] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<CardInfo | null>(null);
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

  const handleCheck = async () => {
    if (!code.trim()) return;
    setCheckLoading(true);
    setCheckResult(null);
    setCheckError('');

    try {
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setCheckError(data.error || 'Error al consultar');
      } else {
        setCheckResult(data);
      }
    } catch {
      setCheckError('No se pudo conectar. Verifica tu conexión.');
    } finally {
      setCheckLoading(false);
    }
  };

  const handleResetCheck = () => {
    setCode('');
    setCheckResult(null);
    setCheckError('');
  };

  const isExpired = checkResult && new Date(checkResult.expiresAt) < new Date();
  const isActive = checkResult && checkResult.status === 'active' && !isExpired && checkResult.balance > 0;
  const balancePct = checkResult ? Math.round((checkResult.balance / checkResult.amount) * 100) : 0;

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
          <div className="grid grid-cols-3 gap-2">
            <Button
              asChild
              className="gift-card-hero-button h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
            >
              <Link href="/gift-cards/buy">
                <Plus className="h-4 w-4 mr-1.5" />
                Regalar
              </Link>
            </Button>
            <Button
              className="gift-card-hero-button h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
              onClick={() => setRechargeOpen(true)}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Recargar
            </Button>
            <Button
              className="gift-card-hero-button h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
              onClick={() => setActiveTab('check')}
            >
              <Search className="h-4 w-4 mr-1.5" />
              Consultar
            </Button>
          </div>
        </div>

      </div>

      {/* ── STATS ROW AS NAVIGATION TABS ── */}
      <div className="max-w-4xl mx-auto px-4 mt-5 mb-6 hidden md:block">
        <div className="gift-card-tabs-nav flex items-center gap-1 rounded-2xl border bg-card/80 p-1.5 shadow-sm backdrop-blur-xl">
          {[
            { id: 'sent', label: 'Enviadas', value: activeSent.length, icon: Send },
            { id: 'received', label: 'Recibidas', value: activeReceived.length, icon: Inbox },
            { id: 'saved', label: 'Guardadas', value: activeSaved.length, icon: Wallet },
            { id: 'history', label: 'Historial', value: historyCards.length, icon: Clock },
            { id: 'check', label: 'Saldo', value: '?', icon: Search },
          ].map(({ id, label, value, icon: Icon }) => (
            <button 
              key={id} 
              onClick={() => handleTabChange(id)}
              className={`gift-card-tabs-trigger flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all
                ${activeTab === id ? 'gift-card-tabs-trigger-active bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
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
          {/* Desktop tabs are now the stats cards above. Mobile tabs are the bottom nav below. */}

          {/* ── MOBILE HISTORY BUTTON ── */}
          <div className="md:hidden mb-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleTabChange('history')} 
              className={`gift-card-mobile-history text-xs h-8 rounded-full ${activeTab === 'history' ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Ver Historial ({historyCards.length})
            </Button>
          </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {historyCards.map((gc) => {
                  // Determine the original type visually
                  const type = sent.some(s => s.id === gc.id) ? 'sent' : received.some(r => r.id === gc.id) ? 'received' : 'saved';
                  return <GiftCardCard key={gc.id} giftCard={gc} type={type} />;
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="check" className="space-y-4 mt-0">
            <div className="gift-card-panel bg-card rounded-3xl p-6 md:p-8 border shadow-sm text-center mb-4">
              <div className="gift-card-panel-icon w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-xl mb-2">Consultar Saldo</h3>
              <p className="text-sm text-muted-foreground mb-8">Ingresa el código de tu Gift Card para ver el saldo disponible.</p>

              {!checkResult ? (
                <div className="space-y-4 text-left max-w-sm mx-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Código de la Gift Card</label>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setCheckError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                      placeholder="Ej. GIFT-A1B2C3"
                      className="gift-card-themed-input h-14 text-center text-lg font-mono font-bold rounded-2xl border-2 focus:border-blue-500 tracking-widest"
                      maxLength={12}
                    />
                  </div>

                  {checkError && (
                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400">{checkError}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleCheck}
                    disabled={!code.trim() || checkLoading}
                    className="gift-card-primary-action w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/20 gap-2"
                  >
                    {checkLoading ? (
                      <span className="animate-pulse">Consultando...</span>
                    ) : (
                      <>
                        <Search className="h-5 w-5" />
                        Consultar Saldo
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-left max-w-sm mx-auto">
                  <div className={`rounded-3xl overflow-hidden text-white shadow-2xl ${
                    isActive
                      ? 'gift-card-primary-action'
                      : isExpired
                        ? 'bg-linear-to-br from-gray-500 to-gray-700'
                        : 'bg-linear-to-br from-gray-600 to-gray-800'
                  }`}>
                    <div className="relative p-6">
                      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
                      <div className="absolute -bottom-8 -left-4 w-40 h-40 rounded-full bg-white/5" />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">SIGE Gift Card</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            {isActive ? (
                              <><CheckCircle className="h-4 w-4 text-green-300" /><span className="text-green-200">Activa</span></>
                            ) : isExpired ? (
                              <><Clock className="h-4 w-4 text-red-300" /><span className="text-red-200">Expirada</span></>
                            ) : (
                              <><AlertCircle className="h-4 w-4 text-yellow-300" /><span className="text-yellow-200">Canjeada</span></>
                            )}
                          </div>
                        </div>

                        <div className="mb-6 text-center">
                          <p className="text-xs opacity-60 mb-1">Saldo disponible</p>
                          <p className="text-5xl font-black tracking-tighter">
                            Bs. {checkResult.balance.toFixed(2)}
                          </p>
                          {checkResult.balance < checkResult.amount && (
                            <p className="text-xs opacity-50 mt-1">
                              de Bs. {checkResult.amount.toFixed(2)} originales
                            </p>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-white h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${balancePct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] opacity-50">0</span>
                            <span className="text-[10px] opacity-50">{balancePct}% restante</span>
                            <span className="text-[10px] opacity-50">Bs. {checkResult.amount}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs opacity-60">
                          <span className="font-mono">{checkResult.code}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expira {new Date(checkResult.expiresAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {checkResult.message && (
                    <div className="bg-card border rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground mb-1 font-bold">Mensaje</p>
                      <p className="text-sm italic">"{checkResult.message}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="outline"
                      className="h-12 rounded-2xl font-bold gap-2"
                      onClick={handleResetCheck}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Otra consulta
                    </Button>
                    <Button
                      asChild
                      className="gift-card-primary-action h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                    >
                      <Link href="/gift-cards/buy">
                        Usar Saldo
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
