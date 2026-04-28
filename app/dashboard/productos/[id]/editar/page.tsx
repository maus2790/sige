// app/dashboard/productos/[id]/editar/page.tsx

import { getProductById } from "@/app/actions/products";
import { getCategories } from "@/app/actions/categories";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditProductForm } from "@/components/products/edit-product-form";

interface EditarProductoPageProps {
  params: {
    id: string;
  };
}

export default async function EditarProductoPage({ params }: EditarProductoPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  const categories = await getCategories();

  if (!product) {
    redirect("/dashboard/productos");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/productos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-muted-foreground mt-1">
            Modifica la información de {product.name}
          </p>
        </div>
      </div>

      <EditProductForm product={product} categories={categories} />
    </div>
  );
}
