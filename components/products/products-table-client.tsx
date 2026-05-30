"use client";

import { useTransition, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { columns as baseColumns } from "./product-columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Tag } from "lucide-react";
import Link from "next/link";
import { DeleteProductButton } from "./delete-product-button";
import { ProductImageGallery } from "./product-image-gallery";

type ProductData = {
  id: string;
  name?: string;
  imageUrls?: string[];
  imageUrlsThumb?: string[];
  imageUrlsOg?: string[];
  category?: string;
  status?: string;
  sku?: string;
  stock?: number;
  inventory?: { stockActual?: number; stockMinimo?: number };
};

interface ProductsTableClientProps {
  initialData: ProductData[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  categories: string[];
  onEdit?: (product: ProductData) => void;
}

export function ProductsTableClient({
  initialData,
  pageCount,
  initialPage,
  categories,
  onEdit,
}: ProductsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const displayData = initialData;
  const currentPage = initialPage;

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



  const handleLoadMore = () => {
    if (currentPage >= pageCount) return;
    
    const nextPage = currentPage + 1;
    const queryString = createQueryString({ page: nextPage });
    
    startTransition(() => {
      router.push(`${pathname}?${queryString}`, { scroll: false });
    });
  };

  const renderMobileCard = (product: ProductData) => {
    const images = (product.imageUrls || []) as string[];
    const status = (product.status as string) || "Nuevo";
    const stock = product.inventory?.stockActual ?? product.stock ?? 0;

    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-4">
          <ProductImageGallery
            images={images}
            imagesThumb={product.imageUrlsThumb || []}
            imagesOg={product.imageUrlsOg || []}
            productName={product.name ?? ""}
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

        <div className="bg-muted/40 p-3 rounded-xl border border-border/40">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-0.5">Stock Disponible</span>
            <span className={`font-bold text-sm ${stock <= (product.inventory?.stockMinimo ?? 0) ? "text-destructive" : "text-foreground"}`}>
              {stock} <span className="text-[10px] font-normal text-muted-foreground uppercase">unidades en inventario</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 h-9 rounded-lg border-primary/20 hover:border-primary/50 text-primary"
              onClick={() => onEdit(product)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
          ) : (
            <Link href={`/dashboard/productos/${product.id}/editar`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2 h-9 rounded-lg border-primary/20 hover:border-primary/50 text-primary">
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </Button>
            </Link>
          )}
          <div className="flex-1">
            <DeleteProductButton
              productId={product.id}
              productName={product.name ?? ""}
              className="w-full h-9 rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  const columns = useMemo(() => {
    return baseColumns.map((column) => {
      if (column.id !== "actions") {
        return column;
      }

      return {
        ...column,
        cell: ({ row }: { row: { original: ProductData } }) => {
          const product = row.original as ProductData;

          return (
            <div className="flex items-center justify-end gap-2">
              {onEdit ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              ) : (
                <Link href={`/dashboard/productos/${product.id}/editar`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <DeleteProductButton
                productId={product.id}
                productName={product.name ?? ""}
              />
            </div>
          );
        },
      };
    });
  }, [onEdit]);

  return (
    <DataTable
      columns={columns as any}
      data={displayData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleCategoryChange}
      categories={categories}
      isLoading={isPending}
      renderMobileCard={renderMobileCard}
      onLoadMore={handleLoadMore}
      hasMore={currentPage < pageCount}
    />
  );
}
