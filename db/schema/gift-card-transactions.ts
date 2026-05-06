import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { giftCards } from "./gift-cards";
import { orders } from "./orders";

export const giftCardTransactions = sqliteTable("gift_card_transactions", {
  id: text("id").primaryKey(),
  giftCardId: text("gift_card_id")
    .notNull()
    .references(() => giftCards.id, { onDelete: "cascade" }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amountUsed: real("amount_used").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type NewGiftCardTransaction = typeof giftCardTransactions.$inferInsert;
