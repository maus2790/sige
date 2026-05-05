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
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  category: z.string().min(1, "Selecciona una categoría"),
  status: z.enum(["Nuevo", "Usado", "Refabricado"]).default("Nuevo"),
  oferta: z.number().int().min(0).max(100).optional().default(0),
  stock: z.number().int().min(0).default(0),
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
      sql`(${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm})`
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

export async function createProduct(data: any) {
  console.log("createProduct action called with:", JSON.stringify(data));
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    console.error("Store not found for user:", user.id);
    return { error: "No tienes una tienda asociada. Contacta al soporte." };
  }

  // Si recibimos FormData, convertirlo a objeto (por compatibilidad)
  let rawData = data;
  if (data instanceof FormData) {
    rawData = {
      sku: data.get("sku"),
      name: data.get("name"),
      description: data.get("description"),
      price: data.get("price"),
      category: data.get("category"),
      status: data.get("status"),
      oferta: data.get("oferta"),
      stock: data.get("stock"),
      imageUrls: data.get("imageUrls"),
    };
  }

  const validatedFields = createProductSchema.safeParse({
    sku: rawData.sku as string,
    name: rawData.name,
    description: rawData.description,
    price: typeof rawData.price === 'string' ? parseFloat(rawData.price) : rawData.price,
    category: rawData.category,
    status: rawData.status || "Nuevo",
    oferta: typeof rawData.oferta === 'string' ? parseInt(rawData.oferta) : (rawData.oferta || 0),
    stock: typeof rawData.stock === 'string' ? parseInt(rawData.stock) : (rawData.stock || 0),
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    console.warn("Validation failed:", firstError.message);
    return {
      error: firstError.message,
      fields: {
        name: rawData.name as string,
        description: rawData.description as string,
        category: rawData.category as string,
      },
    };
  }

  const { sku, name, description, price, category, status, oferta, stock } = validatedFields.data;

  // Procesar imágenes
  let imageUrls: ProductImageUrls = [];
  if (rawData.imageUrls) {
    try {
      imageUrls = typeof rawData.imageUrls === 'string' 
        ? JSON.parse(rawData.imageUrls) 
        : rawData.imageUrls;
    } catch (e) {
      console.error("Error parsing imageUrls:", e);
    }
  }

  const productId = generateId();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id: productId,
        storeId: store.id,
        sku,
        name,
        description,
        category,
        status,
        imageUrls,
        views: 0,
        sales: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(inventory).values({
        id: generateId(),
        productId,
        stockActual: stock,
        stockMinimo: 5,
        ubicacion: "Sin asignar",
        updatedAt: new Date(),
      });

      await tx.insert(comercialConfig).values({
        id: generateId(),
        productId,
        precioVenta: price,
        precioAdquisicion: 0,
        ofertaPorcentaje: oferta || 0,
        isPublished: true,
        updatedAt: new Date(),
      });
    });

    console.log("Product created successfully:", productId);
    revalidatePath("/");
    revalidatePath("/dashboard/productos");
    revalidatePath("/productos");
    return { success: true, productId };
  } catch (error) {
    console.error("Error in transaction:", error);
    return { error: "Error al crear el producto en la base de datos." };
  }
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