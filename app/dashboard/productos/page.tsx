// app/dashboard/productos/page.tsx

import { getSellerProductsPaginated } from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import { ProductToastHandler } from "@/components/products/product-toast-handler";
import DashboardProductosPageClient from "@/components/products/dashboard-products-page";

interface ProductosPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
  }>;
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search || "";
  const category = params.category || "todos";

  const { products, total, pageCount } = await getSellerProductsPaginated({
    page,
    limit: 10,
    search,
    category,
  });

  const dbCategories = await getCategories();
  const categoriesList = dbCategories.map((c) => c.name);

  return (
    <div className="space-y-6">
      <ProductToastHandler />
      <DashboardProductosPageClient
        initialData={products}
        total={total}
        pageCount={pageCount}
        initialPage={page}
        initialSearch={search}
        initialCategory={category}
        categories={dbCategories}
        categoryOptions={categoriesList}
      />
    </div>
  );
}