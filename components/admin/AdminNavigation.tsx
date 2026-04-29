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
  ShieldAlert
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
      <aside className="hidden md:flex w-64 bg-background border-r min-h-screen p-4 flex-col fixed left-0 top-0 h-screen">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">SIGE</h1>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Administración
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

      {/* Bottom Navigation Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t md:hidden z-30">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
