// app/actions/products.ts

"use server";

import { db } from "@/db";
import { products, stores, inventory, comercialConfig, users } from "@/db/schema";
import { eq, and, desc, sql, lte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, getCurrentUser } from "./auth";
import { getSystemConfig } from "./config";

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
  precioOferta: z.number().min(0).optional().nullable(),
  diasPromocion: z.number().int().min(1).optional().nullable(),
  stock: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const updateProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  price: z.number().positive("El precio debe ser mayor a 0").optional(),
  category: z.string().min(1, "Selecciona una categoría").optional(),
  status: z.enum(["Nuevo", "Usado", "Refabricado"]).optional(),
  oferta: z.number().int().min(0).max(100).optional(),
  precioOferta: z.number().min(0).optional().nullable(),
  diasPromocion: z.number().int().min(1).optional().nullable(),
  isPublished: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
});

// ============================================
// FUNCIÓN PARA GENERAR ID ÚNICO
// ============================================

function generateId(): string {
  return randomUUID();
}

// Helper para sanear arreglos de imágenes desincronizados
function sanitizeProductImages(product: any) {
  const mainUrls = product.imageUrls || [];
  const getFileId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    const parts = url.split("/");
    return parts[parts.length - 1]; // uuid.jpg
  };

  const sanitizedThumb = mainUrls.map((feedUrl: string) => {
    const feedId = getFileId(feedUrl);
    const match = (product.imageUrlsThumb || []).find((t: string) => getFileId(t) === feedId);
    return match || feedUrl;
  });

  const sanitizedOg = mainUrls.map((feedUrl: string) => {
    const feedId = getFileId(feedUrl);
    const match = (product.imageUrlsOg || []).find((og: string) => getFileId(og) === feedId);
    return match || feedUrl;
  });

  return {
    ...product,
    imageUrlsThumb: sanitizedThumb,
    imageUrlsOg: sanitizedOg,
  };
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

  const sellerProducts = results.map(r => {
    const sanitized = sanitizeProductImages(r.product);
    return {
      ...sanitized,
      inventory: r.inventory,
      comercialConfig: r.comercialConfig,
      stock: r.inventory?.stockActual ?? 0,
      price: r.comercialConfig?.precioVenta ?? 0,
      oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
    };
  });

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

  const sellerProducts = results.map(r => {
    const sanitized = sanitizeProductImages(r.product);
    return {
      ...sanitized,
      inventory: r.inventory,
      comercialConfig: r.comercialConfig,
      stock: r.inventory?.stockActual ?? 0,
      price: r.comercialConfig?.precioVenta ?? 0,
      oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
    };
  });

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

export async function getProductByIdDirect(id: string) {
  const result = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
      store: stores,
      seller: {
        name: users.name,
        email: users.email,
        phone: users.phone,
      }
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .leftJoin(stores, eq(products.storeId, stores.id))
    .leftJoin(users, eq(stores.userId, users.id))
    .where(eq(products.id, id))
    .get();

  if (!result) {
    return null;
  }

  const { 
    product, 
    inventory: productInventory, 
    comercialConfig: productComercial, 
    store, 
    seller 
  } = result;

  const sanitizedProduct = sanitizeProductImages(product);

  return {
    ...sanitizedProduct,
    inventory: productInventory,
    comercialConfig: productComercial,
    stock: productInventory?.stockActual ?? 0,
    price: productComercial?.precioVenta ?? 0,
    oferta: productComercial?.ofertaPorcentaje ?? 0,
    store,
    seller,
  };
}

export async function getProductById(id: string) {
  const config = await getSystemConfig();
  
  // Always use unstable_cache so revalidateTag("all-products") / revalidateTag(`product-${id}`)
  // can purge this entry on demand regardless of whether Nivel 1 is active.
  const ttl = config.cacheScrollEnabled ? config.marketCacheTtl : 30;
  const label = config.cacheScrollEnabled ? "ON ⚡ Nivel 1" : "OFF 📁 Micro-30s";
  
  console.log(`[Product Cache: ${label}] TTL=${ttl}s | ID: ${id}`);

  const getCached = unstable_cache(
    async (pId: string) => {
      console.log(`[Product Cache MISS ❌] Querying Turso DB for product ${pId}`);
      return getProductByIdDirect(pId);
    },
    [`product-details-${id}`],
    { revalidate: ttl, tags: [`product-${id}`, "all-products"] }
  );

  return getCached(id);
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

  const storeProducts = results.map(r => {
    const sanitized = sanitizeProductImages(r.product);
    return {
      ...sanitized,
      inventory: r.inventory,
      comercialConfig: r.comercialConfig,
      stock: r.inventory?.stockActual ?? 0,
      price: r.comercialConfig?.precioVenta ?? 0,
      oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
    };
  });

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
  const user = await getCurrentUser();
  if (!user || (user.role !== "seller" && user.role !== "superadmin")) {
    return { error: "No autorizado. Debes iniciar sesión como vendedor." };
  }

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
      sku: data.get("sku") || undefined,
      name: data.get("name"),
      description: data.get("description"),
      price: data.get("price"),
      category: data.get("category"),
      status: data.get("status") || undefined,
      oferta: data.get("oferta"),
      stock: data.get("stock"),
      precioOferta: data.get("precioOferta"),
      diasPromocion: data.get("diasPromocion"),
      imageUrls: data.get("imageUrls"),
      imageUrlsThumb: data.get("imageUrlsThumb"),
      imageUrlsOg: data.get("imageUrlsOg"),
      isPublished: data.get("isPublished") === "true",
    };
  }

  const validatedFields = createProductSchema.safeParse({
    sku: (rawData.sku as string) || undefined,
    name: rawData.name,
    description: rawData.description,
    price: typeof rawData.price === 'string' ? parseFloat(rawData.price) : rawData.price,
    category: rawData.category,
    status: (rawData.status as any) || "Nuevo",
    oferta: typeof rawData.oferta === 'string' ? parseInt(rawData.oferta) : (rawData.oferta || 0),
    precioOferta: typeof rawData.precioOferta === 'string' && rawData.precioOferta !== "" ? parseFloat(rawData.precioOferta) : (rawData.precioOferta || null),
    diasPromocion: typeof rawData.diasPromocion === 'string' && rawData.diasPromocion !== "" ? parseInt(rawData.diasPromocion) : (rawData.diasPromocion || null),
    stock: typeof rawData.stock === 'string' ? parseInt(rawData.stock) : (rawData.stock || 0),
    isPublished: rawData.isPublished !== undefined ? rawData.isPublished : true,
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

  const { sku, name, description, price, category, status, oferta, precioOferta, diasPromocion, stock, isPublished } = validatedFields.data;

  // Procesar imágenes
  let imageUrls: string[] = [];
  if (rawData.imageUrls) {
    try {
      imageUrls = typeof rawData.imageUrls === 'string'
        ? JSON.parse(rawData.imageUrls)
        : rawData.imageUrls;
    } catch (e) {
      console.error("Error parsing imageUrls:", e);
    }
  }

  let imageUrlsThumb: string[] = [];
  if (rawData.imageUrlsThumb) {
    try {
      imageUrlsThumb = typeof rawData.imageUrlsThumb === 'string'
        ? JSON.parse(rawData.imageUrlsThumb)
        : rawData.imageUrlsThumb;
    } catch (e) {
      console.error("Error parsing imageUrlsThumb:", e);
    }
  }

  let imageUrlsOg: string[] = [];
  if (rawData.imageUrlsOg) {
    try {
      imageUrlsOg = typeof rawData.imageUrlsOg === 'string'
        ? JSON.parse(rawData.imageUrlsOg)
        : rawData.imageUrlsOg;
    } catch (e) {
      console.error("Error parsing imageUrlsOg:", e);
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
        imageUrlsThumb: imageUrlsThumb.length > 0 ? imageUrlsThumb : null,
        imageUrlsOg: imageUrlsOg.length > 0 ? imageUrlsOg : null,
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

      let fechaFinOferta: Date | null = null;
      if (precioOferta && precioOferta > 0 && diasPromocion && diasPromocion > 0) {
        fechaFinOferta = new Date();
        fechaFinOferta.setDate(fechaFinOferta.getDate() + diasPromocion);
      }

      await tx.insert(comercialConfig).values({
        id: generateId(),
        productId,
        precioVenta: price,
        precioAdquisicion: 0,
        precioOferta: precioOferta && precioOferta > 0 ? precioOferta : null,
        ofertaPorcentaje: oferta || 0,
        fechaFinOferta,
        isPublished: isPublished,
        updatedAt: new Date(),
      });
    });

    console.log("Product created successfully:", productId);
    revalidatePath("/");
    revalidatePath("/dashboard/productos");
    revalidatePath("/productos");
    revalidatePath(`/tienda/${store.id}`);
    return { success: true, productId };
  } catch (error) {
    console.error("Error in transaction:", error);
    return { error: "Error al crear el producto en la base de datos." };
  }
}

// ============================================
// 7.5 ACTUALIZAR PRODUCTO
// ============================================

export async function publishProductToMarket(productId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "seller" && user.role !== "superadmin")) {
    throw new Error("No autorizado");
  }

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new Error("Producto no encontrado");
  }

  // Si no es superadmin, verificar que es el dueño de la tienda
  if (user.role !== "superadmin") {
    const store = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, existingProduct.storeId), eq(stores.userId, user.id)))
      .get();

    if (!store) {
      throw new Error("No tienes permiso para publicar este producto");
    }
  }

  await db
    .update(comercialConfig)
    .set({ isPublished: true, updatedAt: new Date() })
    .where(eq(comercialConfig.productId, productId));

  revalidatePath("/");
  revalidatePath("/dashboard/productos");
  revalidatePath(`/tienda/${existingProduct.storeId}`);
  revalidatePath(`/productos/${productId}`);
  // @ts-ignore
  revalidateTag(`product-${productId}`);
  
  return { success: true };
}

// ============================================
// 7.6 DESPUBLICAR PRODUCTO (Pasar a Borrador)
// ============================================

export async function unpublishProduct(productId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "seller" && user.role !== "superadmin")) {
    throw new Error("No autorizado");
  }

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) throw new Error("Producto no encontrado");

  // Si no es superadmin, verificar que es el dueño de la tienda
  if (user.role !== "superadmin") {
    const store = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, existingProduct.storeId), eq(stores.userId, user.id)))
      .get();

    if (!store) {
      throw new Error("No tienes permiso para modificar este producto");
    }
  }

  await db
    .update(comercialConfig)
    .set({ isPublished: false, updatedAt: new Date() })
    .where(eq(comercialConfig.productId, productId));

  revalidatePath("/");
  revalidatePath("/dashboard/productos");
  revalidatePath(`/tienda/${existingProduct.storeId}`);
  revalidatePath(`/productos/${productId}`);
  // @ts-ignore
  revalidateTag(`product-${productId}`);

  return { success: true };
}

// ============================================
// 7.7 ELIMINAR PRODUCTO
// ============================================

export async function deleteProduct(productId: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "seller" && user.role !== "superadmin")) {
    throw new Error("No autorizado");
  }

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) throw new Error("Producto no encontrado");

  // Si no es superadmin, verificar que es el dueño de la tienda
  if (user.role !== "superadmin") {
    const store = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, existingProduct.storeId), eq(stores.userId, user.id)))
      .get();

    if (!store) {
      throw new Error("No tienes permiso para eliminar este producto");
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(comercialConfig).where(eq(comercialConfig.productId, productId));
    await tx.delete(inventory).where(eq(inventory.productId, productId));
    await tx.delete(products).where(eq(products.id, productId));
  });

  // Limpiar imágenes de R2 después de borrar de la DB
  if (existingProduct.imageUrls && existingProduct.imageUrls.length > 0) {
    await deleteProductImagesFromR2(existingProduct.imageUrls);
  }

  revalidatePath("/");
  revalidatePath("/dashboard/productos");
  revalidatePath(`/tienda/${existingProduct.storeId}`);
  revalidatePath(`/productos/${productId}`);
  // @ts-ignore
  revalidateTag(`product-${productId}`);

  return { success: true };
}

// ============================================
// 7.8 ACTUALIZAR PRODUCTO
// ============================================

export async function updateProduct(productId: string, data: any) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "seller" && user.role !== "superadmin")) {
    return { error: "No autorizado. Debes iniciar sesión como vendedor." };
  }

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new Error("Producto no encontrado");
  }

  // Si no es superadmin, verificar que es el dueño de la tienda
  if (user.role !== "superadmin") {
    const store = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, existingProduct.storeId), eq(stores.userId, user.id)))
      .get();

    if (!store) {
      return { error: "No tienes permiso para editar este producto" };
    }
  }

  // Si recibimos FormData, convertirlo a objeto
  let rawData = data;
  if (data instanceof FormData) {
    rawData = {
      sku: data.get("sku") || undefined,
      name: data.get("name"),
      description: data.get("description"),
      price: data.get("price"),
      category: data.get("category"),
      status: data.get("status") || undefined,
      oferta: data.get("oferta"),
      precioOferta: data.get("precioOferta"),
      diasPromocion: data.get("diasPromocion"),
      isPublished: data.get("isPublished") === "true",
      imageUrls: data.get("imageUrls"),
      imageUrlsThumb: data.get("imageUrlsThumb"),
      imageUrlsOg: data.get("imageUrlsOg"),
      stock: data.get("stock"),
    };
  }

  const validatedFields = updateProductSchema.safeParse({
    sku: rawData.sku as string || undefined,
    name: rawData.name || undefined,
    description: rawData.description || undefined,
    price: typeof rawData.price === 'string' ? parseFloat(rawData.price) : rawData.price,
    category: rawData.category,
    status: (rawData.status as any) || undefined,
    oferta: typeof rawData.oferta === 'string' ? parseInt(rawData.oferta) : (rawData.oferta || 0),
    precioOferta: typeof rawData.precioOferta === 'string' && rawData.precioOferta !== "" ? parseFloat(rawData.precioOferta) : (rawData.precioOferta || null),
    diasPromocion: typeof rawData.diasPromocion === 'string' && rawData.diasPromocion !== "" ? parseInt(rawData.diasPromocion) : (rawData.diasPromocion || null),
    isPublished: rawData.isPublished !== undefined ? rawData.isPublished : undefined,
    stock: typeof rawData.stock === 'string' ? parseInt(rawData.stock) : rawData.stock,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const { sku, name, description, price, category, status, oferta, precioOferta, diasPromocion, isPublished, stock } = validatedFields.data;

  const productUpdate: any = {
    updatedAt: new Date(),
  };

  if (sku !== undefined) productUpdate.sku = sku;
  if (name !== undefined) productUpdate.name = name;
  if (description !== undefined) productUpdate.description = description;
  if (category !== undefined) productUpdate.category = category;
  if (status !== undefined) productUpdate.status = status;

  // Procesar imágenes
  if (rawData.imageUrls) {
    try {
      productUpdate.imageUrls = typeof rawData.imageUrls === 'string'
        ? JSON.parse(rawData.imageUrls)
        : rawData.imageUrls;
    } catch (e) {
      console.error("Error parsing imageUrls:", e);
    }
  }
  if (rawData.imageUrlsThumb) {
    try {
      const parsed = typeof rawData.imageUrlsThumb === 'string'
        ? JSON.parse(rawData.imageUrlsThumb)
        : rawData.imageUrlsThumb;
      if (Array.isArray(parsed)) {
        productUpdate.imageUrlsThumb = parsed.length > 0 ? parsed : null;
      }
    } catch (e) {
      console.error("Error parsing imageUrlsThumb:", e);
    }
  }
  if (rawData.imageUrlsOg) {
    try {
      const parsed = typeof rawData.imageUrlsOg === 'string'
        ? JSON.parse(rawData.imageUrlsOg)
        : rawData.imageUrlsOg;
      if (Array.isArray(parsed)) {
        productUpdate.imageUrlsOg = parsed.length > 0 ? parsed : null;
      }
    } catch (e) {
      console.error("Error parsing imageUrlsOg:", e);
    }
  }

  // Sincronizar arreglos para evitar "imágenes fantasma" en el zoom
  if (productUpdate.imageUrls) {
    const mainCount = productUpdate.imageUrls.length;
    
    if (productUpdate.imageUrlsThumb && Array.isArray(productUpdate.imageUrlsThumb)) {
      productUpdate.imageUrlsThumb = productUpdate.imageUrlsThumb.slice(0, mainCount);
    }
    if (productUpdate.imageUrlsOg && Array.isArray(productUpdate.imageUrlsOg)) {
      productUpdate.imageUrlsOg = productUpdate.imageUrlsOg.slice(0, mainCount);
    }
  }

  const comercialUpdate: any = {
    updatedAt: new Date(),
  };

  if (price !== undefined) comercialUpdate.precioVenta = price;
  if (oferta !== undefined) comercialUpdate.ofertaPorcentaje = oferta;
  if (precioOferta !== undefined) comercialUpdate.precioOferta = (precioOferta !== null && precioOferta > 0) ? precioOferta : null;
  if (isPublished !== undefined) comercialUpdate.isPublished = isPublished;
  
  if (precioOferta && precioOferta > 0 && diasPromocion && diasPromocion > 0) {
    const fechaFinOferta = new Date();
    fechaFinOferta.setDate(fechaFinOferta.getDate() + diasPromocion);
    comercialUpdate.fechaFinOferta = fechaFinOferta;
  } else if (precioOferta === 0 || precioOferta === null) {
    comercialUpdate.fechaFinOferta = null;
  }

  await db.transaction(async (tx) => {
    if (Object.keys(productUpdate).length > 1) { // more than just updatedAt
      await tx
        .update(products)
        .set(productUpdate)
        .where(eq(products.id, productId));
    }

    if (Object.keys(comercialUpdate).length > 1) {
      await tx
        .update(comercialConfig)
        .set(comercialUpdate)
        .where(eq(comercialConfig.productId, productId));
    }

    if (stock !== undefined) {
      await tx
        .update(inventory)
        .set({ 
          stockActual: stock, 
          updatedAt: new Date() 
        })
        .where(eq(inventory.productId, productId));
    }
  });

  revalidatePath(`/dashboard/productos/${productId}/editar`);
  revalidatePath("/dashboard/productos");
  revalidatePath(`/productos/${productId}`);
  revalidatePath(`/tienda/${existingProduct.storeId}`);
  revalidatePath("/");
  // @ts-ignore
  revalidateTag(`product-${productId}`);

  return { success: true };
}



// ============================================
// 7.2 GET PRODUCTS CURSOR (SCROLL INFINITO)
// ============================================

export async function getProductsCursorDirect(
  page: number = 1,
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

  const offset = (page - 1) * limit;

  const results = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
      store: {
        name: stores.name,
        phone: stores.phone,
      }
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .leftJoin(stores, eq(products.storeId, stores.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const items = results.map(r => ({
    ...r.product,
    inventory: r.inventory,
    comercialConfig: r.comercialConfig,
    price: r.comercialConfig?.precioVenta ?? 0,
    oferta: r.comercialConfig?.ofertaPorcentaje ?? 0,
    store: r.store,
  }));

  return { items };
}

export async function getProductsCursor(
  page: number = 1,
  limit: number = 12,
  category?: string,
  search?: string
) {
  const config = await getSystemConfig();
  
  // Always use the same cache key so revalidateTag("market-feed") reliably invalidates it.
  // TTL adjusts based on Nivel 1 toggle.
  const ttl = config.cacheScrollEnabled ? config.marketCacheTtl : 30;
  const pageLimit = config.cacheScrollEnabled ? config.marketScrollLimit : 15;
  const label = config.cacheScrollEnabled ? "ON ⚡ Nivel 1" : "OFF 📁 Micro-30s";
  
  console.log(`[Market Cache: ${label}] TTL=${ttl}s | Page: ${page}`);

  const getCached = unstable_cache(
    async (p: number = 1, l: number = 12, cat?: string, s?: string) => {
      console.log(`[Market Cache MISS ❌] Querying Turso DB for fresh data. Limit: ${l}`);
      return getProductsCursorDirect(p, l, cat, s);
    },
    ["market-products"],
    { revalidate: ttl, tags: ["market-feed"] }
  );

  return getCached(page, pageLimit, category, search);
}

export async function refreshMarketFeed() {
  console.log(`[Cache PURGE 🧹] Invalidating all global caches (market, stores, details).`);
  // @ts-ignore
  revalidateTag("market-feed");
  // @ts-ignore
  revalidateTag("all-store-feeds");
  // @ts-ignore
  revalidateTag("all-products");
  
  revalidatePath("/");
  return { success: true, message: "Caché global sincronizado" };
}

// ─── HELPERS DE LIMPIEZA R2 ──────────────────────────────────────────────────

/**
 * Elimina todas las variantes (feed, thumb, og) de una lista de URLs de R2.
 */
async function deleteProductImagesFromR2(urls: string[]) {
  if (!urls || urls.length === 0) return;

  try {
    const { r2Client, R2_BUCKET_NAME, extractKeyFromUrl } = await import("@/lib/cloudflare");
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const deletePromises = urls.flatMap((url) => {
      const key = extractKeyFromUrl(url);
      if (!key) return [];

      const parts = key.split("/");
      const filename = parts[parts.length - 1];
      
      return ["400x300", "1200x900", "1200x630"].map((folder) => {
        return r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: `products/${folder}/${filename}`,
          })
        ).catch(err => console.error(`Error eliminando variante ${folder}/${filename}:`, err));
      });
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error en deleteProductImagesFromR2:", error);
  }
}