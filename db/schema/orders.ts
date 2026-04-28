import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  storeId: text("store_id").notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerPhone: text("buyer_phone").notNull(),
  buyerEmail: text("buyer_email"),
  buyerCi: text("buyer_ci"), // Nuevo: CI/NIT del comprador
  quantity: integer("quantity").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").default("pending_payment"),
  paymentMethod: text("payment_method"),
  paymentProofUrl: text("payment_proof_url"),
  paymentVerifiedBy: text("payment_verified_by"),
  paymentVerifiedAt: integer("payment_verified_at", { mode: "timestamp" }),
  assistantNotes: text("assistant_notes"),
  shippingAddress: text("shipping_address"),
  trackingCode: text("tracking_code"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;