'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, CheckCircle, AlertCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { GiftCardPreview } from '@/components/gift-cards/gift-card-designer';

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

export default function CheckGiftCardPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CardInfo | null>(null);
  const [error, setError] = useState('');

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

  const isExpired = result && new Date(result.expiresAt) < new Date();
  const isActive = result && result.status === 'active' && !isExpired && result.balance > 0;
  const balancePct = result ? Math.round((result.balance / result.amount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header gradient */}
      <div className="bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Consultar Saldo</h1>
          <p className="text-sm opacity-70">
            Ingresa el código de tu Gift Card para ver el saldo disponible. No necesitas iniciar sesión.
          </p>
        </div>
        <div className="h-6 bg-background rounded-t-4xl -mb-1 mt-8" />
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 -mt-1 pb-32">

        {!result ? (
          /* ── INPUT STATE ── */
          <div className="space-y-4 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Código de la Gift Card</label>
              <Input
                id="gift-code-input"
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

            {/* CTA in thumb zone */}
            <Button
              onClick={handleCheck}
              disabled={!code.trim() || loading}
              className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/20 gap-2"
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

            <p className="text-center text-xs text-muted-foreground">
              ¿Tienes una Gift Card?{' '}
              <a href="/auth/login" className="text-blue-600 font-bold underline">
                Inicia sesión para usarla
              </a>
            </p>
          </div>
        ) : (
          /* ── RESULT STATE ── */
          <div className="pt-6 space-y-4">
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

            {result.message && (
              <div className="bg-card border rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1 font-bold">Mensaje</p>
                <p className="text-sm italic">"{result.message}"</p>
              </div>
            )}

            {/* Actions */}
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
                asChild
                className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
              >
                <a href="/auth/login">
                  Usar en compra
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
