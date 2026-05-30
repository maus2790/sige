"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  ShieldCheck,
  Store,
  ChevronRight,
} from "lucide-react";

interface PanelLink {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}

const allPanels: PanelLink[] = [
  {
    href: "/admin",
    label: "Administrador",
    description: "Gestión global",
    icon: ShieldAlert,
    color: "text-rose-500",
    activeColor: "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400",
  },
  {
    href: "/assistant",
    label: "Asistente",
    description: "Verificaciones y pagos",
    icon: ShieldCheck,
    color: "text-violet-500",
    activeColor: "bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400",
  },
  {
    href: "/dashboard",
    label: "Vendedor",
    description: "Productos y ventas",
    icon: Store,
    color: "text-blue-500",
    activeColor: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
];

/** Panels visible per role */
const panelsByRole: Record<string, string[]> = {
  superadmin: ["/admin", "/assistant", "/dashboard"],
  assistant:  ["/assistant", "/dashboard"],
  seller:     ["/dashboard"],
};

export function DashboardSwitcher() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Role can come from NextAuth session OR from cookie (credentials login)
  const cookieRole =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((r) => r.startsWith("user_role="))
          ?.split("=")?.[1]
      : undefined;

  const role = (session?.user as any)?.role ?? cookieRole ?? "seller";
  const allowedHrefs = panelsByRole[role] ?? ["/dashboard"];

  // Only render if the user has access to more than one panel
  if (allowedHrefs.length <= 1) return null;

  const visiblePanels = allPanels.filter((p) => allowedHrefs.includes(p.href));

  // Detect which root section is currently active
  const activeHref = visiblePanels
    .slice()
    .sort((a, b) => b.href.length - a.href.length)
    .find((p) => pathname === p.href || pathname.startsWith(p.href + "/"))?.href;

  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
        Cambiar Panel
      </p>
      <div className="space-y-1">
        {visiblePanels.map((panel) => {
          const Icon = panel.icon;
          const isActive = activeHref === panel.href;
          return (
            <Link key={panel.href} href={panel.href}>
              <div
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all duration-150 group cursor-pointer",
                  isActive
                    ? panel.activeColor + " border-current shadow-sm"
                    : "border-transparent hover:bg-muted/60 hover:border-border/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "" : panel.color + " opacity-70 group-hover:opacity-100"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-none truncate">
                    {panel.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {panel.description}
                  </p>
                </div>
                {isActive ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                    Activo
                  </span>
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
