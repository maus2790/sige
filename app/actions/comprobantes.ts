"use server";

import { db } from "@/db";
import {
  comprobantes,
  correlativosComprobante,
  detalleComprobante,
  inventory,
  comercialConfig,
  products,
  stores,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "./auth";
import { getFacturacionConfigForStore } from "./facturacion";

type TipoDocumento = "FACTURA" | "RECIBO" | "PROFORMA";
type EstadoDocumento = "PROCESANDO" | "EMITIDO" | "RECHAZADA" | "BORRADOR";

type SiatSuccess = {
  ok: true;
  cuf: string;
  numeroFactura: string;
  urlPdf: string;
  codigoRecepcion: string;
  mensaje: string;
};

type SiatError = {
  ok: false;
  codigo: string;
  mensaje: string;
};

type SiatResponse = SiatSuccess | SiatError;

const documentoSchema = z.object({
  tipoDocumento: z.enum(["FACTURA", "RECIBO", "PROFORMA"]),
  cliente: z.object({
    nitCi: z.string().min(1, "NIT/CI del cliente requerido"),
    razonSocial: z.string().min(2, "Razon social requerida"),
    email: z.string().email("Email invalido").optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Producto requerido"),
      cantidad: z.number().int().min(1, "Cantidad minima 1"),
      precioSolicitado: z.number().nonnegative().optional(),
    })
  ).min(1, "Debes incluir al menos un item"),
  pagoGiftCard: z.number().nonnegative().default(0),
  pagoEfectivoQr: z.number().nonnegative().default(0),
  clienteRechazaFactura: z.boolean().default(false),
  emitirProforma: z.boolean().default(false),
  simulacionSiat: z.enum(["EXITOSA", "RECHAZADA", "SIN_CONEXION"]).default("EXITOSA"),
});

export type EmitirComprobanteInput = z.input<typeof documentoSchema>;

async function getCurrentSellerStore() {
  const user = await requireRole(["seller", "assistant", "superadmin"]);

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return null;
  }

  return store;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sameMoney(left: number, right: number) {
  return Math.round(left * 100) === Math.round(right * 100);
}

function getPrecioUnitario(
  tipoDocumento: TipoDocumento,
  item: { precioSolicitado?: number },
  config: typeof comercialConfig.$inferSelect | null,
  facturacionConfig: { precioReciboFactor: number; precioFacturadoFactor: number; proformaFormalPorDefecto: boolean }
) {
  const precioVenta = config?.precioOferta ?? config?.precioVenta ?? 0;
  const precioFacturado = roundMoney((config?.precioVenta ?? precioVenta) * facturacionConfig.precioFacturadoFactor);

  if (tipoDocumento === "FACTURA") {
    return precioFacturado;
  }

  if (tipoDocumento === "RECIBO") {
    return roundMoney(precioVenta * facturacionConfig.precioReciboFactor);
  }

  return item.precioSolicitado ?? (facturacionConfig.proformaFormalPorDefecto ? precioFacturado : precioVenta);
}

function buildNumero(tipoDocumento: TipoDocumento, storeId: string, secuencia: number) {
  const prefijo = tipoDocumento === "FACTURA" ? "FAC" : tipoDocumento === "RECIBO" ? "REC" : "PRO";
  return `${prefijo}-${storeId.slice(0, 6).toUpperCase()}-${String(secuencia).padStart(8, "0")}`;
}

async function siguienteCorrelativo(tx: any, storeId: string, tipoDocumento: TipoDocumento) {
  const existente = await tx
    .select()
    .from(correlativosComprobante)
    .where(
      and(
        eq(correlativosComprobante.storeId, storeId),
        eq(correlativosComprobante.tipoDocumento, tipoDocumento)
      )
    )
    .get();

  if (!existente) {
    await tx.insert(correlativosComprobante).values({
      id: randomUUID(),
      storeId,
      tipoDocumento,
      siguienteNumero: 2,
      updatedAt: new Date(),
    });
    return 1;
  }

  await tx
    .update(correlativosComprobante)
    .set({
      siguienteNumero: existente.siguienteNumero + 1,
      updatedAt: new Date(),
    })
    .where(eq(correlativosComprobante.id, existente.id));

  return existente.siguienteNumero;
}

function buildSigePdfUrl(tipoDocumento: TipoDocumento, comprobanteId: string) {
  return `/api/comprobantes/${comprobanteId}/pdf?tipo=${tipoDocumento.toLowerCase()}`;
}

async function simularFetchFacturacionBolivia(
  payload: Record<string, unknown>,
  modo: "EXITOSA" | "RECHAZADA" | "SIN_CONEXION"
): Promise<SiatResponse> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (modo === "SIN_CONEXION") {
    return {
      ok: false,
      codigo: "SIAT_TIMEOUT",
      mensaje: "No se pudo conectar con el servicio externo de facturacion.",
    };
  }

  const cliente = payload.cliente as { nit_ci?: string };
  if (modo === "RECHAZADA" || cliente?.nit_ci === "0") {
    return {
      ok: false,
      codigo: "SIAT_RECHAZADA",
      mensaje: "El SIAT rechazo la factura simulada. Verifica NIT/CI, actividad economica y detalle.",
    };
  }

  const comprobanteId = String(payload.comprobante_id);
  const numeroFactura = String(payload.numero_factura);

  return {
    ok: true,
    cuf: `CUF-SIM-${comprobanteId.replaceAll("-", "").slice(0, 24).toUpperCase()}`,
    numeroFactura,
    urlPdf: `https://facturacion.sige-mercado.local/facturas/${comprobanteId}.pdf`,
    codigoRecepcion: `RC-${Date.now()}`,
    mensaje: "Factura electronica validada por simulacion SIAT.",
  };
}

async function enviarFacturaElectronica(payload: Record<string, unknown>, token: string, simulacion: "EXITOSA" | "RECHAZADA" | "SIN_CONEXION") {
  const endpoint = process.env.SIAT_BILLING_API_URL;

  if (!endpoint) {
    return simularFetchFacturacionBolivia(payload, simulacion);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body.estado === "RECHAZADA") {
      return {
        ok: false,
        codigo: body.codigo ?? `HTTP_${response.status}`,
        mensaje: body.mensaje ?? "La API externa rechazo la factura.",
      } satisfies SiatError;
    }

    return {
      ok: true,
      cuf: body.cuf ?? body.cuf_siat,
      numeroFactura: body.numeroFactura ?? body.numero_factura,
      urlPdf: body.urlPdf ?? body.url_pdf,
      codigoRecepcion: body.codigoRecepcion ?? body.codigo_recepcion,
      mensaje: body.mensaje ?? "Factura emitida correctamente.",
    } satisfies SiatSuccess;
  } catch {
    return {
      ok: false,
      codigo: "API_FACTURACION_ERROR",
      mensaje: "No se pudo completar el envio a la API externa de facturacion.",
    } satisfies SiatError;
  }
}

export async function emitirComprobante(input: EmitirComprobanteInput) {
  const parsed = documentoSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const itemsPorProducto = new Map<string, { productId: string; cantidad: number; precioSolicitado?: number }>();

  for (const item of data.items) {
    const existente = itemsPorProducto.get(item.productId);

    if (!existente) {
      itemsPorProducto.set(item.productId, { ...item });
      continue;
    }

    if (
      data.tipoDocumento === "PROFORMA" &&
      item.precioSolicitado !== undefined &&
      existente.precioSolicitado !== undefined &&
      !sameMoney(item.precioSolicitado, existente.precioSolicitado)
    ) {
      return { error: "No puedes repetir el mismo producto con precios solicitados distintos en una proforma." };
    }

    existente.cantidad += item.cantidad;
    existente.precioSolicitado = existente.precioSolicitado ?? item.precioSolicitado;
  }

  const itemsConsolidados = Array.from(itemsPorProducto.values());
  const store = await getCurrentSellerStore();

  if (!store) {
    return { error: "No tienes una tienda asociada." };
  }

  const facturacionConfig = await getFacturacionConfigForStore(store.id);

  if (data.tipoDocumento === "FACTURA") {
    if (facturacionConfig.regimenTributario !== "REGIMEN_GENERAL") {
      return { error: "Solo las tiendas del Regimen General pueden emitir facturas electronicas." };
    }

    if (!facturacionConfig.suscripcionActiva) {
      return { error: "La tienda no tiene una suscripcion activa para facturacion electronica." };
    }

    if (!facturacionConfig.nitEmpresa || !facturacionConfig.tokenApiFacturacion) {
      return { error: "Configura el NIT y el token de facturacion antes de emitir facturas." };
    }
  }

  if (data.tipoDocumento === "RECIBO" && facturacionConfig.regimenTributario === "REGIMEN_GENERAL" && !data.clienteRechazaFactura) {
    return {
      error: "Para emitir recibo desde Regimen General debes registrar que el cliente rechazo factura.",
    };
  }

  const productIds = itemsConsolidados.map((item) => item.productId);
  const rows = await db
    .select({
      product: products,
      inv: inventory,
      config: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(and(eq(products.storeId, store.id), inArray(products.id, productIds)))
    .all();

  if (rows.length !== new Set(productIds).size) {
    return { error: "Uno o mas productos no existen o no pertenecen a tu tienda." };
  }

  const rowsByProduct = new Map(rows.map((row) => [row.product.id, row]));
  const detalle = itemsConsolidados.map((item) => {
    const row = rowsByProduct.get(item.productId);
    if (!row) {
      throw new Error("Producto no encontrado");
    }

    const precioUnitario = roundMoney(getPrecioUnitario(data.tipoDocumento, item, row.config, facturacionConfig));
    return {
      productId: item.productId,
      productSku: row.product.sku || "",
      nombreProducto: row.product.name,
      cantidad: item.cantidad,
      precioUnitario,
      subtotal: roundMoney(precioUnitario * item.cantidad),
      stockActual: row.inv?.stockActual ?? 0,
    };
  });

  if (data.tipoDocumento !== "PROFORMA") {
    const sinStock = detalle.find((item) => item.stockActual < item.cantidad);
    if (sinStock) {
      return { error: `Stock insuficiente para ${sinStock.nombreProducto}. Disponible: ${sinStock.stockActual}.` };
    }
  }

  const montoTotal = roundMoney(detalle.reduce((total, item) => total + item.subtotal, 0));
  const pagoGiftCard = roundMoney(data.pagoGiftCard);
  const pagoEfectivoQr = roundMoney(data.pagoEfectivoQr);

  const totalPagado = roundMoney(pagoGiftCard + pagoEfectivoQr);
  const cambio = data.tipoDocumento === "PROFORMA" ? 0 : Math.max(0, roundMoney(totalPagado - montoTotal));

  if (data.tipoDocumento !== "PROFORMA" && totalPagado + 0.0001 < montoTotal) {
    return {
      error: `Pago insuficiente. Falta Bs. ${roundMoney(montoTotal - totalPagado).toFixed(2)}.`,
    };
  }

  if (data.tipoDocumento === "PROFORMA" && pagoGiftCard + pagoEfectivoQr > 0) {
    return { error: "Las proformas no deben registrar pagos ni transacciones financieras." };
  }

  const comprobanteId = randomUUID();
  const estadoInicial: EstadoDocumento =
    data.tipoDocumento === "FACTURA" ? "PROCESANDO" : data.tipoDocumento === "PROFORMA" && !data.emitirProforma ? "BORRADOR" : "EMITIDO";

  const resultadoTx = await db.transaction(async (tx) => {
    const secuencia = await siguienteCorrelativo(tx, store.id, data.tipoDocumento);
    const numeroDocumento = buildNumero(data.tipoDocumento, store.id, secuencia);
    const urlPdf = data.tipoDocumento === "FACTURA" ? "" : buildSigePdfUrl(data.tipoDocumento, comprobanteId);

    await tx.insert(comprobantes).values({
      id: comprobanteId,
      storeId: store.id,
      tipoDocumento: data.tipoDocumento,
      montoTotal,
      pagoGiftCard,
      pagoEfectivoQr,
      estadoDocumento: estadoInicial,
      datosCliente: {
        nit_ci: data.cliente.nitCi,
        razon_social: data.cliente.razonSocial,
        email: data.cliente.email,
      },
      metadatosFiscales: {
        cuf_siat: null,
        numero_factura_o_recibo: numeroDocumento,
        url_pdf: urlPdf,
        cambio,
      },
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });

    await tx.insert(detalleComprobante).values(
      detalle.map((item) => ({
        id: randomUUID(),
        comprobanteId,
        productId: item.productId,
        productSku: item.productSku,
        nombreProducto: item.nombreProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
      }))
    );

    if (data.tipoDocumento !== "PROFORMA") {
      for (const item of detalle) {
        await tx
          .update(inventory)
          .set({
            stockActual: sql`${inventory.stockActual} - ${item.cantidad}`,
            updatedAt: new Date(),
          })
          .where(eq(inventory.productId, item.productId));
      }
    }

    return { numeroDocumento };
  });

  if (data.tipoDocumento === "FACTURA") {
    const payloadSiat = {
      comprobante_id: comprobanteId,
      numero_factura: resultadoTx.numeroDocumento,
      tienda: {
        id: store.id,
        nombre_comercial: store.name,
        nit_empresa: facturacionConfig.nitEmpresa,
      },
      cliente: {
        nit_ci: data.cliente.nitCi,
        razon_social: data.cliente.razonSocial,
        email: data.cliente.email,
      },
      items: detalle.map(({ productId, productSku, nombreProducto, cantidad, precioUnitario, subtotal }) => ({
        producto_id: productId,
        codigo_producto: productSku,
        descripcion: nombreProducto,
        cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      })),
      pagos: {
        gift_card: pagoGiftCard,
        efectivo_qr: pagoEfectivoQr,
        total: montoTotal,
        cambio,
      },
      monto_total: montoTotal,
      moneda: "BOB",
      fecha_emision: new Date().toISOString(),
    };

    const siat = await enviarFacturaElectronica(payloadSiat, facturacionConfig.tokenApiFacturacion, facturacionConfig.simulacionSiat);

    if (!siat.ok) {
      await db
        .update(comprobantes)
        .set({
          estadoDocumento: "RECHAZADA",
          metadatosFiscales: {
            cuf_siat: null,
            numero_factura_o_recibo: resultadoTx.numeroDocumento,
            url_pdf: "",
            cambio,
            mensaje_siat: `${siat.codigo}: ${siat.mensaje}`,
          },
          fechaActualizacion: new Date(),
        })
        .where(eq(comprobantes.id, comprobanteId));

      revalidatePath("/dashboard/facturacion");
      revalidatePath("/dashboard/inventario");

      return {
        error: siat.mensaje,
        id: comprobanteId,
        estadoDocumento: "RECHAZADA" as const,
        codigoSiat: siat.codigo,
      };
    }

    await db
      .update(comprobantes)
      .set({
        estadoDocumento: "EMITIDO",
        metadatosFiscales: {
          cuf_siat: siat.cuf,
          numero_factura_o_recibo: siat.numeroFactura,
          url_pdf: buildSigePdfUrl("FACTURA", comprobanteId),
          codigo_recepcion: siat.codigoRecepcion,
          mensaje_siat: `${siat.mensaje} PDF externo simulado: ${siat.urlPdf}`,
          cambio,
        },
        fechaActualizacion: new Date(),
      })
      .where(eq(comprobantes.id, comprobanteId));
  }

  revalidatePath("/dashboard/facturacion");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");

  return {
    success: true,
    id: comprobanteId,
    tipoDocumento: data.tipoDocumento,
    estadoDocumento: data.tipoDocumento === "FACTURA" ? "EMITIDO" : estadoInicial,
    numeroDocumento: resultadoTx.numeroDocumento,
    montoTotal,
    cambio,
  };
}

export async function getSellerComprobantes(tipoDocumento?: TipoDocumento) {
  const store = await getCurrentSellerStore();

  if (!store) {
    return [];
  }

  const conditions = [eq(comprobantes.storeId, store.id)];
  if (tipoDocumento) {
    conditions.push(eq(comprobantes.tipoDocumento, tipoDocumento));
  }

  return db
    .select()
    .from(comprobantes)
    .where(and(...conditions))
    .orderBy(desc(comprobantes.fechaCreacion))
    .all();
}

export async function getSellerComprobanteById(comprobanteId: string) {
  const store = await getCurrentSellerStore();

  if (!store) {
    return null;
  }

  const comprobante = await db
    .select()
    .from(comprobantes)
    .where(and(eq(comprobantes.id, comprobanteId), eq(comprobantes.storeId, store.id)))
    .get();

  if (!comprobante) {
    return null;
  }

  const detalle = await db
    .select()
    .from(detalleComprobante)
    .where(eq(detalleComprobante.comprobanteId, comprobante.id))
    .all();

  return {
    comprobante,
    detalle,
    store,
  };
}
