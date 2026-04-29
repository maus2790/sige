"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { userColumns } from "./user-columns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, User, Mail, Phone, Calendar, Shield, Store } from "lucide-react";
import Link from "next/link";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { DeleteUserButton } from "./delete-user-button";
import { cn } from "@/lib/utils";

interface UserTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialRole: string;
  roles: string[];
}

export function UserTableClient({
  initialData,
  total,
  pageCount,
  initialPage,
  initialSearch,
  initialRole,
  roles,
}: UserTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estado para datos locales (necesario para scroll infinito en móvil)
  const [displayData, setDisplayData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Sincronizar datos iniciales cuando cambian los props
  useEffect(() => {
    setDisplayData(initialData);
    setCurrentPage(initialPage);
  }, [initialData, initialPage]);

  const createQueryString = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "" || value === "todos") {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    }
    return newSearchParams.toString();
  };

  const handlePaginationChange = (pageIndex: number) => {
    const queryString = createQueryString({ page: pageIndex + 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleSearchChange = (search: string) => {
    const queryString = createQueryString({ search, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleRoleChange = (role: string) => {
    const queryString = createQueryString({ role, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleLoadMore = () => {
    if (currentPage >= pageCount) return;
    const nextPage = currentPage + 1;
    const queryString = createQueryString({ page: nextPage });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`, { scroll: false });
    });
    setCurrentPage(nextPage);
  };

  // Lógica para anexar datos si es scroll infinito (móvil)
  useEffect(() => {
    if (currentPage > 1) {
      setDisplayData(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newItems = initialData.filter(p => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
    } else {
      setDisplayData(initialData);
    }
  }, [initialData]);

  const renderMobileCard = (user: any) => {
    const imageUrls = user.image ? [user.image] : [];
    const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
      seller: { label: "Vendedor", variant: "default", className: "bg-primary/10 text-primary hover:bg-primary/20 border-0" },
      assistant: { label: "Asistente", variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-0" },
      superadmin: { label: "Super Admin", variant: "destructive", className: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-0" },
    };
    const config = roleConfig[user.role] || { label: user.role, variant: "outline" };

    return (
      <div className="flex flex-col gap-4 w-full min-w-0 overflow-hidden">
        <div className="flex gap-4 overflow-hidden">
          <ProductImageGallery
            images={imageUrls}
            productName={user.name}
            className="h-16 w-16 shrink-0 rounded-full shadow-sm border-2 border-background overflow-hidden bg-muted"
          />
          <div className="flex flex-col flex-1 min-w-0 py-0.5 overflow-hidden">
            <h3 className="font-bold text-base truncate leading-tight mb-1 text-foreground">
              {user.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge 
                variant={config.variant} 
                className={cn("text-[10px] px-1.5 py-0 font-medium uppercase tracking-wider", config.className)}
              >
                {config.label}
              </Badge>
              {user.videoPlan === "pro" && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
                  PRO
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border/40 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Teléfono</span>
            <div className="flex items-center gap-1 font-medium text-foreground text-sm min-w-0">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{user.phone || "—"}</span>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Registro</span>
            <div className="flex items-center gap-1 font-medium text-foreground text-sm min-w-0">
              <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-BO") : "—"}</span>
            </div>
          </div>
          {user.role === "seller" && user.store && (
            <div className="col-span-2 flex items-center gap-2 pt-1.5 mt-0.5 border-t border-border/40 min-w-0">
              <Store className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[11px] font-medium text-foreground truncate flex-1">Tienda: {user.store.name}</span>
              {user.store.verified ? (
                <Badge className="h-4 text-[9px] bg-green-50 text-green-600 border-green-100 shrink-0">Verificada</Badge>
              ) : (
                <Badge variant="outline" className="h-4 text-[9px] text-muted-foreground shrink-0">Pendiente</Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 w-full min-w-0">
          <Link href={`/admin/usuarios/${user.id}`} className="flex-1 min-w-0">
            <Button variant="outline" size="sm" className="w-full gap-2 h-9 rounded-lg border-primary/20 hover:border-primary/50 text-primary">
              <Pencil className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Editar</span>
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <DeleteUserButton userId={user.id} userName={user.name} className="w-full h-9 rounded-lg border border-destructive/20 hover:border-destructive/50" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      columns={userColumns}
      data={displayData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleRoleChange}
      categories={roles}
      isLoading={isPending}
      renderMobileCard={renderMobileCard}
      onLoadMore={handleLoadMore}
      hasMore={currentPage < pageCount}
    />
  );
}