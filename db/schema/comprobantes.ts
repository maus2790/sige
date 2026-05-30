import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { products } from "./products";
import { stores } from "./stores";

export const comprobantes = sqliteTable("comprobantes", {
    id: text("id").primaryKey(),
    storeId: text("store_id")
        .notNull()
        .references(() => stores.id, { onDelete: "cascade" }),
    tipoDocumento: text("tipo_documento", {
        enum: ["FACTURA", "RECIBO", "PROFORMA"],
    }).notNull(),
    montoTotal: real("monto_total").notNull(),
    pagoGiftCard: real("pago_gift_card").default(0).notNull(),
    pagoEfectivoQr: real("pago_efectivo_qr").default(0).notNull(),
    estadoDocumento: text("estado_documento", {
        enum: ["PROCESANDO", "EMITIDO", "RECHAZADA", "BORRADOR"],
    }).notNull(),
    datosCliente: text("datos_cliente", { mode: "json" }).$type<{
        nit_ci: string;
        razon_social: string;
        email?: string;
    }>().notNull(),
    metadatosFiscales: text("metadatos_fiscales", { mode: "json" }).$type<{
        cuf_siat: string | null;
        numero_factura_o_recibo: string;
        url_pdf: string;
        codigo_recepcion?: string;
        mensaje_siat?: string;
        cambio?: number;
    }>().notNull(),
    fechaCreacion: integer("fecha_creacion", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    fechaActualizacion: integer("fecha_actualizacion", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const detalleComprobante = sqliteTable("detalle_comprobante", {
    id: text("id").primaryKey(),
    comprobanteId: text("comprobante_id")
        .notNull()
        .references(() => comprobantes.id, { onDelete: "cascade" }),
    productId: text("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
    productSku: text("product_sku").notNull(),
    nombreProducto: text("nombre_producto").notNull(),
    cantidad: integer("cantidad").notNull(),
    precioUnitario: real("precio_unitario").notNull(),
    subtotal: real("subtotal").notNull(),
});

export const correlativosComprobante = sqliteTable(
    "correlativos_comprobante",
    {
        id: text("id").primaryKey(),
        storeId: text("store_id")
            .notNull()
            .references(() => stores.id, { onDelete: "cascade" }),
        tipoDocumento: text("tipo_documento", {
            enum: ["FACTURA", "RECIBO", "PROFORMA"],
        }).notNull(),
        siguienteNumero: integer("siguiente_numero").default(1).notNull(),
        updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
    },
    (table) => ({
        storeTipoIdx: uniqueIndex("correlativos_comprobante_store_tipo_idx").on(
            table.storeId,
            table.tipoDocumento
        ),
    })
);

export const comprobantesRelations = relations(comprobantes, ({ one, many }) => ({
    store: one(stores, {
        fields: [comprobantes.storeId],
        references: [stores.id],
    }),
    detalle: many(detalleComprobante),
}));

export const detalleComprobanteRelations = relations(detalleComprobante, ({ one }) => ({
    comprobante: one(comprobantes, {
        fields: [detalleComprobante.comprobanteId],
        references: [comprobantes.id],
    }),
    product: one(products, {
        fields: [detalleComprobante.productId],
        references: [products.id],
    }),
}));

export type Comprobante = typeof comprobantes.$inferSelect;
export type NewComprobante = typeof comprobantes.$inferInsert;
export type DetalleComprobante = typeof detalleComprobante.$inferSelect;
export type NewDetalleComprobante = typeof detalleComprobante.$inferInsert;
