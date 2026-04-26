import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    storeId: text("store_id").notNull(),
    buyerName: text("buyer_name").notNull(),
    buyerPhone: text("buyer_phone").notNull(),
    buyerEmail: text("buyer_email"),
    quantity: integer("quantity").notNull(),
    totalAmount: real("total_amount").notNull(),
    status: text("status").default("pending_payment"),
    paymentMethod: text("payment_method"),
    paymentVerifiedBy: text("payment_verified_by"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;