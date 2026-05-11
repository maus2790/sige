'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GiftCardCard } from './gift-card-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift, Plus, Search, Inbox, Send, Clock,
  TrendingUp, ChevronRight, Wallet, Sparkles, CheckCircle, AlertCircle, ArrowRight, RotateCcw
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
  const [activeTab, setActiveTab] = useState('sent');

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
              className="h-12 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-2xl font-bold text-sm"
              variant="ghost"
              onClick={() => setActiveTab('check')}
            >
              <Search className="h-4 w-4 mr-2" />
              Consultar saldo
            </Button>
          </div>
        </div>

        {/* Curved bottom */}
        <div className="h-6 bg-background rounded-t-4xl" />
      </div>

      {/* ── STATS ROW AS NAVIGATION TABS ── */}
      <div className="max-w-4xl mx-auto px-4 -mt-1 mb-6 hidden md:block">
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'sent', label: 'Enviadas', value: activeSent.length, icon: Send, color: 'text-purple-500' },
            { id: 'received', label: 'Recibidas', value: activeReceived.length, icon: Inbox, color: 'text-blue-500' },
            { id: 'saved', label: 'Guardadas', value: activeSaved.length, icon: Wallet, color: 'text-amber-500' },
            { id: 'history', label: 'Historial', value: historyCards.length, icon: Clock, color: 'text-red-400' },
            { id: 'check', label: 'Saldo', value: '?', icon: Search, color: 'text-emerald-500' },
          ].map(({ id, label, value, icon: Icon, color }) => (
            <button 
              key={id} 
              onClick={() => setActiveTab(id)}
              className={`rounded-2xl p-2.5 border transition-all text-center w-full
                ${activeTab === id ? 'bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/20 scale-105' : 'bg-card shadow-sm hover:bg-muted/50'}
              `}
            >
              <Icon className={`h-4 w-4 mx-auto mb-1 ${activeTab === id ? color : 'text-muted-foreground'}`} />
              <p className="text-lg font-black leading-none mb-1">{value}</p>
              <p className={`text-[9px] font-bold leading-tight ${activeTab === id ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── CARDS TABS ── */}
      <div className="max-w-4xl mx-auto px-4 pb-32">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop tabs are now the stats cards above. Mobile tabs are the bottom nav below. */}

          {/* ── MOBILE HISTORY BUTTON ── */}
          <div className="md:hidden mb-4 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActiveTab('history')} 
              className={`text-xs h-8 rounded-full ${activeTab === 'history' ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
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
            <div className="bg-card rounded-3xl p-6 md:p-8 border shadow-sm text-center mb-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto mb-4">
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
                      className="h-14 text-center text-lg font-mono font-bold rounded-2xl border-2 focus:border-blue-500 tracking-widest"
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
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/20 gap-2"
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
                      ? 'bg-linear-to-br from-blue-600 to-indigo-700'
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
                      className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
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

      {/* ── CUSTOM BOTTOM NAVIGATION FOR GIFT CARDS ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-primary/10 md:hidden z-40 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-300 ${activeTab === 'sent' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
          >
            <Send className={`w-5 h-5 ${activeTab === 'sent' ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]' : ''}`} />
            <span className={`text-[10px] font-medium ${activeTab === 'sent' ? 'font-bold' : ''}`}>Enviados</span>
          </button>
          
          <button
            onClick={() => setActiveTab('received')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all duration-300 ${activeTab === 'received' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
          >
            <Inbox className={`w-5 h-5 ${activeTab === 'received' ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]' : ''}`} />
            <span className={`text-[10px] font-medium ${activeTab === 'received' ? 'font-bold' : ''}`}>Recibidos</span>
          </button>

          {/* Central Action Button */}
          <Link href="/gift-cards/buy" className="relative -top-5 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-90 transition-all border-4 border-background flex items-center justify-center group">
              <Gift className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </Link>

          <button
            onClick={() => setActiveTab('check')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all duration-300 ${activeTab === 'check' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
          >
            <Search className={`w-5 h-5 ${activeTab === 'check' ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]' : ''}`} />
            <span className={`text-[10px] font-medium ${activeTab === 'check' ? 'font-bold' : ''}`}>Saldo</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-300 ${activeTab === 'saved' ? 'text-primary scale-110' : 'text-muted-foreground'}`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'saved' ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]' : ''}`} />
            <span className={`text-[10px] font-medium ${activeTab === 'saved' ? 'font-bold' : ''}`}>Guardados</span>
          </button>
        </div>
      </nav>
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
      <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{description}</p>
      {action && (
        <Button asChild className="rounded-2xl h-12 font-bold px-6 gap-2">
          <Link href={action.href}>
            {action.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
