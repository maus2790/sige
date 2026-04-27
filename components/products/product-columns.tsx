// components/products/product-columns.tsx

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Product } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { ProductImageGallery } from "./product-image-gallery";
import { DeleteProductButton } from "./delete-product-button";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "imageUrls",
    header: "Imagen",
    cell: ({ row }) => {
      const images = row.getValue("imageUrls") as string[];
      return (
        <ProductImageGallery
          images={images || []}
          productName={row.getValue("name")}
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="font-medium max-w-[200px] truncate">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Categoría",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("category") || "Sin categoría"}
      </Badge>
    ),
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return <div className="font-medium">Bs. {price.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = parseInt(row.getValue("stock"));
      return (
        <div className="flex items-center gap-2">
          {stock}
          <Badge variant={stock > 0 ? "default" : "secondary"}>
            {stock > 0 ? "Disponible" : "Agotado"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "Nuevo" ? "default" : "outline"}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/productos/${product.id}/editar`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
          />
        </div>
      );
    },
  },
];
