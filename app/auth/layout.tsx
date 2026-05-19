//app/auth/layout.tsx
import { Suspense } from "react";
import Link from "next/link";
import { Zap, ShoppingBag, Gift, Store, Smartphone, ArrowLeft, Bell, FileText, MapPin } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden selection:bg-primary/20">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] -z-10 brightness-100 contrast-150" />

      {/* Main Container: Split Layout on Desktop */}
      <div className="flex w-full min-h-screen">

        {/* Left Side: Branding & Features (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 pt-6 bg-primary/5 border-r border-white/10 relative overflow-hidden">
          {/* Animated Background Element for Left Side */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-gradient opacity-[0.03] blur-[100px] animate-float" />

          <div className="z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <Link href="/" className="flex items-center gap-4 group cursor-pointer focus:outline-none mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient shadow-lg shadow-primary/20 transform group-hover:rotate-6 transition-transform duration-500">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-brand-gradient group-hover:opacity-80 transition-opacity leading-none">SIGE</h1>
            </Link>
            <p className="text-xl font-medium text-muted-foreground/80 max-w-2xl pb-4">
              Market Shop & Gift Cards. La plataforma integral para comprar, vender, regalar y gestionar tu negocio.
            </p>
          </div>

          <div className="z-10 space-y-6 animate-in fade-in slide-in-from-left-12 duration-1000 delay-300">
            <FeatureItem
              href="/"
              icon={<ShoppingBag className="w-6 h-6 text-blue-500" />}
              title="Market Shop"
              description="El marketplace más completo de Bolivia. Encuentra, vende y compra los mejores productos locales."
            />
            <FeatureItem
              href="/mapa"
              icon={<MapPin className="w-6 h-6 text-rose-500" />}
              title="Mapa de Tiendas y Productos"
              description="Explora de forma interactiva y geográfica las tiendas y productos más cercanos a tu ubicación en tiempo real."
            />
            <FeatureItem
              href="/gift-cards"
              icon={<Gift className="w-6 h-6 text-purple-500" />}
              title="Gift Cards"
              description="Billetera digital integrada para enviar y recibir tarjetas de regalo personalizadas al instante."
            />
            <FeatureItem
              icon={<Store className="w-6 h-6 text-emerald-500" />}
              title="Gestión de Ventas y Almacén"
              description="Herramientas para tiendas y vendedores casuales. Controla tu inventario en tiempo real."
            />
            <FeatureItem
              icon={<Bell className="w-6 h-6 text-yellow-500" />}
              title="Facturación y Notificaciones"
              description="Recibe alertas push de compras, emite facturas y lleva el control total de tu negocio."
            />
          </div>

          <div className="z-10 flex items-center gap-4 animate-in fade-in duration-1000 delay-700">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden flex items-center justify-center">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              <span className="text-primary font-bold">+10,000 bolivianos</span> ya compran aquí
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center lg:justify-start p-4 sm:p-12 lg:p-8 lg:pt-4 z-10 overflow-y-auto">
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 group cursor-pointer focus:outline-none">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gradient shadow-md shadow-primary/20 transform group-hover:rotate-6 transition-transform duration-500">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-brand-gradient">SIGE</span>
            <span className="text-muted-foreground text-xs font-medium">| Shop & Gifts</span>
          </Link>

          <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700 lg:delay-200">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Cargando sistema...</p>
              </div>
            }>
              {children}
            </Suspense>

            <footer className="mt-6 text-center text-xs text-muted-foreground/50 font-medium">
              &copy; {new Date().getFullYear()} SIGE Cloud Services. <br className="sm:hidden" /> Todos los derechos reservados.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href?: string }) {
  const content = (
    <>
      <div className="shrink-0 w-12 h-12 rounded-xl bg-background shadow-sm border border-white/10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
          {title} {href && <span className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>}
        </h3>
        <p className="text-sm text-muted-foreground/80 leading-relaxed">{description}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex gap-4 group cursor-pointer">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex gap-4 group cursor-default">
      {content}
    </div>
  );
}