import Link from "next/link";
import { getSellerComprobanteById } from "@/app/actions/comprobantes";
import { Button } from "@/components/ui/button";
import { ComprobanteDocumentView } from "@/components/facturacion/comprobante-document-view";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

interface ComprobantePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ComprobantePage({ params }: ComprobantePageProps) {
  const { id } = await params;
  const data = await getSellerComprobanteById(id);

  if (!data) {
    redirect("/dashboard/facturacion");
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/facturacion">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a facturacion
        </Button>
      </Link>

      <ComprobanteDocumentView
        comprobante={data.comprobante}
        detalle={data.detalle}
        store={data.store}
      />
    </div>
  );
}
