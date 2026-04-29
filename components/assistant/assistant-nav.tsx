"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckCircle,
  ClipboardList,
  Users,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { handleLogout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/assistant", label: "Panel Principal", icon: LayoutDashboard },
  { href: "/assistant/verificaciones", label: "Verificaciones", icon: CheckCircle },
  { href: "/assistant/pagos-pendientes", label: "Pagos Pendientes", icon: ClipboardList },
  { href: "/assistant/tiendas", label: "Gestión Tiendas", icon: Users },
];

export function AssistantNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-background border-r min-h-screen p-4 flex-col sticky top-0 h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">SIGE</h1>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Modo Asistente
        </p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  isActive && "bg-muted text-primary hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t">
        <form action={handleLogout}>
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
