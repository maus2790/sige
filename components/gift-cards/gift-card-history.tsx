'use client';

import { useEffect, useState } from 'react';
import { getGiftCardHistory, getGiftCardHistoryByAction } from '@/app/actions/gift-cards';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Inbox, Wallet, TrendingUp, Clock, AlertCircle 
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryRecord {
  id: string;
  giftCardId: string;
  action: string;
  description: string | null;
  amount: number | null;
  createdAt: Date;
  giftCard?: any;
}

export function GiftCardHistory() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadHistory();
  }, [activeTab]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'all') {
        data = await getGiftCardHistory();
      } else {
        data = await getGiftCardHistoryByAction(activeTab as any);
      }
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'received':
        return <Inbox className="h-4 w-4 text-green-500" />;
      case 'saved':
        return <Wallet className="h-4 w-4 text-purple-500" />;
      case 'transferred':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'recharge':
        return <TrendingUp className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'sent':
        return 'Gift Card Enviada';
      case 'received':
        return 'Gift Card Recibida';
      case 'saved':
        return 'Gift Card Guardada';
      case 'transferred':
        return 'Gift Card Transferida';
      case 'redeemed':
        return 'Gift Card Canjeada';
      case 'recharge':
        return 'Recarga de Crédito';
      default:
        return action;
    }
  };

  const actionStats = {
    sent: history.filter(h => h.action === 'sent').length,
    received: history.filter(h => h.action === 'received').length,
    saved: history.filter(h => h.action === 'saved').length,
    transferred: history.filter(h => h.action === 'transferred').length,
    recharge: history.filter(h => h.action === 'recharge').length,
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-background rounded-2xl border p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2 mb-2">
            <Clock className="h-6 w-6" />
            Historial de Transacciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Visualiza todas tus acciones con Gift Cards y recargas de crédito
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="all" className="gap-1">
              <span className="hidden sm:inline">Todo</span>
              <span className="inline sm:hidden">Todo</span>
              <span className="text-[10px] bg-muted rounded px-1">{history.length}</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1">
              <Send className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Enviadas</span>
              <span className="text-[10px] bg-muted rounded px-1">{actionStats.sent}</span>
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-1">
              <Inbox className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Recibidas</span>
              <span className="text-[10px] bg-muted rounded px-1">{actionStats.received}</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1">
              <Wallet className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Guardadas</span>
              <span className="text-[10px] bg-muted rounded px-1">{actionStats.saved}</span>
            </TabsTrigger>
            <TabsTrigger value="transferred" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Transferidas</span>
              <span className="text-[10px] bg-muted rounded px-1">{actionStats.transferred}</span>
            </TabsTrigger>
            <TabsTrigger value="recharge" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline text-xs">Recargas</span>
              <span className="text-[10px] bg-muted rounded px-1">{actionStats.recharge}</span>
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-bold text-lg mb-2">No hay historial</h3>
                <p className="text-sm text-muted-foreground">
                  Cuando realices acciones con Gift Cards, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div 
                    key={record.id} 
                    className="flex items-start gap-4 p-4 bg-card border rounded-xl hover:shadow-md hover:border-primary/50 transition-all"
                  >
                    {/* Icon */}
                    <div className="mt-1">
                      {getActionIcon(record.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="font-bold text-sm">
                          {getActionLabel(record.action)}
                        </h4>
                        {record.amount && (
                          <span className="text-xs font-bold text-primary">
                            Bs. {record.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {record.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {record.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <time>
                          {format(new Date(record.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                        </time>
                        {record.giftCard?.code && (
                          <>
                            <span>•</span>
                            <code className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              {record.giftCard.code}
                            </code>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-lg text-[10px] font-bold">
                        {record.action === 'recharge' && '💳'}
                        {record.action === 'sent' && '📤'}
                        {record.action === 'received' && '📥'}
                        {record.action === 'saved' && '💾'}
                        {record.action === 'transferred' && '🔄'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
