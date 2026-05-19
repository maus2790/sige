import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-3xl mx-auto z-10 relative">
        {/* Back Button */}
        <Link 
          href="/auth/login" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a iniciar sesión
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Términos y Condiciones</h1>
            <p className="text-sm text-muted-foreground">Última actualización: Mayo 2026</p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="glass-card border-white/20 dark:border-white/5 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 bg-card/40 backdrop-blur-md">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">1.</span> Aceptación de los Términos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al crear una cuenta, acceder o utilizar la plataforma SIGE (Market Shop & Gift Cards), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">2.</span> Registro y Cuentas de Usuario
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Para vender o comprar en nuestra plataforma, debe registrarse y mantener una cuenta activa. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender cuentas que infrinjan estas normas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">3.</span> Compras y Ventas en el Marketplace
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SIGE facilita un espacio digital para la publicación de productos y tiendas en Bolivia. Los vendedores son responsables de la veracidad de las descripciones, stock y entrega de los productos. SIGE no se hace responsable de disputas comerciales directas entre compradores y vendedores, aunque asistirá en la resolución de problemas mediante soporte técnico.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">4.</span> Uso de Gift Cards y Billetera Digital
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Las Tarjetas de Regalo (Gift Cards) Canjeables y Saldos digitales emitidos en SIGE son de uso exclusivo dentro de la plataforma en comercios autorizados. La recarga, el control y la verificación de canje se procesan de forma segura bajo estrictos estándares de validación para garantizar la seguridad de su dinero.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">5.</span> Modificaciones del Servicio
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nos reservamos el derecho de modificar o discontinuar el servicio, temporal o permanentemente, con o sin previo aviso. Le notificaremos sobre cambios significativos a través de notificaciones push o correo electrónico registrado.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Navegación segura y cifrada. SIGE Cloud Services &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
