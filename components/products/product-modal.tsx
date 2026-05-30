"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ProductForm } from "./product-form";
import { EditProductForm } from "./edit-product-form";

interface Category {
  id: string;
  name: string;
  slug: string;
}

type ProductData = Record<string, unknown> & {
  id: string;
  name?: string;
  imageUrls?: string[];
  category?: string;
  status?: string;
  description?: string;
  sku?: string;
};

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  product?: ProductData;
}

export function ProductModal({
  open,
  onOpenChange,
  categories,
  product,
}: ProductModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isEdit = !!product;

  const title = isEdit ? "Editar Producto" : "Nuevo Producto";
  const description = isEdit
    ? `Actualiza los datos de ${product?.name || "tu producto"}`
    : "Completa la información para publicar un producto nuevo.";

  const modalContent = isEdit ? (
    <EditProductForm
      product={product}
      categories={categories}
      onSuccess={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
    />
  ) : (
    <ProductForm
      categories={categories}
      onSuccess={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
    />
  );

  // Siempre mostrar dialog (desktop) para debug
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-h-[90vh] overflow-y-auto rounded-3xl p-0"
        style={{ width: "min(90vw, 1100px)" }}
      >
        <div className="border-b border-border/70 p-5">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-4 pt-3">{modalContent}</div>
      </DialogContent>
    </Dialog>
  );
}
