import { requireRole } from "@/app/actions/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protección de ruta: vendedores, asistentes y superadmin pueden acceder al dashboard de productos
  await requireRole(["seller", "assistant", "superadmin"]);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        <DashboardNav />
        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}