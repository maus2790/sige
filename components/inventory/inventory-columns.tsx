// components/inventory/inventory-columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { AdjustStockDialog } from "./adjust-stock-dialog";
import { ProductImageGallery } from "@/components/products/product-image-gallery";

export const inventoryColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Producto",
    cell: ({ row }) => {
      const product = row.original;
      const images = product.imageUrls as string[];
      return (
        <div className="flex items-center gap-3">
          <ProductImageGallery
            images={images || []}
            productName={product.name}
            className="h-10 w-10 shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{product.name}</span>
              {product.sku && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                  {product.sku}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{product.category}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "inventory.stockActual",
    header: "Stock Actual",
    cell: ({ row }) => {
      const inventory = row.original.inventory;
      const stock = inventory?.stockActual ?? 0;
      const minStock = inventory?.stockMinimo ?? 5;
      const isLowStock = stock <= minStock && stock > 0;

      return (
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${
            stock === 0 ? "text-muted-foreground/50" : isLowStock ? "text-destructive" : "text-primary"
          }`}>
            {stock}
          </span>
          {isLowStock && stock > 0 && (
            <Badge variant="destructive" className="px-1 py-0 h-5">
              Bajo
            </Badge>
          )}
          {stock === 0 && (
            <Badge variant="secondary" className="px-1 py-0 h-5">
              Agotado
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "inventory.stockMinimo",
    header: "Mínimo",
    cell: ({ row }) => {
      const minStock = row.original.inventory?.stockMinimo ?? 5;
      return <span className="text-muted-foreground font-medium">{minStock}</span>;
    },
  },
  {
    accessorKey: "inventory.ubicacion",
    header: "Ubicación",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => {
      const ubicacion = row.original.inventory?.ubicacion;
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{ubicacion || "No asignada"}</span>
        </div>
      );
    },
  },

  {
    accessorKey: "inventory.updatedAt",
    header: "Última Actualización",
    meta: { className: "hidden lg:table-cell" },
    cell: ({ row }) => {
      const updatedAt = row.original.inventory?.updatedAt;
      if (!updatedAt) return <span className="text-xs text-muted-foreground">Nunca</span>;
      
      return (
        <span className="text-xs text-muted-foreground">
          {format(new Date(updatedAt), "d 'de' MMMM, HH:mm", { locale: es })}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex justify-end gap-2">
          <AdjustStockDialog 
            productId={product.id}
            productName={product.name}
            currentStock={product.inventory?.stockActual ?? 0}
            currentMinStock={product.inventory?.stockMinimo ?? 5}
            currentLocation={product.inventory?.ubicacion ?? ""}
          />
        </div>
      );
    },
  },
];
