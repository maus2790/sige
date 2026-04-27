// app/actions/products.ts

"use server";

import { db } from "@/db";
import { products, stores } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "./auth";

// ============================================
// TIPOS
// ============================================

type ProductImageUrls = string[];
type ProductUpdateData = {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  status?: "Nuevo" | "Usado" | "Refabricado";
  isPublished?: boolean;
  updatedAt: Date;
};

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const createProductSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  category: z.string().min(1, "Selecciona una categoría"),
  status: z.enum(["Nuevo", "Usado", "Refabricado"]).default("Nuevo"),
  isPublished: z.boolean().default(true),
});

const updateProductSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  price: z.number().positive("El precio debe ser mayor a 0").optional(),
  stock: z.number().int().min(0, "El stock no puede ser negativo").optional(),
  category: z.string().min(1, "Selecciona una categoría").optional(),
  status: z.enum(["Nuevo", "Usado", "Refabricado"]).optional(),
  isPublished: z.boolean().optional(),
});

// ============================================
// FUNCIÓN PARA GENERAR ID ÚNICO
// ============================================

function generateId(): string {
  return randomUUID();
}

// ============================================
// 7.9 OBTENER PRODUCTOS DEL VENDEDOR ACTUAL
// ============================================

export async function getSellerProducts() {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return { products: [], total: 0 };
  }

  const sellerProducts = await db
    .select()
    .from(products)
    .where(eq(products.storeId, store.id))
    .orderBy(desc(products.createdAt))
    .all();

  return {
    products: sellerProducts,
    total: sellerProducts.length,
  };
}

export async function getSellerProductsPaginated({
  page = 1,
  limit = 10,
  search = "",
  category = "todos",
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return { products: [], total: 0, pageCount: 0 };
  }

  const offset = (page - 1) * limit;
  const conditions = [eq(products.storeId, store.id)];

  if (category && category !== "todos") {
    conditions.push(eq(products.category, category));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm}`
    );
  }

  const sellerProducts = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions))
    .get();

  const total = totalResult?.count ?? 0;
  const pageCount = Math.ceil(total / limit);

  return {
    products: sellerProducts,
    total,
    pageCount,
  };
}

// ============================================
// 7.3 OBTENER PRODUCTO POR ID
// ============================================

export async function getProductById(id: string) {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .get();

  if (!product) {
    return null;
  }

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, product.storeId))
    .get();

  return {
    ...product,
    store,
  };
}

// ============================================
// 7.8 OBTENER PRODUCTOS POR TIENDA
// ============================================

export async function getProductsByStore(storeId: string, limit: number = 10, offset: number = 0) {
  const storeProducts = await db
    .select()
    .from(products)
    .where(eq(products.storeId, storeId))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.storeId, storeId))
    .get();

  const total = totalResult?.count ?? 0;

  return {
    products: storeProducts,
    total,
    hasMore: offset + limit < total,
  };
}

// ============================================
// 7.4 CREAR PRODUCTO
// ============================================

export async function createProduct(formData: FormData) {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    throw new Error("No tienes una tienda asociada. Contacta al soporte.");
  }

  const rawPrice = formData.get("price");
  const rawStock = formData.get("stock");

  const validatedFields = createProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: rawPrice ? parseFloat(rawPrice as string) : 0,
    stock: rawStock ? parseInt(rawStock as string) : 0,
    category: formData.get("category"),
    status: formData.get("status") || "Nuevo",
    isPublished: formData.get("isPublished") === "true",
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
      fields: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
      },
    };
  }

  const { name, description, price, stock, category, status, isPublished } = validatedFields.data;

  // Procesar imágenes desde formData
  const imageUrlsJson = formData.get("imageUrls") as string;
  const imageUrls: ProductImageUrls = imageUrlsJson ? JSON.parse(imageUrlsJson) : [];

  const videoUrl: string | null = null;
  const videoType: string | null = null;
  const hasVideo: boolean = false;

  const productId = generateId();

  await db.insert(products).values({
    id: productId,
    storeId: store.id,
    name,
    description,
    price,
    stock,
    category,
    status,
    isPublished,
    imageUrls,
    videoUrl,
    videoType,
    hasVideo,
    views: 0,
    sales: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/dashboard/productos");
  revalidatePath("/productos");
  redirect("/dashboard/productos?created=true");
}

// ============================================
// 7.5 ACTUALIZAR PRODUCTO
// ============================================

export async function updateProduct(productId: string, formData: FormData) {
  const user = await requireRole("seller");

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new Error("Producto no encontrado");
  }

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store || existingProduct.storeId !== store.id) {
    throw new Error("No tienes permiso para editar este producto");
  }

  const rawPrice = formData.get("price");
  const rawStock = formData.get("stock");

  const validatedFields = updateProductSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    price: rawPrice ? parseFloat(rawPrice as string) : undefined,
    stock: rawStock ? parseInt(rawStock as string) : undefined,
    category: formData.get("category") || undefined,
    status: formData.get("status") as any || undefined,
    isPublished: formData.get("isPublished") !== null ? formData.get("isPublished") === "true" : undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const updateData: any = {
    ...validatedFields.data,
    updatedAt: new Date(),
  };

  // Procesar imágenes si se enviaron
  const imageUrlsJson = formData.get("imageUrls") as string;
  if (imageUrlsJson) {
    updateData.imageUrls = JSON.parse(imageUrlsJson);
  }

  await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, productId));

  revalidatePath(`/dashboard/productos/${productId}/editar`);
  revalidatePath("/dashboard/productos");
  revalidatePath(`/productos/${productId}`);
  redirect("/dashboard/productos?updated=true");
}

// ============================================
// 7.6 ELIMINAR PRODUCTO
// ============================================

export async function deleteProduct(productId: string) {
  const user = await requireRole("seller");

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new Error("Producto no encontrado");
  }

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store || existingProduct.storeId !== store.id) {
    throw new Error("No tienes permiso para eliminar este producto");
  }

  await db.delete(products).where(eq(products.id, productId));

  // TODO: Eliminar imágenes de R2 (Fase 8)

  revalidatePath("/dashboard/productos");
  redirect("/dashboard/productos?deleted=true");
}

// ============================================
// 7.7 ACTUALIZAR STOCK (MÚLTIPLE)
// ============================================

export async function updateStock(updates: { id: string; stock: number }[]) {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    throw new Error("No tienes una tienda asociada");
  }

  for (const update of updates) {
    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.id, update.id), eq(products.storeId, store.id)))
      .get();

    if (product) {
      await db
        .update(products)
        .set({ stock: update.stock, updatedAt: new Date() })
        .where(eq(products.id, update.id));
    }
  }

  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  return { success: true };
}

// ============================================
// 7.2 GET PRODUCTS CURSOR (SCROLL INFINITO)
// ============================================

export async function getProductsCursor(
  cursor?: string,
  limit: number = 12,
  category?: string,
  search?: string
) {
  const conditions = [];

  if (category && category !== "todos") {
    conditions.push(eq(products.category, category));
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm}`
    );
  }

  if (cursor) {
    conditions.push(sql`${products.id} > ${cursor}`);
  }

  const items = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit + 1)
    .all();

  const hasMore = items.length > limit;
  const nextCursor = hasMore && items[limit - 1] ? items[limit - 1].id : null;

  return {
    items: items.slice(0, limit),
    nextCursor,
    hasMore,
  };
}