"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductModal } from "./product-modal";
import { ProductsTableClient } from "./products-table-client";

type ProductData = Record<string, unknown> & {
  id: string;
  name?: string;
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface DashboardProductosPageProps {
  initialData: ProductData[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  categories: Category[];
  categoryOptions: string[];
}

export default function DashboardProductosPageClient({
  initialData,
  total,
  pageCount,
  initialPage,
  initialSearch,
  initialCategory,
  categories,
  categoryOptions,
}: DashboardProductosPageProps) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  const onOpenNewProduct = () => {
    setSelectedProduct(null);
    setOpenModal(true);
  };

  const onEditProduct = (product: ProductData) => {
    setSelectedProduct(product);
    setOpenModal(true);
  };

  const categoryList = useMemo(() => categoryOptions, [categoryOptions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gestiona el inventario y visibilidad de tus productos
          </p>
        </div>
        <Button type="button" onClick={onOpenNewProduct} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      <ProductsTableClient
        initialData={initialData}
        total={total}
        pageCount={pageCount}
        initialPage={initialPage}
        initialSearch={initialSearch}
        initialCategory={initialCategory}
        categories={categoryList}
        onEdit={onEditProduct}
      />

      <ProductModal
        open={openModal}
        onOpenChange={setOpenModal}
        categories={categories}
        product={selectedProduct || undefined}
      />
    </div>
  );
}
