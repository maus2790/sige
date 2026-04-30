"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  ShoppingBag
} from "lucide-react";
import { signOut } from "next-auth/react";
import { handleLogout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/inventario", label: "Inventario", icon: Package },
  { href: "/dashboard/comercial", label: "Comercial", icon: ShoppingBag },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-background border-r min-h-screen p-4 flex-col sticky top-0 h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">SIGE</h1>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Panel Vendedor
        </p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname === item.href || pathname.startsWith(item.href + "/");
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
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-destructive/10"
          onClick={async () => {
            await handleLogout();
            signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
}
