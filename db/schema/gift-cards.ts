import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { stores } from "./stores";
import { users } from "./users";

export const giftCards = sqliteTable("gift_cards", {
  id: text("id").primaryKey(),
  code: text("code").unique().notNull(), // Formato sugerido: SIGE-XXXX-XXXX
  initialAmount: real("initial_amount").notNull(),
  currentBalance: real("current_balance").notNull(),
  storeId: text("store_id").references(() => stores.id, { onDelete: "cascade" }), // Null si es global
  buyerId: text("buyer_id").references(() => users.id),
  recipientEmail: text("recipient_email"),
  status: text("status", { enum: ["active", "redeemed", "expired", "cancelled"] }).default("active"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  templateType: text("template_type", { enum: ["general", "birthday", "anniversary", "wedding", "graduation"] }).default("general"),
  dedicationMessage: text("dedication_message"),
  photoUrl: text("photo_url"),
  videoUrl: text("video_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type GiftCard = typeof giftCards.$inferSelect;
export type NewGiftCard = typeof giftCards.$inferInsert;
