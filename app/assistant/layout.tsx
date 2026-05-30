import { requireRole } from "@/app/actions/auth";
import { AssistantNav } from "@/components/assistant/assistant-nav";
import { MobileBottomNav } from "@/components/assistant/mobile-bottom-nav";

export default async function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protección de ruta: asistentes y superadmin pueden acceder
  await requireRole(["assistant", "superadmin"]);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        <AssistantNav />
        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}