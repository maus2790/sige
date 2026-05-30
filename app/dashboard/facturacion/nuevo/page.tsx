import Link from "next/link";
import { getSellerProductsPaginated } from "@/app/actions/products";
import { getFacturacionConfig } from "@/app/actions/facturacion";
import { Button } from "@/components/ui/button";
import { ComprobanteForm } from "@/components/facturacion/comprobante-form";
import { ArrowLeft } from "lucide-react";

export default async function NuevoComprobantePage() {
  const [{ products }, { config }] = await Promise.all([
    getSellerProductsPaginated({
      page: 1,
      limit: 100,
    }),
    getFacturacionConfig(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/facturacion">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Nuevo documento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elabora facturas, recibos o proformas usando el SKU completo de tus productos.
          </p>
        </div>
      </div>

      <ComprobanteForm products={products} facturacionConfig={config} />
    </div>
  );
}
