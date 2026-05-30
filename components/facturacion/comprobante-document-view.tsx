import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

type ComprobanteDocument = {
  id: string;
  tipoDocumento: "FACTURA" | "RECIBO" | "PROFORMA";
  montoTotal: number;
  pagoGiftCard: number;
  pagoEfectivoQr: number;
  estadoDocumento: "PROCESANDO" | "EMITIDO" | "RECHAZADA" | "BORRADOR";
  datosCliente: {
    nit_ci: string;
    razon_social: string;
    email?: string;
  };
  metadatosFiscales: {
    cuf_siat: string | null;
    numero_factura_o_recibo: string;
    url_pdf: string;
    mensaje_siat?: string;
    cambio?: number;
  };
  fechaCreacion: Date;
};

type DetalleRow = {
  id: string;
  productSku: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

interface ComprobanteDocumentViewProps {
  comprobante: ComprobanteDocument;
  detalle: DetalleRow[];
  store: {
    name: string;
    sku?: string | null;
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ComprobanteDocumentView({ comprobante, detalle, store }: ComprobanteDocumentViewProps) {
  const pdfHref = `/api/comprobantes/${comprobante.id}/pdf`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 rounded-md border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{comprobante.tipoDocumento}</h1>
            <Badge>{comprobante.estadoDocumento}</Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {comprobante.metadatosFiscales.numero_factura_o_recibo}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{formatDate(comprobante.fechaCreacion)}</p>
        </div>

        <a href={pdfHref} target="_blank" rel="noreferrer">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border bg-card p-5">
          <h2 className="font-semibold">Emisor</h2>
          <div className="mt-3 space-y-1 text-sm">
            <p>{store.name}</p>
            <p className="font-mono text-muted-foreground">SKU tienda: {store.sku || "----"}</p>
          </div>
        </div>

        <div className="rounded-md border bg-card p-5">
          <h2 className="font-semibold">Cliente</h2>
          <div className="mt-3 space-y-1 text-sm">
            <p>{comprobante.datosCliente.razon_social}</p>
            <p className="text-muted-foreground">NIT/CI: {comprobante.datosCliente.nit_ci}</p>
            {comprobante.datosCliente.email && <p className="text-muted-foreground">{comprobante.datosCliente.email}</p>}
          </div>
        </div>
      </div>

      {comprobante.metadatosFiscales.cuf_siat && (
        <div className="rounded-md border bg-card p-5">
          <h2 className="font-semibold">Metadatos fiscales</h2>
          <p className="mt-3 break-all font-mono text-xs text-muted-foreground">
            CUF: {comprobante.metadatosFiscales.cuf_siat}
          </p>
          {comprobante.metadatosFiscales.mensaje_siat && (
            <p className="mt-2 text-sm text-muted-foreground">{comprobante.metadatosFiscales.mensaje_siat}</p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalle.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.productSku}</TableCell>
                <TableCell>{item.nombreProducto}</TableCell>
                <TableCell className="text-right">{item.cantidad}</TableCell>
                <TableCell className="text-right">{formatMoney(item.precioUnitario)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto max-w-sm rounded-md border bg-card p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gift Card</span>
            <span>{formatMoney(comprobante.pagoGiftCard)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Efectivo / QR</span>
            <span>{formatMoney(comprobante.pagoEfectivoQr)}</span>
          </div>
          {(comprobante.metadatosFiscales.cambio ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cambio</span>
              <span>{formatMoney(comprobante.metadatosFiscales.cambio ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-3 text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(comprobante.montoTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
