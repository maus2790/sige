'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Search, CheckCircle, AlertCircle, Clock, ArrowRight, RotateCcw, X } from 'lucide-react';
import { Drawer } from 'vaul';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';

type CardInfo = {
  code: string;
  balance: number;
  amount: number;
  status: string;
  expiresAt: string;
  message: string | null;
};

interface CheckBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckBalanceDialog({ open, onOpenChange }: CheckBalanceDialogProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CardInfo | null>(null);
  const [error, setError] = useState('');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleCheck = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch(`/api/gift-cards/check?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al consultar');
      } else {
        setResult(data);
      }
    } catch {
      setError('No se pudo conectar. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const isExpired = result && new Date(result.expiresAt) < new Date();
  const isActive = result && result.status === 'active' && !isExpired && result.balance > 0;
  const balancePct = result ? Math.round((result.balance / result.amount) * 100) : 0;

  const renderContent = () => (
    <>
      {!result ? (
        /* ── INPUT STATE ── */
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">Código de la Gift Card</label>
            <Input
              value={code}
              onChange={(e) => {
                const rawVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const formatted = rawVal.match(/.{1,4}/g)?.join('-') || rawVal;
                setCode(formatted.slice(0, 14));
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="A1B2-C3D4-E5F6"
              className="h-14 text-center text-lg font-mono font-bold rounded-2xl border-2 focus:border-blue-500 tracking-widest"
              maxLength={14}
            />
            <p className="text-xs text-muted-foreground text-center">
              El código tiene el formato XXXX-XXXX-XXXX
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCheck}
            disabled={!code.trim() || loading}
            className="w-full h-14 rounded-2xl text-white font-black text-base shadow-lg gap-2"
            style={{ background: 'var(--premium-accent, #2563EB)' }}
          >
            {loading ? (
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
        /* ── RESULT STATE ── */
        <div className="space-y-4">
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
                    Bs. {result.balance.toFixed(2)}
                  </p>
                  {result.balance < result.amount && (
                    <p className="text-xs opacity-50 mt-1">
                      de Bs. {result.amount.toFixed(2)} originales
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
                    <span className="text-[10px] opacity-50">Bs. {result.amount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs opacity-60">
                  <span className="font-mono">{result.code}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expira {new Date(result.expiresAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {result.message && (
            <div className="bg-card border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1 font-bold">Mensaje</p>
              <p className="text-sm italic">"{result.message}"</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-2xl font-bold gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Nueva consulta
            </Button>
            <Button
              onClick={handleClose}
              className="h-12 rounded-2xl text-white font-bold gap-2"
              style={{ background: 'var(--premium-accent, #2563EB)' }}
            >
              <X className="h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 rounded-3xl overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Search className="h-5 w-5" />
              Consultar Saldo
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">{renderContent()}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={handleClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[2.5rem] max-h-[92vh] fixed bottom-0 left-0 right-0 z-50 border-t shadow-xl outline-none">
          <VisuallyHidden.Root>
            <DialogTitle>Consultar Saldo</DialogTitle>
          </VisuallyHidden.Root>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted mb-6" />
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Consultar Saldo
                </h2>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {renderContent()}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
