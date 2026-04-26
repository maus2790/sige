import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const pushSubscriptions = sqliteTable("push_subscriptions", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    onesignalId: text("onesignal_id"),
    playerId: text("player_id").notNull(),
    deviceType: text("device_type"),
    browser: text("browser"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    lastActiveAt: integer("last_active_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;