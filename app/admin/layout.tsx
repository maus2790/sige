// app/admin/layout.tsx
// Server component with route protection
import { requireRole } from "@/app/actions/auth";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protección de ruta: solo superadmin puede acceder
  await requireRole("superadmin");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <AdminNavigation />

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}