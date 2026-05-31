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
import { Button } from "@/components/ui/button";

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

  // Siempre mostrar dialog (desktop) para debug
  const formId = isEdit ? `edit-product-form-${product?.id}` : "create-product-form";
  const [childLoading, setChildLoading] = React.useState(false);

  const childProps = {
    formId,
    onLoadingChange: (v: boolean) => setChildLoading(v),
  };

  const submitForm = () => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.submit();
    }
  };

  const content = isEdit ? (
    <EditProductForm
      product={product}
      categories={categories}
      onSuccess={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      {...childProps}
    />
  ) : (
    <ProductForm
      categories={categories}
      onSuccess={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      {...childProps}
    />
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            className="max-h-[90vh] rounded-[2.5rem] overflow-hidden p-0 flex flex-col"
            style={{ width: "min(90vw, 1100px)" }}
          >
        <div className="shrink-0 border-b border-white/20 p-5 bg-brand-gradient text-white shadow-premium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-50">
          <DialogHeader>
            <DialogTitle className="text-white">{title}</DialogTitle>
            <DialogDescription className="text-white/80">{description}</DialogDescription>
          </DialogHeader>
        </div>
          <div className="flex-1 overflow-y-auto p-4">{content}</div>

          <div className="shrink-0 border-t border-white/20 p-4 bg-brand-gradient text-white shadow-premium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-50">
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={childLoading}>
                Cancelar
              </Button>
              <Button onClick={submitForm} disabled={childLoading}>
                {childLoading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="rounded-t-[2.5rem] overflow-hidden p-0 max-h-[90vh] flex flex-col">
            <div className="shrink-0 border-b border-white/20 p-4 bg-brand-gradient text-white shadow-premium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-50">
              <SheetHeader>
                <SheetTitle className="text-white">{title}</SheetTitle>
                <SheetDescription className="text-white/80">{description}</SheetDescription>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-4">{content}</div>

            <div className="shrink-0 border-t border-white/20 p-4 bg-brand-gradient text-white shadow-premium dark:bg-slate-950 dark:border-slate-800 dark:text-slate-50">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={childLoading}>
                  Cancelar
                </Button>
                <Button onClick={submitForm} disabled={childLoading}>
                  {childLoading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
