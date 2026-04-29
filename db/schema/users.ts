import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    email: text("email").unique().notNull(),
    password: text("password"),
    name: text("name").notNull(),
    role: text("role").default("seller").notNull(),
    phone: text("phone"),
    videoPlan: text("video_plan").default("free"),
    videoPlanExpiresAt: integer("video_plan_expires_at", { mode: "timestamp" }),
    resetToken: text("reset_token"),
    resetTokenExpiry: integer("reset_token_expiry", { mode: "timestamp" }),
    provider: text("provider"),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;