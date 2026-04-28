// app/dashboard/productos/nuevo/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { getCategories } from "@/app/actions/categories";

export default async function NuevoProductoPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/productos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Producto</h1>
          <p className="text-muted-foreground mt-1">
            Completa la información de tu producto
          </p>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}