import { requireRole } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protección de ruta: solo vendedores pueden acceder
  // Si un superadmin entra aquí, requireRole lo redirigirá a /admin automáticamente
  await requireRole("seller");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <DashboardNav />
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}