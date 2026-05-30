import { NextRequest } from "next/server";
import { jsPDF } from "jspdf";
import { getSellerComprobanteById } from "@/app/actions/comprobantes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PdfRouteProps {
  params: Promise<{
    id: string;
  }>;
}

function money(value: number) {
  return `Bs. ${value.toFixed(2)}`;
}

export async function GET(_request: NextRequest, { params }: PdfRouteProps) {
  const { id } = await params;
  const data = await getSellerComprobanteById(id);

  if (!data) {
    return new Response("Documento no encontrado", { status: 404 });
  }

  const { comprobante, detalle, store } = data;
  const doc = new jsPDF();
  const numero = comprobante.metadatosFiscales.numero_factura_o_recibo;

  doc.setFontSize(18);
  doc.text(comprobante.tipoDocumento, 14, 18);
  doc.setFontSize(10);
  doc.text(`Numero: ${numero}`, 14, 26);
  doc.text(`Estado: ${comprobante.estadoDocumento}`, 14, 32);
  doc.text(`Fecha: ${new Date(comprobante.fechaCreacion).toLocaleString("es-BO")}`, 14, 38);

  doc.setFontSize(12);
  doc.text("Emisor", 14, 50);
  doc.setFontSize(10);
  doc.text(store.name, 14, 57);
  doc.text(`SKU tienda: ${store.sku || "----"}`, 14, 63);

  doc.setFontSize(12);
  doc.text("Cliente", 110, 50);
  doc.setFontSize(10);
  doc.text(comprobante.datosCliente.razon_social, 110, 57);
  doc.text(`NIT/CI: ${comprobante.datosCliente.nit_ci}`, 110, 63);

  let y = 78;
  doc.setFontSize(10);
  doc.text("SKU", 14, y);
  doc.text("Producto", 45, y);
  doc.text("Cant.", 122, y);
  doc.text("Precio", 145, y);
  doc.text("Subtotal", 172, y);
  y += 6;
  doc.line(14, y, 196, y);
  y += 7;

  for (const item of detalle) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.productSku, 14, y);
    doc.text(item.nombreProducto.slice(0, 32), 45, y);
    doc.text(String(item.cantidad), 125, y, { align: "right" });
    doc.text(money(item.precioUnitario), 160, y, { align: "right" });
    doc.text(money(item.subtotal), 196, y, { align: "right" });
    y += 7;
  }

  y += 8;
  doc.line(130, y, 196, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Total: ${money(comprobante.montoTotal)}`, 196, y, { align: "right" });
  const cambio = comprobante.metadatosFiscales.cambio ?? 0;
  if (cambio > 0) {
    y += 7;
    doc.setFontSize(10);
    doc.text(`Cambio: ${money(cambio)}`, 196, y, { align: "right" });
  }
  if ((comprobante.metadatosFiscales.cambio ?? 0) > 0) {
    y += 7;
    doc.setFontSize(10);
    doc.text(`Cambio: ${money(comprobante.metadatosFiscales.cambio ?? 0)}`, 196, y, { align: "right" });
  }

  if (comprobante.metadatosFiscales.cuf_siat) {
    y += 12;
    doc.setFontSize(8);
    doc.text(`CUF: ${comprobante.metadatosFiscales.cuf_siat}`, 14, y, { maxWidth: 180 });
  }

  const pdf = Buffer.from(doc.output("arraybuffer"));

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=\"${numero}.pdf\"`,
    },
  });
}
