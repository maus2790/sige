// db/schema/inventory.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { products } from "./products";
import { comercialConfig } from "./comercial-config";
import { relations } from "drizzle-orm";

export const inventory = sqliteTable("inventory", {
    id: text("id").primaryKey(),
    productId: text("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    stockActual: integer("stock_actual").default(0).notNull(),
    stockMinimo: integer("stock_minimo").default(5).notNull(),
    ubicacion: text("ubicacion"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const inventoryRelations = relations(inventory, ({ one }) => ({
    product: one(products, {
        fields: [inventory.productId],
        references: [products.id],
    }),
}));

export const productsRelations = relations(products, ({ one }) => ({
    inventory: one(inventory, {
        fields: [products.id],
        references: [inventory.productId],
    }),
    comercialConfig: one(comercialConfig, {
        fields: [products.id],
        references: [comercialConfig.productId],
    }),
}));

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
