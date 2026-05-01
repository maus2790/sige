//app/auth/layout.tsx
import { Suspense } from "react";
import { Zap, BarChart3, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";

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
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary/5 border-r border-white/10 relative overflow-hidden">
          {/* Animated Background Element for Left Side */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-gradient opacity-[0.03] blur-[100px] animate-float" />
          
          <div className="z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient shadow-lg shadow-primary/20 mb-6 transform hover:rotate-6 transition-transform duration-500">
              <span className="text-3xl font-black text-white italic">S</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-brand-gradient mb-2">SIGE Cloud</h1>
            <p className="text-xl font-medium text-muted-foreground/80 max-w-md">
              Potencia tu negocio con la plataforma de gestión más completa y moderna del mercado.
            </p>
          </div>

          <div className="z-10 space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000 delay-300">
            <FeatureItem 
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              title="Gestión en Tiempo Real"
              description="Controla tu inventario, ventas y movimientos al instante desde cualquier lugar."
            />
            <FeatureItem 
              icon={<BarChart3 className="w-6 h-6 text-blue-500" />}
              title="Analítica Avanzada"
              description="Toma decisiones inteligentes basadas en datos reales y reportes detallados."
            />
            <FeatureItem 
              icon={<Smartphone className="w-6 h-6 text-purple-500" />}
              title="Experiencia Mobile-First"
              description="Accede a todas las funciones desde tu celular con una interfaz optimizada."
            />
            <FeatureItem 
              icon={<ShieldCheck className="w-6 h-6 text-green-500" />}
              title="Seguridad de Grado Empresarial"
              description="Tu información protegida con cifrado de punta a punta y respaldos automáticos."
            />
          </div>

          <div className="z-10 flex items-center gap-4 animate-in fade-in duration-1000 delay-700">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden flex items-center justify-center">
                   <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              <span className="text-primary font-bold">+500 empresas</span> ya confían en nosotros
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 z-10 overflow-y-auto">
          {/* Header for Mobile only */}
          <div className="lg:hidden mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gradient shadow-lg shadow-primary/20 mb-4">
              <span className="text-3xl font-black text-white italic">S</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-brand-gradient">SIGE</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Gestión Empresarial Inteligente</p>
          </div>

          <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700 lg:delay-200">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Cargando sistema...</p>
              </div>
            }>
              {children}
            </Suspense>
            
            <footer className="mt-12 text-center text-xs text-muted-foreground/50 font-medium">
              &copy; {new Date().getFullYear()} SIGE Cloud Services. <br className="sm:hidden" /> Todos los derechos reservados.
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-4 group cursor-default">
      <div className="shrink-0 w-12 h-12 rounded-xl bg-background shadow-sm border border-white/10 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}