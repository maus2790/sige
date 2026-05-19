"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Zap, Database, ArrowUpCircle, Users, Activity, Loader2 } from "lucide-react";
import { getSystemConfig, setSystemConfig, estimateCapacity } from "@/app/actions/config";
import { toast } from "sonner";

export default function OptimizacionesPage() {
  const [config, setConfig] = useState({
    cacheScrollEnabled: false,
    isrEnabled: false,
    middlewareOptimized: false,
    marketCacheTtl: 3600,
    marketScrollLimit: 12,
    storeScrollLimit: 12,
  });
  const [capacity, setCapacity] = useState({
    simultaneousUsers: 500,
    dailyUsers: 50000,
    mode: "BASE",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchConfig = async () => {
    try {
      const data = await estimateCapacity();
      setConfig(data.config);
      setCapacity(data);
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggle = async (key: string, field: keyof typeof config, value: boolean) => {
    setUpdating(field);
    try {
      await setSystemConfig(key, value);
      await fetchConfig();
      toast.success(`Configuración actualizada`);
    } catch (error) {
      toast.error("Error al actualizar la configuración");
    } finally {
      setUpdating(null);
    }
  };

  const handleSaveNumeric = async (key: string, field: keyof typeof config, value: number) => {
    setUpdating(field);
    try {
      await setSystemConfig(key, value);
      await fetchConfig();
      toast.success(`Configuración guardada y caché purgado`);
    } catch (error) {
      toast.error("Error al actualizar la configuración");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "BASE": return "bg-slate-500";
      case "CACHÉ": return "bg-blue-500";
      case "ISR": return "bg-purple-500";
      case "COMPLETO": return "bg-emerald-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Optimizaciones de Escala
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Gestiona los niveles de rendimiento para escalar progresivamente la plataforma
          </p>
        </div>
        <Badge className={`px-4 py-1.5 rounded-full font-bold shadow-sm ${getModeColor(capacity.mode)} hover:${getModeColor(capacity.mode)} border-none text-white`}>
          NIVEL: {capacity.mode}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass-card border-none shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios Concurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-primary">{capacity.simultaneousUsers.toLocaleString()}</div>
            <p className="text-sm font-semibold mt-2 text-emerald-600 dark:text-emerald-400">
              +{capacity.simultaneousUsers - 500} de mejora base
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios Diarios Est.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">{capacity.dailyUsers.toLocaleString()}</div>
            <p className="text-sm font-semibold text-muted-foreground mt-2">
              Capacidad máxima recomendada
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 bg-linear-to-br from-indigo-500/10 to-purple-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Server className="w-24 h-24 text-indigo-500" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg text-indigo-900 dark:text-indigo-200">Impacto en Turso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
              {capacity.mode === "BASE" ? "Alto" : capacity.mode === "COMPLETO" ? "Mínimo" : "Medio"}
            </div>
            <p className="text-sm font-semibold text-indigo-600/70 dark:text-indigo-300/70 mt-2">
              Lecturas a base de datos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 mt-8">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-blue-500" />
          Switches de Escalamiento
        </h2>

        {/* Nivel 1 */}
        <Card className={`border-l-4 ${config.cacheScrollEnabled ? 'border-l-blue-500 shadow-md' : 'border-l-slate-300'} transition-all`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                Nivel 1: Caché de Scroll (Marketplace)
                {config.cacheScrollEnabled && <Badge className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/20 border-none">Activo</Badge>}
              </CardTitle>
              <CardDescription>
                Evita que cada scroll consulte la base de datos (Turso).{" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-800 transition-colors ml-1 focus:outline-none"
                >
                  Más información
                </button>
              </CardDescription>
            </div>
            <Switch 
              checked={config.cacheScrollEnabled} 
              onCheckedChange={(v) => handleToggle("cache_scroll_enabled", "cacheScrollEnabled", v)}
              disabled={updating !== null}
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Utiliza <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">unstable_cache</code> en el servidor para el feed principal, tiendas y detalle de productos. Al activarlo, el usuario deberá usar el botón <strong>"Actualizar"</strong> manualmente para ver nuevos contenidos, o esperar a que un vendedor modifique su producto (purga automática por tags).
            </p>
            
            {config.cacheScrollEnabled && (
              <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div className="space-y-2 md:col-span-2">
                  <Label>TTL del Caché (Segundos) — aplica a Mercado, Tiendas y Detalles</Label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={60}
                      max={86400}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={config.marketCacheTtl}
                      onChange={(e) => setConfig({...config, marketCacheTtl: Number(e.target.value)})}
                    />
                    <button 
                      onClick={() => handleSaveNumeric("market_cache_ttl", "marketCacheTtl", config.marketCacheTtl)}
                      disabled={updating !== null}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 text-xs rounded-md font-bold transition-colors flex items-center gap-1 shrink-0"
                    >
                      {updating === "marketCacheTtl" ? <><Loader2 className="w-3 h-3 animate-spin"/> Guardando...</> : "Guardar"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Mín. 60s · Máx. 86400s (24h). Al guardar, purga automáticamente todos los cachés activos.</p>
                </div>

                <div className="space-y-2">
                  <Label>Tarjetas por página — Marketplace</Label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={4}
                      max={50}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={config.marketScrollLimit}
                      onChange={(e) => setConfig({...config, marketScrollLimit: Number(e.target.value)})}
                    />
                    <button 
                      onClick={() => handleSaveNumeric("market_scroll_limit", "marketScrollLimit", config.marketScrollLimit)}
                      disabled={updating !== null}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 text-xs rounded-md font-bold transition-colors flex items-center gap-1 shrink-0"
                    >
                      {updating === "marketScrollLimit" ? <><Loader2 className="w-3 h-3 animate-spin"/> Guardando...</> : "Guardar"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tarjetas por página — Tiendas</Label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min={4}
                      max={50}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={config.storeScrollLimit}
                      onChange={(e) => setConfig({...config, storeScrollLimit: Number(e.target.value)})}
                    />
                    <button 
                      onClick={() => handleSaveNumeric("store_scroll_limit", "storeScrollLimit", config.storeScrollLimit)}
                      disabled={updating !== null}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 text-xs rounded-md font-bold transition-colors flex items-center gap-1 shrink-0"
                    >
                      {updating === "storeScrollLimit" ? <><Loader2 className="w-3 h-3 animate-spin"/> Guardando...</> : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!config.cacheScrollEnabled && (
              <div className="mt-4 pt-4 border-t border-dashed space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Funcionamiento en Plan Básico (Caché OFF)
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">Activo por defecto</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  El sistema no deja tu base de datos desprotegida. Al desactivar el Nivel 1, entra en vigor el <strong>Plan Básico</strong> que aplica políticas de seguridad automáticas e inmutables:
                </p>

                <div className="grid grid-cols-2 gap-3 bg-amber-500/5 dark:bg-amber-500/2 p-3.5 rounded-2xl border border-amber-500/10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Caché — Mercado y Tiendas</span>
                    <p className="text-xs font-bold text-foreground">30 segundos (Micro-Caché)</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Tarjetas por Carga</span>
                    <p className="text-xs font-bold text-foreground">15 tarjetas por scroll (Fijo)</p>
                  </div>
                  <div className="space-y-0.5 col-span-2 pt-1 border-t border-amber-500/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Caché — Detalle del Producto</span>
                    <p className="text-xs font-bold text-foreground">30 segundos de Micro-Caché · Invalidable con botón "Actualizar"</p>
                  </div>
                  <div className="space-y-0.5 col-span-2 pt-1 border-t border-amber-500/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Detalles de la Tienda</span>
                    <p className="text-xs font-bold text-foreground">30 segundos de Micro-Caché · Banner, nombre y descripción</p>
                  </div>
                </div>
                
                <p className="text-[11px] text-muted-foreground italic">
                  *El botón "Actualizar" en el header (móvil) o en el feed purga <strong>todos</strong> los cachés simultáneamente: Mercado, Tiendas y Detalles.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nivel 2 */}
        <Card className="border-l-4 border-l-slate-200 dark:border-l-slate-700 transition-all opacity-60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                Nivel 2: ISR Dinámico y Generación Estática
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">Próximamente</Badge>
              </CardTitle>
              <CardDescription>Generación estática regenerativa (ISR) para páginas de tiendas públicas.</CardDescription>
            </div>
            <Switch 
              checked={false}
              disabled={true}
            />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Permitirá pre-renderizar las páginas de tiendas públicas de forma estática con regeneración automática según el TTL configurado en Nivel 1. Esto eliminaría completamente el tiempo de respuesta del servidor en la primera carga.
            </p>
          </CardContent>
        </Card>

        {/* Nivel 3 */}
        <Card className="border-l-4 border-l-slate-200 dark:border-l-slate-700 transition-all opacity-60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                Nivel 3: Middleware Optimizado
                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">Próximamente</Badge>
              </CardTitle>
              <CardDescription>Bypass de verificación JWT en rutas públicas de alto tráfico.</CardDescription>
            </div>
            <Switch 
              checked={false}
              disabled={true}
            />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Omitirá la decodificación de tokens JWT y la verificación de sesión en rutas públicas (Marketplace, Tiendas, Detalles), reduciendo el overhead de latencia de Vercel Edge Network y Cloudflare Workers.
            </p>
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              &times;
            </button>

            {/* Header */}
            <div className="space-y-2">
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none font-bold px-3 py-1 rounded-full text-xs">
                DOCUMENTACIÓN DE ESCALA
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <Zap className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                Optimización Nivel 1: Caché de Scroll
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Descubre cómo funciona la infraestructura de almacenamiento dinámico en caché y cómo probarla en tiempo real para verificar el blindaje de tu servidor.
              </p>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Section 1: How it works */}
            <div className="space-y-3">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                ¿Cómo funciona el Nivel 1?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cuando el <strong>Nivel 1</strong> está activo, la plataforma almacena las consultas a la base de datos (Turso) en la memoria RAM del servidor. El feed del Marketplace, el catálogo de las tiendas e incluso la vista detallada de los productos individuales se consultan una sola vez y se guardan dinámicamente.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Esto reduce drásticamente las lecturas a Turso, permitiendo al servidor entregar respuestas en <strong>milisegundos</strong> a miles de usuarios recurrentes.
              </p>
            </div>

            {/* Section 2: UX */}
            <div className="space-y-3">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                La Experiencia del Usuario (UX)
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5">
                <li>
                  <strong className="text-foreground">Visitante Externo:</strong> Navega de forma fluida e instantánea en el Marketplace, Tiendas y Detalle de Productos. Si desea ver contenido actualizado, tiene un botón <strong>"Actualizar"</strong> en el header móvil o en el feed (desktop) que purga <em>todos</em> los cachés simultáneamente: Mercado, Tiendas y Detalles.
                </li>
                <li>
                  <strong className="text-foreground">Dueño de Tienda / Vendedor:</strong> El sistema detecta su sesión y siempre le sirve datos 100% en vivo de la base de datos para que no experimente retrasos al realizar ediciones. Su vista de catálogo nunca está cacheada.
                </li>
                <li>
                  <strong className="text-foreground">Sincronización Automática:</strong> En cuanto un vendedor edita un producto, publica, despublica o elimina uno, el servidor invalida automáticamente el caché de ese producto específico y el catálogo de su tienda mediante <code className="bg-muted px-1 rounded text-[10px] font-mono">revalidateTag</code>.
                </li>
                <li>
                  <strong className="text-foreground">Plan Básico (OFF):</strong> Si el Nivel 1 está desactivado, todos los datos tienen un micro-caché automático de <strong>30 segundos</strong> que protege Turso de picos de tráfico, manteniendo los datos prácticamente actualizados.
                </li>
              </ul>
            </div>

            {/* Section 3: Testing Guide */}
            <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                Guía Paso a Paso para Probar la Optimización
              </h3>
              <ol className="space-y-3 text-xs text-muted-foreground list-decimal pl-5">
                <li>
                  <span className="text-foreground font-semibold">Activa el switch de Nivel 1</span> en este panel administrativo.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Abre el Marketplace, una Tienda o un Detalle de Producto</span> en una pestaña de incógnito (para actuar como comprador externo sin sesión).
                </li>
                <li>
                  <span className="text-foreground font-semibold">Edita el producto desde el Dashboard o Drizzle Studio:</span> Cambia el precio, el título o el stock de un producto activo.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Observa el Caché:</span> Recarga la página de incógnito. Los datos viejos seguirán ahí — el servidor entrega la versión ultra rápida cacheada para proteger Turso.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Prueba la invalidación manual:</span> Presiona el botón <strong>"↻ Actualizar"</strong> en el header móvil o en el feed. El sistema purga <em>todos</em> los cachés: Mercado, Tiendas y Detalles. ¡Los nuevos datos aparecerán al instante!
                </li>
                <li>
                  <span className="text-foreground font-semibold">Prueba la invalidación automática:</span> Edita un producto desde tu panel de vendedor y presiona Guardar. Sin presionar Actualizar, entra al detalle del producto en la pestaña de incógnito y recarga — el producto estará actualizado por la purga automática de tags.
                </li>
              </ol>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                Entendido, ¡vamos a probarlo!
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
