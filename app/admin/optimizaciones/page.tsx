"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Zap, Database, ArrowUpCircle, Users, Activity, Loader2 } from "lucide-react";
import { setSystemConfig, estimateCapacity } from "@/app/actions/config";
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
  const [isNivel2ModalOpen, setIsNivel2ModalOpen] = useState(false);
  const [isNivel3ModalOpen, setIsNivel3ModalOpen] = useState(false);

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
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
            Optimizaciones de Escala
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2 font-medium">
            Gestiona los niveles de rendimiento para escalar progresivamente la plataforma
          </p>
        </div>
        <Badge className={`self-start sm:self-auto px-4 py-1.5 rounded-full font-bold shadow-sm ${getModeColor(capacity.mode)} hover:${getModeColor(capacity.mode)} border-none text-white shrink-0`}>
          NIVEL: {capacity.mode}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="glass-card border-none shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle className="text-base md:text-lg">Usuarios Concurrentes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-3xl md:text-4xl font-black text-primary">{capacity.simultaneousUsers.toLocaleString()}</div>
            <p className="text-xs md:text-sm font-semibold mt-1 md:mt-2 text-emerald-600 dark:text-emerald-400">
              +{capacity.simultaneousUsers - 500} de mejora base
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle className="text-base md:text-lg">Usuarios Diarios Est.</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-3xl md:text-4xl font-black text-blue-600">{capacity.dailyUsers.toLocaleString()}</div>
            <p className="text-xs md:text-sm font-semibold text-muted-foreground mt-1 md:mt-2">
              Capacidad máxima recomendada
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none shadow-xl relative overflow-hidden bg-white/50 dark:bg-zinc-900/50 bg-linear-to-br from-indigo-500/10 to-purple-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Server className="w-16 h-16 md:w-24 md:h-24 text-indigo-500" />
          </div>
          <CardHeader className="p-4 md:p-6 pb-2">
            <CardTitle className="text-base md:text-lg text-indigo-900 dark:text-indigo-200">Impacto en Turso</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-black text-indigo-700 dark:text-indigo-400">
              {capacity.mode === "BASE" ? "Alto" : capacity.mode === "COMPLETO" ? "Mínimo" : "Medio"}
            </div>
            <p className="text-xs md:text-sm font-semibold text-indigo-600/70 dark:text-indigo-300/70 mt-1 md:mt-2">
              Lecturas a base de datos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 md:space-y-6 mt-6 md:mt-8">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-blue-500" />
          Switches de Escalamiento
        </h2>

        {/* Nivel 1 */}
        <Card className={`border-l-4 ${config.cacheScrollEnabled ? 'border-l-blue-500 shadow-md' : 'border-l-slate-300'} transition-all`}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 md:p-6 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
                <span>Nivel 1: Caché de Scroll (Marketplace)</span>
                {config.cacheScrollEnabled && (
                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 border-none text-[10px] md:text-xs px-2 py-0.5">
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
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
          <CardContent className="p-4 md:p-6 pt-0 space-y-4">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
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
                  <h4 className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Funcionamiento en Plan Básico (Caché OFF)
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">Activo por defecto</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El sistema no deja tu base de datos desprotegida. Al desactivar el Nivel 1, entra en vigor el <strong>Plan Básico</strong> que aplica políticas de seguridad automáticas e inmutables:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-500/5 dark:bg-amber-500/2 p-3.5 rounded-2xl border border-amber-500/10">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Caché — Mercado y Tiendas</span>
                    <p className="text-xs font-bold text-foreground">30 segundos (Micro-Caché)</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Tarjetas por Carga</span>
                    <p className="text-xs font-bold text-foreground">15 tarjetas por scroll (Fijo)</p>
                  </div>
                  <div className="space-y-0.5 sm:col-span-2 pt-1 border-t border-amber-500/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-400/80">Caché — Detalle del Producto</span>
                    <p className="text-xs font-bold text-foreground">30 segundos de Micro-Caché · Invalidable con botón "Actualizar"</p>
                  </div>
                  <div className="space-y-0.5 sm:col-span-2 pt-1 border-t border-amber-500/10">
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
        <Card className={`border-l-4 ${config.isrEnabled ? 'border-l-purple-500 shadow-md' : 'border-l-slate-300'} transition-all`}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 md:p-6 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
                <span>Nivel 2: ISR Dinámico y Generación Estática</span>
                {config.isrEnabled && (
                  <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 border-none text-[10px] md:text-xs px-2 py-0.5">
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Generación estática regenerativa (ISR) para páginas de tiendas y detalles de productos.{" "}
                <button
                  type="button"
                  onClick={() => setIsNivel2ModalOpen(true)}
                  className="text-purple-600 dark:text-purple-400 underline font-semibold hover:text-purple-800 transition-colors ml-1 focus:outline-none"
                >
                  Más información
                </button>
              </CardDescription>
            </div>
            <Switch 
              checked={config.isrEnabled}
              onCheckedChange={(v) => handleToggle("isr_enabled", "isrEnabled", v)}
              disabled={updating !== null}
            />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Pre-renderiza las páginas de tiendas públicas y de detalles de productos de forma estática con regeneración automática según el TTL configurado en Nivel 1. Esto elimina completamente el tiempo de respuesta del servidor en la primera carga para visitantes anónimos.
            </p>
          </CardContent>
        </Card>

        {/* Nivel 3 */}
        <Card className={`border-l-4 ${config.middlewareOptimized ? 'border-l-emerald-500 shadow-md' : 'border-l-slate-300'} transition-all`}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 p-4 md:p-6 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg flex flex-wrap items-center gap-2">
                <span>Nivel 3: Middleware Optimizado</span>
                {config.middlewareOptimized && (
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border-none text-[10px] md:text-xs px-2 py-0.5">
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Bypass de verificación JWT en rutas públicas de alto tráfico.{" "}
                <button
                  type="button"
                  onClick={() => setIsNivel3ModalOpen(true)}
                  className="text-emerald-600 dark:text-emerald-400 underline font-semibold hover:text-emerald-800 transition-colors ml-1 focus:outline-none"
                >
                  Más información
                </button>
              </CardDescription>
            </div>
            <Switch 
              checked={config.middlewareOptimized}
              onCheckedChange={(v) => handleToggle("middleware_optimized", "middlewareOptimized", v)}
              disabled={updating !== null}
            />
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Omitirá la decodificación de tokens JWT y la verificación de sesión en rutas públicas (Marketplace, Tiendas, Detalles), reduciendo el overhead de latencia de Vercel Edge Network y Cloudflare Workers.
            </p>
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full rounded-t-[30px] rounded-b-none border-t border-x border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in slide-in-from-bottom duration-300 relative md:rounded-3xl md:border md:max-w-2xl md:max-h-[85vh] md:p-8 md:animate-in md:zoom-in-95 md:duration-200">
            
            {/* Drag Handle for Mobile */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 md:hidden shrink-0" />

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

      {isNivel2ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full rounded-t-[30px] rounded-b-none border-t border-x border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in slide-in-from-bottom duration-300 relative md:rounded-3xl md:border md:max-w-2xl md:max-h-[85vh] md:p-8 md:animate-in md:zoom-in-95 md:duration-200">
            
            {/* Drag Handle for Mobile */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 md:hidden shrink-0" />

            {/* Close Button */}
            <button 
              onClick={() => setIsNivel2ModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              &times;
            </button>

            {/* Header */}
            <div className="space-y-2">
              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none font-bold px-3 py-1 rounded-full text-xs">
                DOCUMENTACIÓN DE ESCALA AVANZADA
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <Zap className="w-7 h-7 text-purple-500 fill-purple-500" />
                Optimización Nivel 2: ISR Dinámico
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Descubre cómo funciona la arquitectura de generación estática regenerativa y cómo validar la entrega de páginas ultra rápidas desde el CDN sin latencia de base de datos.
              </p>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Section 1: How it works */}
            <div className="space-y-3">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" />
                ¿Cómo funciona el Nivel 2?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al activar el <strong>Nivel 2</strong>, Next.js realiza una pre-generación estática de las páginas de tiendas públicas y de detalles de productos durante el proceso de compilación (build time). SIGE pre-renderiza por defecto los 10 productos más recientes y las 5 tiendas más recientes.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Si un visitante entra a cualquier otra tienda o producto, Next.js genera la página de forma dinámica al instante (on-demand) y la almacena estáticamente. A partir de ese momento, cualquier otro usuario recibirá la página de manera instantánea (en menos de 10ms) directamente desde la memoria o CDN, sin que Next.js tenga que realizar consultas pesadas a la base de datos (Turso) ni procesar HTML.
              </p>
            </div>

            {/* Section 2: UX */}
            <div className="space-y-3">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                La Experiencia del Usuario (UX)
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5">
                <li>
                  <strong className="text-foreground">Visitante / Comprador:</strong> Disfruta de una velocidad de navegación premium. Al ingresar a una tienda o al detalle de un producto, la página carga de inmediato. No experimenta pantallas de carga (loaders) ni parpadeos, lo que aumenta radicalmente la tasa de conversión.
                </li>
                <li>
                  <strong className="text-foreground">Dueño de Tienda / Vendedor:</strong> Mantiene la experiencia interactiva en tiempo real. Cuando el vendedor está logueado en su cuenta, el sistema detecta su sesión activa y siempre le sirve los datos frescos directamente de la base de datos para garantizar que sus ediciones y actualizaciones se reflejen al instante sin retraso por caché.
                </li>
                <li>
                  <strong className="text-foreground">Regeneración Incremental (ISR):</strong> Cuando un vendedor actualiza un producto o los detalles de su tienda, el sistema utiliza purgas de tags automatizadas. En el siguiente acceso de un visitante, Next.js entrega la versión anterior instantáneamente mientras regenera la página con los datos nuevos en segundo plano (stale-while-revalidate), garantizando que las páginas nunca se queden desactualizadas.
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
                  <span className="text-foreground font-semibold">Activa el switch de Nivel 2</span> en este panel administrativo.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Compila la aplicación en modo producción:</span> Ejecuta <code className="bg-muted px-1 rounded text-[10px] font-mono">npm run build</code> en la terminal. Observa en la consola cómo las rutas <code className="bg-muted px-1 rounded text-[10px] font-mono">/productos/[id]</code> y <code className="bg-muted px-1 rounded text-[10px] font-mono">/tienda/[id]</code> se marcan con un círculo relleno <code className="text-purple-500">● (SSG/ISR)</code> en lugar del símbolo dinámico.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Inicia el servidor de producción:</span> Ejecuta <code className="bg-muted px-1 rounded text-[10px] font-mono">npm run start</code> para correr la app con el rendimiento optimizado real.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Abre el navegador en modo Incógnito</span> y navega al detalle de un producto prerenderizado (ej. el producto más reciente) o a la tienda.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Inspecciona las Cabeceras de Red (Network):</span> Abre las Herramientas de Desarrollador (F12), ve a la pestaña Red (Network), recarga la página y haz clic en la primera petición del documento. En "Response Headers", busca la cabecera:
                  <code className="bg-muted px-1 rounded text-[10px] font-mono block mt-1.5 py-1 text-center font-bold text-emerald-600 dark:text-emerald-400">x-nextjs-cache: HIT</code>
                  ¡Esto confirma al 100% que la página fue servida de manera ultra-rápida desde el caché estático del servidor sin consultar a la base de datos!
                </li>
                <li>
                  <span className="text-foreground font-semibold">Prueba la Regeneración:</span> Modifica el producto desde el panel del vendedor. Recarga la página en incógnito. El primer recargo disparará la regeneración en segundo plano (stale-while-revalidate), y la segunda recarga mostrará los datos actualizados con un nuevo <code className="bg-muted px-1 rounded text-[10px] font-mono text-emerald-600">HIT</code>.
                </li>
              </ol>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsNivel2ModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                Entendido, ¡vamos a probarlo!
              </button>
            </div>

          </div>
        </div>
      )}

      {isNivel3ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full rounded-t-[30px] rounded-b-none border-t border-x border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in slide-in-from-bottom duration-300 relative md:rounded-3xl md:border md:max-w-2xl md:max-h-[85vh] md:p-8 md:animate-in md:zoom-in-95 md:duration-200">
            
            {/* Drag Handle for Mobile */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 md:hidden shrink-0" />

            {/* Close Button */}
            <button 
              onClick={() => setIsNivel3ModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-2xl font-bold transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              &times;
            </button>

            {/* Header */}
            <div className="space-y-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold px-3 py-1 rounded-full text-xs">
                DOCUMENTACIÓN DE ESCALA CRÍTICA
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <Zap className="w-7 h-7 text-emerald-500 fill-emerald-500" />
                Optimización Nivel 3: Middleware Optimizado
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Descubre cómo funciona el bypass de verificación en la red Edge y cómo esta optimización reduce a cero la latencia de procesamiento del middleware.
              </p>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Section 1: How it works */}
            <div className="space-y-3">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                ¿Cómo funciona el Nivel 3?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El middleware de Next.js (ejecutándose en Vercel Edge o Cloudflare Workers) intercepta cada solicitud entrante para verificar si el usuario tiene una sesión activa decodificando el token JWT. Aunque esto es necesario para rutas protegidas como el dashboard, en páginas públicas como el Marketplace o tiendas añade un overhead innecesario de 15ms a 50ms por cada petición.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al activar el <strong>Nivel 3</strong>, el middleware detecta las rutas públicas catalogadas y las deja pasar de inmediato (Fast-Track Bypass) sin descifrar ni verificar el token de sesión. El servidor Edge simplemente transfiere la petición a la caché estática o al generador estático (ISR).
              </p>
            </div>

            {/* Section 2: UX */}
            <div className="space-y-3">
              <h3 className="text-md font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                La Experiencia del Usuario (UX)
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5">
                <li>
                  <strong className="text-foreground">Visitante / Comprador:</strong> Obtiene la página pública al instante con una latencia de red prácticamente nula. El servidor no pierde tiempo descifrando cookies antes de decidir qué contenido enviar.
                </li>
                <li>
                  <strong className="text-foreground">Dueño de Tienda / Vendedor:</strong> Mantiene su funcionalidad intacta. Gracias a la carga asíncrona de sesión en el cliente implementada en los Niveles 1 y 2, los scripts del cliente detectarán la sesión del vendedor en segundo plano una vez cargada la página estática pública y activarán sus paneles de edición y borradores automáticamente.
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
                  <span className="text-foreground font-semibold">Activa el switch de Nivel 3</span> en este panel administrativo.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Navega a cualquier ruta pública:</span> Abre el Marketplace (<code className="bg-muted px-1 rounded text-[10px] font-mono">/productos</code>), una tienda o un detalle de producto.
                </li>
                <li>
                  <span className="text-foreground font-semibold">Observa los logs de la consola del servidor:</span> Verás impreso el log característico de atajo optimizado:
                  <code className="bg-muted px-1 rounded text-[10px] font-mono block mt-1.5 py-1 text-center font-bold text-emerald-600 dark:text-emerald-400">[Proxy-Optimized] Fast-tracked public route: /productos</code>
                  ¡Esto confirma que el middleware ignoró por completo la verificación de firmas JWT y sirvió la ruta a máxima velocidad!
                </li>
                <li>
                  <span className="text-foreground font-semibold">Verifica la sesión del vendedor:</span> Inicia sesión como vendedor y entra a tu tienda pública. Comprobarás que los controles de edición asíncronos siguen apareciendo sin problemas, validando la coexistencia de la seguridad en segundo plano y la entrega estática ultra rápida.
                </li>
              </ol>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsNivel3ModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
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
