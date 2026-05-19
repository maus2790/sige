import Link from "next/link";
import { ArrowLeft, Shield, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Política de Privacidad</h1>
            <p className="text-sm text-muted-foreground">Última actualización: Mayo 2026</p>
          </div>
        </div>

        {/* Privacy Content */}
        <div className="glass-card border-white/20 dark:border-white/5 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 bg-card/40 backdrop-blur-md">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">1.</span> Información que Recopilamos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Recopilamos información cuando se registra en nuestra plataforma, inicia sesión, publica un producto o interactúa con las funciones de geolocalización. La información recopilada incluye su nombre, dirección de correo electrónico, ubicación geográfica en tiempo real (únicamente si autoriza el mapa de tiendas) e imágenes de productos que sube a nuestros servidores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">2.</span> Uso de la Información
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La información que recopilamos se utiliza exclusivamente para:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>Personalizar su experiencia y facilitar las operaciones en el marketplace.</li>
              <li>Mostrar su comercio en el mapa interactivo si decide habilitar su tienda de forma pública.</li>
              <li>Validar transacciones de compras, recargas y canjes de Gift Cards de forma segura.</li>
              <li>Enviar notificaciones importantes sobre su cuenta, alertas de ventas e integraciones push (a través de OneSignal).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">3.</span> Almacenamiento y Protección de Datos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Implementamos rigurosas medidas de seguridad técnica para proteger sus datos personales. Sus contraseñas se almacenan mediante hashing seguro unidireccional y las imágenes subidas al marketplace se guardan en servidores cifrados de Cloudflare R2 de alta disponibilidad. No vendemos ni compartimos sus datos personales con terceros para fines publicitarios.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">4.</span> Cookies y Sesión
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utilizamos cookies esenciales y cookies de sesión cifradas para mantener su sesión activa de forma segura. Si decide iniciar sesión con Google (a través de NextAuth), únicamente almacenamos los datos básicos devueltos por su proveedor de autenticación para vincular su cuenta en SIGE de manera transparente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-mono">5.</span> Sus Derechos sobre sus Datos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Usted tiene derecho a acceder, corregir, actualizar o solicitar la eliminación total de sus datos personales en cualquier momento. Puede gestionar la información de su perfil y tiendas directamente desde su panel de control o solicitar soporte técnico para la baja definitiva de su cuenta.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 flex items-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Tus datos están protegidos bajo estándares internacionales. SIGE Cloud Services &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
