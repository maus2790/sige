'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Search, CheckCircle, AlertCircle, Clock, ArrowRight, RotateCcw, X } from 'lucide-react';
import { Drawer } from 'vaul';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';

import { GiftCardPreview } from './gift-card-designer';

type CardInfo = {
  code: string;
  balance: number;
  amount: number;
  status: string;
  expiresAt: string;
  message: string | null;
  templateId?: number | null;
  occasion?: string | null;
  customStyle?: string | null;
  storeName?: string | null;
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
          <GiftCardPreview
            value={{
              storeName: result.storeName || 'Tienda',
              amount: result.amount,
              recipientName: 'Mi Gift Card',
              message: result.message || '',
              occasion: result.occasion || 'otros',
              designId: result.templateId === 99 ? 99 : (result.templateId || 1),
              customStyle: (() => { try { return result.customStyle ? JSON.parse(result.customStyle) : null; } catch { return null; } })()
            }}
            mode="buyer"
            code={result.code}
          />

          <div className="rounded-2xl bg-muted/50 border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-bold uppercase">Estado</span>
              <span className={`text-xs font-black uppercase rounded-full px-2.5 py-0.5 ${
                isActive ? 'bg-green-100 text-green-700' : isExpired ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {isActive ? 'Activa' : isExpired ? 'Expirada' : 'Canjeada'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-bold uppercase">Saldo Disponible</span>
              <span className="text-lg font-black">Bs. {result.balance.toFixed(2)}</span>
            </div>
            {result.balance < result.amount && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-bold uppercase">Consumido</span>
                <span className="text-sm font-bold text-muted-foreground">Bs. {(result.amount - result.balance).toFixed(2)}</span>
              </div>
            )}
            <div className="space-y-1 pt-1">
              <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${balancePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>{balancePct}% restante</span>
                <span>100%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
              <span>Fecha de Expiración</span>
              <span className="font-bold">{new Date(result.expiresAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

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
