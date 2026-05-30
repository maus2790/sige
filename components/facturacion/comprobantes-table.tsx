import Link from "next/link";
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
import { Download, Eye } from "lucide-react";

type ComprobanteRow = {
  id: string;
  tipoDocumento: "FACTURA" | "RECIBO" | "PROFORMA";
  montoTotal: number;
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
  };
  fechaCreacion: Date;
};

interface ComprobantesTableProps {
  rows: ComprobanteRow[];
  emptyLabel: string;
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
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function estadoVariant(estado: ComprobanteRow["estadoDocumento"]) {
  if (estado === "EMITIDO") return "default";
  if (estado === "RECHAZADA") return "destructive";
  return "secondary";
}

export function ComprobantesTable({ rows, emptyLabel }: ComprobantesTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numero</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="font-mono text-xs font-semibold">
                  {row.metadatosFiscales.numero_factura_o_recibo}
                </div>
                {row.metadatosFiscales.cuf_siat && (
                  <div className="mt-1 max-w-40 truncate font-mono text-[10px] text-muted-foreground">
                    {row.metadatosFiscales.cuf_siat}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{row.datosCliente.razon_social}</div>
                <div className="text-xs text-muted-foreground">{row.datosCliente.nit_ci}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(row.fechaCreacion)}
              </TableCell>
              <TableCell>
                <Badge variant={estadoVariant(row.estadoDocumento)}>
                  {row.estadoDocumento}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatMoney(row.montoTotal)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Link href={`/dashboard/facturacion/${row.id}`}>
                    <Button variant="outline" size="icon-sm" title="Ver documento">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <a href={`/api/comprobantes/${row.id}/pdf`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="icon-sm" title="Descargar PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
