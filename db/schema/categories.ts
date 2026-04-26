import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    icon: text("icon"),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;