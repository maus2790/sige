import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
    id: text("id").primaryKey(),
    storeId: text("store_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: real("price").notNull(),
    stock: integer("stock").default(0),
    category: text("category"),
    imageUrls: text("image_urls", { mode: "json" }).$type<string[]>(),
    videoUrl: text("video_url"),
    videoType: text("video_type"),
    hasVideo: integer("has_video", { mode: "boolean" }).default(false),
    views: integer("views").default(0),
    sales: integer("sales").default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;