// components/comercial/comercial-table-client.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { comercialColumns } from "./comercial-columns";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Star, Tag, Filter, Settings2 } from "lucide-react";
import { EditComercialDialog } from "./edit-comercial-dialog";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ComercialTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  initialOffer: string;
  initialPublished: string;
  initialFeatured: string;
  categories: string[];
}

export function ComercialTableClient({
  initialData,
  pageCount,
  initialPage,
  initialSearch,
  initialCategory,
  initialOffer,
  initialPublished,
  initialFeatured,
  categories,
}: ComercialTableClientProps) {
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
      if (value === null || value === "todos") {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    }
    return newSearchParams.toString();
  };

  const handlePaginationChange = (pageIndex: number) => {
    const queryString = createQueryString({ page: pageIndex + 1 });
    startTransition(() => router.push(`${pathname}?${queryString}`));
  };

  const handleSearchChange = (value: string) => {
    const queryString = createQueryString({ search: value, page: 1 });
    startTransition(() => router.push(`${pathname}?${queryString}`));
  };

  const handleCategoryChange = (value: string) => {
    const queryString = createQueryString({ category: value, page: 1 });
    startTransition(() => router.push(`${pathname}?${queryString}`));
  };

  const handleFilterToggle = (key: string, value: string) => {
    const currentVal = searchParams.get(key) || "todos";
    const newVal = currentVal === value ? "todos" : value;
    const queryString = createQueryString({ [key]: newVal, page: 1 });
    startTransition(() => router.push(`${pathname}?${queryString}`));
  };

  const handleLoadMore = () => {
    if (currentPage >= pageCount) return;
    const nextPage = currentPage + 1;
    const queryString = createQueryString({ page: nextPage });
    startTransition(() => router.push(`${pathname}?${queryString}`, { scroll: false }));
    setCurrentPage(nextPage);
  };

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

  // Aplicar filtros locales
  const filteredData = displayData.filter(p => {
    const cfg = p.comercialConfig || {};
    let keep = true;

    if (initialOffer !== "todos") {
      const hasOferta = !!cfg.precioOferta && cfg.precioOferta > 0;
      keep = keep && (initialOffer === "con_oferta" ? hasOferta : !hasOferta);
    }

    if (initialPublished !== "todos") {
      const isPub = cfg.isPublished === true;
      keep = keep && (initialPublished === "publicado" ? isPub : !isPub);
    }

    if (initialFeatured !== "todos") {
      const isDest = cfg.esDestacado === true;
      keep = keep && (initialFeatured === "destacado" ? isDest : !isDest);
    }

    return keep;
  });

  const renderMobileCard = (product: any) => {
    const images = (product.imageUrls || []) as string[];
    const cfg = product.comercialConfig || {};
    const precioVenta = cfg.precioVenta ?? 0;
    const precioAdq = cfg.precioAdquisicion ?? 0;
    const precioOferta = cfg.precioOferta;
    const isPublished = cfg.isPublished ?? false;
    const esDestacado = cfg.esDestacado ?? false;

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-4">
          <ProductImageGallery images={images} productName={product.name} className="h-16 w-16 shrink-0 rounded-lg shadow-sm" />
          <div className="flex flex-col flex-1 min-w-0 py-0.5">
            <h3 className="font-bold text-base line-clamp-2 leading-tight mb-1 text-foreground">{product.name}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">{product.category || "Sin categoría"}</Badge>
              {esDestacado && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-1">
              <Tag className="h-3 w-3" />{product.sku || "N/A"}
            </div>
          </div>
        </div>
        <div className="bg-muted/40 p-3 rounded-xl border border-border/40 text-xs sm:text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-0.5">Costo</span>
              <span className="font-semibold text-muted-foreground">Bs. {precioAdq.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-0.5">Venta</span>
              <span className="font-bold text-foreground">Bs. {precioVenta.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-0.5">Oferta</span>
              {precioOferta ? (
                <span className="font-bold text-green-600">Bs. {precioOferta.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {isPublished ? (
              <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1 text-[10px] px-1.5"><Eye className="h-3 w-3" /> Público</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 text-[10px] px-1.5"><EyeOff className="h-3 w-3" /> Oculto</Badge>
            )}
          </div>
          <EditComercialDialog product={product} />
        </div>
      </div>
    );
  };

  const columnsWithActions = comercialColumns.map(col => {
    if (col.id === "actions") {
      return {
        ...col,
        cell: ({ row }: any) => (
          <div className="text-right">
            <EditComercialDialog product={row.original} />
          </div>
        ),
      };
    }
    return col;
  });

  // Filtros desplegables con Switch
  const filterActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel>Filtros Avanzados</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-4 p-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="filter-offer" className="cursor-pointer">Solo en Oferta</Label>
            <Switch
              id="filter-offer"
              checked={initialOffer === "con_oferta"}
              onCheckedChange={() => handleFilterToggle("oferta", "con_oferta")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="filter-published" className="cursor-pointer">Solo Públicos</Label>
            <Switch
              id="filter-published"
              checked={initialPublished === "publicado"}
              onCheckedChange={() => handleFilterToggle("publicado", "publicado")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="filter-hidden" className="cursor-pointer">Solo Ocultos</Label>
            <Switch
              id="filter-hidden"
              checked={initialPublished === "oculto"}
              onCheckedChange={() => handleFilterToggle("publicado", "oculto")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="filter-featured" className="cursor-pointer">Solo Destacados</Label>
            <Switch
              id="filter-featured"
              checked={initialFeatured === "destacado"}
              onCheckedChange={() => handleFilterToggle("destacado", "destacado")}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <DataTable
      columns={columnsWithActions}
      data={filteredData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleCategoryChange}
      categories={categories}
      isLoading={isPending}
      renderMobileCard={renderMobileCard}
      onLoadMore={handleLoadMore}
      hasMore={currentPage < pageCount}
      extraActions={filterActions}
    />
  );
}
