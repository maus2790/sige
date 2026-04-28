"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  Store,
  Settings,
  LayoutDashboard,
  LogOut,
  Tags,
} from "lucide-react";
import { handleLogout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/tiendas", label: "Tiendas", icon: Store },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-64 bg-white border-r min-h-screen p-4 fixed left-0 top-0">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-primary">SIGE</h1>
          <p className="text-sm text-muted-foreground">Administrador</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 w-56">
          <form action={handleLogout}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t md:hidden z-30">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
