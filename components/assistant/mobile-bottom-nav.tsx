"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckCircle, ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/assistant", label: "Panel", icon: LayoutDashboard },
  { href: "/assistant/verificaciones", label: "Verificaciones", icon: CheckCircle },
  { href: "/assistant/pagos-pendientes", label: "Pagos", icon: ClipboardList },
  { href: "/assistant/tiendas", label: "Tiendas", icon: Users },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/assistant" 
            ? pathname === "/assistant" 
            : pathname === item.href || pathname.startsWith(item.href + "/");
          
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
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
