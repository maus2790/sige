// db/schema/comercial-config.ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { products } from "./products";
import { relations } from "drizzle-orm";

export const comercialConfig = sqliteTable("comercial_config", {
    id: text("id").primaryKey(),
    productId: text("product_id")
        .notNull()
        .unique()
        .references(() => products.id, { onDelete: "cascade" }),
    precioAdquisicion: real("precio_adquisicion").default(0),
    precioVenta: real("precio_venta").notNull(),
    precioOferta: real("precio_oferta"),
    ofertaPorcentaje: integer("oferta_porcentaje").default(0),
    isPublished: integer("is_published", { mode: "boolean" }).default(true),
    esDestacado: integer("es_destacado", { mode: "boolean" }).default(false),
    fechaFinOferta: integer("fecha_fin_oferta", { mode: "timestamp" }),
    limiteCompra: integer("limite_compra"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const comercialConfigRelations = relations(comercialConfig, ({ one }) => ({
    product: one(products, {
        fields: [comercialConfig.productId],
        references: [products.id],
    }),
}));

export type ComercialConfig = typeof comercialConfig.$inferSelect;
export type NewComercialConfig = typeof comercialConfig.$inferInsert;
