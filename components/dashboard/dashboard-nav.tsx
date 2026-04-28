"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, BarChart3, Settings, LayoutDashboard, LogOut } from "lucide-react";
import { handleLogout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/inventario", label: "Inventario", icon: Package },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block w-64 bg-white border-r min-h-screen p-4 sticky top-0 h-screen">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-primary">SIGE</h1>
        <p className="text-sm text-muted-foreground">Vendedor</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-600">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
