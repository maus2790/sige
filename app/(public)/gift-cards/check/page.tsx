'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Search, CheckCircle, AlertCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react';

type CardInfo = {
  code: string;
  balance: number;
  amount: number;
  status: string;
  expiresAt: string;
  message: string | null;
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
    <div className="min-h-screen flex flex-col">
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
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="Ej. GIFT-A1B2C3"
                className="h-14 text-center text-lg font-mono font-bold rounded-2xl border-2 focus:border-blue-500 tracking-widest"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground text-center">
                El código tiene el formato GIFT-XXXXXX
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
            {/* Card visual */}
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

                  {/* Balance bar */}
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

            {/* Message */}
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
