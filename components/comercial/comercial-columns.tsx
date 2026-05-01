// components/comercial/comercial-columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Star } from "lucide-react";
import { ProductImageGallery } from "@/components/products/product-image-gallery";

export const comercialColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Producto",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3">
          <ProductImageGallery
            images={product.imageUrls || []}
            productName={product.name}
            className="w-10 h-10 shrink-0 shadow-sm"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate max-w-[200px]">{product.name}</span>
            <span className="text-xs text-muted-foreground truncate">{product.category}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "precioAdquisicion",
    header: "P. Adquisición",
    cell: ({ row }) => {
      const val = row.original.comercialConfig?.precioAdquisicion;
      return (
        <span className="text-muted-foreground">
          Bs. {val?.toFixed(2) || "0.00"}
        </span>
      );
    },
  },
  {
    accessorKey: "precioVenta",
    header: "P. Venta",
    cell: ({ row }) => {
      const val = row.original.comercialConfig?.precioVenta;
      return (
        <span className="font-bold">
          Bs. {val?.toFixed(2) || "0.00"}
        </span>
      );
    },
  },
  {
    accessorKey: "precioOferta",
    header: "P. Oferta",
    cell: ({ row }) => {
      const config = row.original.comercialConfig;
      if (!config?.precioOferta) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            Bs. {config.precioOferta.toFixed(2)}
            {config.ofertaPorcentaje > 0 && ` (${config.ofertaPorcentaje}% OFF)`}
          </Badge>
          {config.fechaFinOferta && (
            <span className="text-[10px] text-muted-foreground">
              Expira en {Math.max(0, Math.ceil((new Date(config.fechaFinOferta).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días
            </span>
          )}
          {config.limiteCompra && (
            <span className="text-[10px] text-muted-foreground">
              Límite: {config.limiteCompra} unid.
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isPublished",
    header: "Estado",
    cell: ({ row }) => {
      const isPublished = row.original.comercialConfig?.isPublished;
      return isPublished ? (
        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
          <Eye className="h-3 w-3" /> Público
        </Badge>
      ) : (
        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1">
          <EyeOff className="h-3 w-3" /> Oculto
        </Badge>
      );
    },
  },
  {
    accessorKey: "esDestacado",
    header: "Destacado",
    cell: ({ row }) => {
      const esDestacado = row.original.comercialConfig?.esDestacado;
      return esDestacado ? (
        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
      ) : (
        <Star className="h-4 w-4 text-muted-foreground/30" />
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: () => null, // Will be overridden by renderMobileCard / custom render
    meta: { className: "text-right" },
  },
];
