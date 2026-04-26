import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const stores = sqliteTable("stores", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    phone: text("phone"),
    logoUrl: text("logo_url"),
    verified: integer("verified", { mode: "boolean" }).default(false),
    rating: real("rating").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;