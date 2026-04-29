// components/inventory/inventory-table-client.tsx

"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { inventoryColumns } from "./inventory-columns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, AlertTriangle } from "lucide-react";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { ProductImageGallery } from "@/components/products/product-image-gallery";

interface InventoryTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  initialLowStock: boolean;
  categories: string[];
}

export function InventoryTableClient({
  initialData,
  pageCount,
  initialPage,
  initialSearch,
  initialCategory,
  initialLowStock,
  categories,
}: InventoryTableClientProps) {
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

  const renderMobileCard = (product: any) => {
    const images = product.imageUrls as string[];
    const inventory = product.inventory;
    const stock = inventory?.stockActual ?? 0;
    const minStock = inventory?.stockMinimo ?? 5;
    const isLowStock = stock <= minStock && stock > 0;
    const ubicacion = inventory?.ubicacion || "No asignada";

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-4">
          <ProductImageGallery
            images={images}
            productName={product.name}
            className="h-16 w-16 shrink-0 rounded-lg shadow-sm"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2 leading-tight mb-1">{product.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{product.sku || "N/A"}</span>
              <span className="truncate">{product.category || "Sin categoría"}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{ubicacion}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stock Actual</p>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${
                stock === 0 ? "text-muted-foreground/50" : isLowStock ? "text-destructive" : "text-primary"
              }`}>
                {stock}
              </span>
              {isLowStock && stock > 0 && (
                <Badge variant="destructive" className="px-1 py-0 h-5 text-[10px]">
                  Bajo
                </Badge>
              )}
              {stock === 0 && (
                <Badge variant="secondary" className="px-1 py-0 h-5 text-[10px]">
                  Agotado
                </Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Stock Mínimo</p>
            <p className="font-bold text-foreground">
              {minStock} uds
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <AdjustStockDialog
            productId={product.id}
            productName={product.name}
            currentStock={stock}
            currentMinStock={minStock}
            currentLocation={ubicacion}
            className="w-full shadow-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <DataTable
      columns={inventoryColumns}
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
