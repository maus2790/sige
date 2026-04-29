"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { columns } from "./product-columns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Package, Tag } from "lucide-react";
import Link from "next/link";
import { DeleteProductButton } from "./delete-product-button";
import { ProductImageGallery } from "./product-image-gallery";

interface ProductsTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  initialLowStock: boolean;
  categories: string[];
}

export function ProductsTableClient({
  initialData,
  pageCount,
  initialPage,
  initialSearch,
  initialCategory,
  initialLowStock,
  categories,
}: ProductsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Estado para datos locales (necesario para scroll infinito en móvil)
  const [displayData, setDisplayData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Sincronizar datos iniciales cuando cambian los props (búsqueda, filtros, etc.)
  useEffect(() => {
    setDisplayData(initialData);
    setCurrentPage(initialPage);
  }, [initialData, initialPage]);

  const createQueryString = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "") {
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

  const handleSearchChange = (value: string) => {
    const queryString = createQueryString({ search: value, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleCategoryChange = (value: string) => {
    const queryString = createQueryString({ category: value, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleLowStockChange = (value: boolean) => {
    const queryString = createQueryString({ lowStock: value ? "true" : null, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleLoadMore = () => {
    if (currentPage >= pageCount) return;
    
    const nextPage = currentPage + 1;
    const queryString = createQueryString({ page: nextPage });
    
    // En móvil, queremos anexar los datos
    // Nota: Esto requiere que el componente padre o el servidor devuelvan los datos
    // Pero como estamos usando router.push, el componente se volverá a renderizar con nuevos props.
    // Para que el scroll infinito funcione de verdad sin "parpadeos", necesitaríamos 
    // fetch en el cliente, pero por ahora usaremos la transición de Next.js
    // que es lo que el proyecto está usando.
    
    startTransition(() => {
      router.push(`${pathname}?${queryString}`, { scroll: false });
      // El useEffect se encargará de actualizar displayData si detectamos que es un append
      // Pero para simplificar, usaremos el comportamiento nativo de Next.js
    });
    
    setCurrentPage(nextPage);
  };

  // Lógica para anexar datos si es scroll infinito (móvil)
  useEffect(() => {
    // Si la página es > 1 y tenemos datos nuevos, los anexamos si no están ya
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

  const renderMobileCard = (product: any) => {
    const images = (product.imageUrls || []) as string[];
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    const status = (product.status as string) || "Nuevo";
    const stock = product.inventory?.stockActual ?? product.stock ?? 0;

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-4">
          <ProductImageGallery
            images={images}
            productName={product.name}
            className="h-20 w-20 shrink-0 rounded-lg shadow-sm"
          />
          <div className="flex flex-col flex-1 min-w-0 py-0.5">
            <h3 className="font-bold text-base line-clamp-2 leading-tight mb-1 text-foreground">
              {product.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                {product.category || "Sin categoría"}
              </Badge>
              {status === "Nuevo" && (
                <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  Nuevo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-auto">
              <Tag className="h-3 w-3" />
              {product.sku || "N/A"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border/40">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Precio</span>
            <span className="font-bold text-foreground text-sm">Bs. {price.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Stock</span>
            <span className={`font-bold text-sm ${stock <= (product.inventory?.stockMinimo ?? 0) ? "text-destructive" : "text-foreground"}`}>
              {stock} <span className="text-[10px] font-normal text-muted-foreground uppercase">unidades</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link href={`/dashboard/productos/${product.id}/editar`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2 h-9 rounded-lg border-primary/20 hover:border-primary/50 text-primary">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
          </Link>
          <div className="flex-1">
            <DeleteProductButton
              productId={product.id}
              productName={product.name}
              className="w-full h-9 rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={displayData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleCategoryChange}
      onLowStockChange={handleLowStockChange}
      initialLowStock={initialLowStock}
      categories={categories}
      isLoading={isPending}
      renderMobileCard={renderMobileCard}
      onLoadMore={handleLoadMore}
      hasMore={currentPage < pageCount}
    />
  );
}
