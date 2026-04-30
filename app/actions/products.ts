// app/actions/products.ts

"use server";

import { db } from "@/db";
import { products, stores, inventory, comercialConfig } from "@/db/schema";
import { eq, and, desc, sql, lte } from "drizzle-orm";
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
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  status?: "Nuevo" | "Usado" | "Refabricado";
  oferta?: number;
  isPublished?: boolean;
  updatedAt: Date;
};

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const createProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.number().positive("El precio debe ser mayor a 0").optional(),
  category: z.string().min(1, "Selecciona una categoría"),
  status: z.enum(["Nuevo", "Usado", "Refabricado"]).default("Nuevo"),
  oferta: z.number().int().min(0).max(100).optional().default(0),
});

const updateProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  price: z.number().positive("El precio debe ser mayor a 0").optional(),
  category: z.string().min(1, "Selecciona una categoría").optional(),
  status: z.enum(["Nuevo", "Usado", "Refabricado"]).optional(),
  oferta: z.number().int().min(0).max(100).optional(),
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

  const results = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(eq(products.storeId, store.id))
    .orderBy(desc(products.createdAt))
    .all();

  const sellerProducts = results.map(r => ({
    ...r.product,
    inventory: r.inventory,
    comercialConfig: r.comercialConfig,
    stock: r.inventory?.stockActual ?? 0,
    price: r.comercialConfig?.precioVenta ?? 0,
    oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
  }));

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
  lowStock = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
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

  if (lowStock) {
    conditions.push(lte(inventory.stockActual, inventory.stockMinimo));
  }

  const results = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const sellerProducts = results.map(r => ({
    ...r.product,
    inventory: r.inventory,
    comercialConfig: r.comercialConfig,
    stock: r.inventory?.stockActual ?? 0,
    price: r.comercialConfig?.precioVenta ?? 0,
    oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
  }));

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
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
  const result = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(eq(products.id, id))
    .get();

  if (!result) {
    return null;
  }

  const { product, inventory: productInventory, comercialConfig: productComercial } = result;

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, product.storeId))
    .get();

  return {
    ...product,
    inventory: productInventory,
    comercialConfig: productComercial,
    stock: productInventory?.stockActual ?? 0,
    price: productComercial?.precioVenta ?? 0,
    oferta: productComercial?.ofertaPorcentaje ?? 0,
    store,
  };
}

// ============================================
// 7.8 OBTENER PRODUCTOS POR TIENDA
// ============================================

export async function getProductsByStore(storeId: string, limit: number = 10, offset: number = 0) {
  const results = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(and(eq(products.storeId, storeId), eq(comercialConfig.isPublished, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const storeProducts = results.map(r => ({
    ...r.product,
    inventory: r.inventory,
    comercialConfig: r.comercialConfig,
    stock: r.inventory?.stockActual ?? 0,
    price: r.comercialConfig?.precioVenta ?? 0,
    oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
  }));

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
  const rawStockActual = formData.get("stockActual");
  const rawStockMinimo = formData.get("stockMinimo");

  const validatedFields = createProductSchema.safeParse({
    sku: formData.get("sku") as string,
    name: formData.get("name"),
    description: formData.get("description"),
    price: rawPrice ? parseFloat(rawPrice as string) : undefined,
    category: formData.get("category"),
    status: formData.get("status") || "Nuevo",
    oferta: formData.get("oferta") ? parseInt(formData.get("oferta") as string) : undefined,
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

  const { sku, name, description, price, category, status, oferta } = validatedFields.data;

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
    sku,
    name,
    description,
    category,
    status,
    imageUrls,
    videoUrl,
    videoType,
    hasVideo,
    views: 0,
    sales: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const inventoryId = generateId();
  await db.insert(inventory).values({
    id: inventoryId,
    productId,
    stockActual: 0,
    stockMinimo: 5,
    ubicacion: "Sin asignar",
    updatedAt: new Date(),
  });

  const comercialId = generateId();
  await db.insert(comercialConfig).values({
    id: comercialId,
    productId,
    precioVenta: price || 0,
    precioAdquisicion: 0,
    ofertaPorcentaje: oferta || 0,
    isPublished: false, // Default to unpublished until configured
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
  const rawStockActual = formData.get("stockActual");
  const rawStockMinimo = formData.get("stockMinimo");

  const validatedFields = updateProductSchema.safeParse({
    sku: formData.get("sku") as string || undefined,
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    price: rawPrice ? parseFloat(rawPrice as string) : undefined,
    category: formData.get("category") || undefined,
    status: formData.get("status") as any || undefined,
    oferta: formData.get("oferta") ? parseInt(formData.get("oferta") as string) : undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const productData = validatedFields.data;

  const productUpdate: any = {
    ...productData,
    updatedAt: new Date(),
  };

  // Procesar imágenes si se enviaron
  const imageUrlsJson = formData.get("imageUrls") as string;
  if (imageUrlsJson) {
    productUpdate.imageUrls = JSON.parse(imageUrlsJson);
  }

  await db
    .update(products)
    .set(productUpdate)
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

  conditions.push(eq(comercialConfig.isPublished, true));

  if (cursor) {
    conditions.push(sql`${products.id} > ${cursor}`);
  }

  const results = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit + 1)
    .all();

  const items = results.map(r => ({
    ...r.product,
    inventory: r.inventory,
    comercialConfig: r.comercialConfig,
    price: r.comercialConfig?.precioVenta ?? 0,
    oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
  }));

  const hasMore = items.length > limit;
  const nextCursor = hasMore && items[limit - 1] ? items[limit - 1].id : null;

  return {
    items: items.slice(0, limit),
    nextCursor,
    hasMore,
  };
}