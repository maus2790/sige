"use server";

import { db } from "@/db";
import { orders, products, stores, inventory, comercialConfig } from "@/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, getCurrentUser } from "./auth";
import { sendOneSignalNotification } from "@/lib/onesignal";

// ============================================
// TIPOS Y ESQUEMAS
// ============================================

type OrderStatus = 
  | "pending_payment" 
  | "payment_verified" 
  | "processing" 
  | "shipped" 
  | "delivered" 
  | "cancelled";

const checkoutSchema = z.object({
  productId: z.string().min(1, "Producto requerido"),
  buyerName: z.string().min(2, "Nombre completo requerido"),
  buyerPhone: z.string().min(8, "Teléfono válido requerido"),
  buyerEmail: z.string().email("Email inválido").optional(),
  buyerCi: z.string().optional(),
  quantity: z.number().int().min(1, "Cantidad mínima 1"),
  shippingAddress: z.string().min(5, "Dirección de envío requerida"),
  paymentMethod: z.enum(["qr", "transfer", "cash"]).default("qr"),
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

// ============================================
// ESTADÍSTICAS DEL ASISTENTE
// ============================================

export async function getAssistantStats() {
  await requireRole(["assistant", "superadmin"]);

  const pendingCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "pending_payment"))
    .get();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const verifiedToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(
      and(
        eq(orders.status, "payment_verified"),
        gte(orders.paymentVerifiedAt, startOfDay)
      )
    )
    .get();

  const totalVerified = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "payment_verified"))
    .get();

  const totalRejected = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "cancelled"))
    .get();

  // Gift Card Stats
  const { giftCards } = await import("@/db/schema");
  const pendingGiftCards = await db
    .select({ count: sql<number>`count(*)` })
    .from(giftCards)
    .where(eq(giftCards.status, "pending_payment"))
    .get();

  return {
    pendingPayments: (pendingCount?.count ?? 0) + (pendingGiftCards?.count ?? 0),
    verifiedToday: verifiedToday?.count ?? 0,
    totalVerified: totalVerified?.count ?? 0,
    totalRejected: totalRejected?.count ?? 0,
    pendingOrders: pendingCount?.count ?? 0,
    pendingGiftCards: pendingGiftCards?.count ?? 0,
  };
}

// ============================================
// 12.1 CREAR ORDEN (CHECKOUT)
// ============================================

export async function createOrder(formData: FormData) {
  const rawQuantity = formData.get("quantity");
  
  const validatedFields = checkoutSchema.safeParse({
    productId: formData.get("productId"),
    buyerName: formData.get("buyerName"),
    buyerPhone: formData.get("buyerPhone"),
    buyerEmail: formData.get("buyerEmail") || undefined,
    buyerCi: formData.get("buyerCi") || undefined,
    quantity: rawQuantity ? parseInt(rawQuantity as string) : 1,
    shippingAddress: formData.get("shippingAddress"),
    paymentMethod: formData.get("paymentMethod"),
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
      fields: {
        buyerName: formData.get("buyerName") as string,
        buyerPhone: formData.get("buyerPhone") as string,
        shippingAddress: formData.get("shippingAddress") as string,
      },
    };
  }

  const { 
    productId, 
    buyerName, 
    buyerPhone, 
    buyerEmail, 
    buyerCi, 
    quantity, 
    shippingAddress,
    paymentMethod 
  } = validatedFields.data;

  // Obtener producto e inventario
  const productData = await db
    .select({
      product: products,
      inventory: inventory,
      comercialConfig: comercialConfig,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(eq(products.id, productId))
    .get();

  if (!productData) {
    return { error: "Producto no encontrado" };
  }

  const { product, inventory: productInventory } = productData;
  const currentStock = productInventory?.stockActual ?? 0;

  if (currentStock < quantity) {
    return { error: `Stock insuficiente. Solo quedan ${currentStock} unidades.` };
  }

  const finalPrice = productData.comercialConfig?.precioOferta || productData.comercialConfig?.precioVenta || 0;
  const discountApplied = productData.comercialConfig?.ofertaPorcentaje || 0;

  const totalAmount = finalPrice * quantity;

  // Crear orden
  const orderId = randomUUID();

  await db.insert(orders).values({
    id: orderId,
    productId,
    storeId: product.storeId,
    buyerName,
    buyerPhone,
    buyerEmail,
    buyerCi,
    quantity,
    unitPrice: finalPrice,
    discountApplied: discountApplied,
    totalAmount,
    shippingAddress,
    paymentMethod,
    status: "pending_payment",
    createdAt: new Date(),
  });

  // Reducir stock en la tabla inventory
  if (productInventory) {
    await db
      .update(inventory)
      .set({ 
        stockActual: currentStock - quantity,
        updatedAt: new Date()
      })
      .where(eq(inventory.productId, productId));
  }

  // Obtener la tienda para notificar al vendedor
  const store = await db
    .select({ userId: stores.userId, name: stores.name })
    .from(stores)
    .where(eq(stores.id, product.storeId))
    .get();

  if (store?.userId) {
    await sendOneSignalNotification({
      userIds: [store.userId],
      title: `¡Nueva compra en ${store.name}! 🛍️`,
      message: `${buyerName} ha comprado ${quantity}x ${product.name}.`,
      url: `/dashboard/pedidos` // Asumiendo que esta es la ruta para ver pedidos
    });
  }

  revalidatePath(`/productos/${productId}`);
  revalidatePath("/");
  
  return { id: orderId };
}

// ============================================
// 12.1.2 OBTENER ORDEN PARA CHECKOUT
// ============================================

export async function getOrderForCheckout(orderId: string) {
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!order) {
    return null;
  }

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, order.productId))
    .get();

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.id, order.storeId))
    .get();

  return {
    ...order,
    productName: product?.name,
    productImage: product?.imageUrls?.[0],
    storeName: store?.name,
    storePhone: store?.phone,
  };
}

// ============================================
// 11.3 VERIFICAR PAGO (ASISTENTE)
// ============================================

export async function verifyPayment(orderId: string, formData: FormData) {
  const user = await requireRole(["assistant", "superadmin"]);

  const verifiedFields = verifyPaymentSchema.safeParse({
    orderId,
    action: formData.get("action"),
    notes: formData.get("notes"),
  });

  if (!verifiedFields.success) {
    return {
      error: verifiedFields.error.issues[0].message,
    };
  }

  const { action, notes } = verifiedFields.data;

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!order) {
    return { error: "Orden no encontrada" };
  }

  if (order.status !== "pending_payment") {
    return { error: "Esta orden ya fue procesada" };
  }

  const newStatus = action === "approve" ? "payment_verified" : "cancelled";

  await db
    .update(orders)
    .set({
      status: newStatus,
      paymentVerifiedBy: user.id,
      paymentVerifiedAt: new Date(),
      assistantNotes: notes,
    })
    .where(eq(orders.id, orderId));

  revalidatePath("/assistant/pagos-pendientes");
  revalidatePath("/assistant");

  return {
    success: true,
    message: action === "approve" ? "Pago verificado correctamente" : "Pago rechazado",
  };
}

// ============================================
// OBTENER HISTORIAL DE TRANSACCIONES (ASISTENTE)
// ============================================

export async function getTransactionHistory(
  page: number = 1,
  limit: number = 20,
  status?: string
) {
  await requireRole(["assistant", "superadmin"]);

  const offset = (page - 1) * limit;
  const conditions = [];

  if (status && status !== "todos") {
    conditions.push(eq(orders.status, status as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const historyOrders = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(whereClause)
    .get();

  const total = totalResult?.count ?? 0;

  // Obtener detalles de productos y tiendas
  const ordersWithDetails = await Promise.all(
    historyOrders.map(async (order) => {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, order.productId))
        .get();

      const store = await db
        .select()
        .from(stores)
        .where(eq(stores.id, order.storeId))
        .get();

      return {
        ...order,
        productName: product?.name || "Producto no encontrado",
        storeName: store?.name || "Tienda no encontrada",
      };
    })
  );

  return {
    orders: ordersWithDetails,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

// ============================================
// OBTENER ÓRDENES PENDIENTES DE PAGO
// ============================================

export async function getPendingPayments() {
  await requireRole(["assistant", "superadmin"]);

  const pendingOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.status, "pending_payment"))
    .orderBy(desc(orders.createdAt))
    .all();

  const ordersWithDetails = await Promise.all(
    pendingOrders.map(async (order) => {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, order.productId))
        .get();

      const store = await db
        .select()
        .from(stores)
        .where(eq(stores.id, order.storeId))
        .get();

      return {
        ...order,
        productName: product?.name || "Producto no encontrado",
        storeName: store?.name || "Tienda no encontrada",
      };
    })
  );

  return ordersWithDetails;
}

// ============================================
// ACTUALIZAR ESTADO DE ORDEN (VENDEDOR)
// ============================================

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const user = await requireRole(["seller", "assistant", "superadmin"]);

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!order) {
    return { error: "Orden no encontrada" };
  }

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store || order.storeId !== store.id) {
    return { error: "No tienes permiso para modificar esta orden" };
  }

  const updateData: any = { status: newStatus };
  if (newStatus === "delivered") {
    updateData.deliveredAt = new Date();
  }

  await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, orderId));

  revalidatePath(`/dashboard/pedidos`);

  return { success: true };
}

// ============================================
// SUBIR COMPROBANTE DE PAGO (COMPRADOR)
// ============================================

export async function uploadPaymentProof(formData: FormData) {
  const orderId = formData.get("orderId") as string;
  const proofUrl = formData.get("proofUrl") as string;

  if (!orderId || !proofUrl) {
    return { error: "Faltan datos requeridos" };
  }

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!order) {
    return { error: "Orden no encontrada" };
  }

  if (order.status !== "pending_payment") {
    return { error: "Esta orden ya fue procesada" };
  }

  await db
    .update(orders)
    .set({
      paymentProofUrl: proofUrl,
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/checkout/${orderId}`);
  revalidatePath("/assistant/pagos-pendientes");

  return { success: true };
}

// ============================================
// OBTENER ÓRDENES DEL VENDEDOR
// ============================================

export async function getSellerOrders(page: number = 1, limit: number = 10, status?: string, search?: string) {
  const user = await requireRole(["seller", "assistant", "superadmin"]);

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return { orders: [], total: 0, pageCount: 0 };
  }

  const offset = (page - 1) * limit;
  const conditions = [eq(orders.storeId, store.id)];

  if (status && status !== "todos") {
    conditions.push(eq(orders.status, status as any));
  }

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    const searchTerm = `%${cleanSearch}%`;
    conditions.push(sql`(
      upper(${orders.buyerName}) LIKE upper(${searchTerm}) OR
      upper(${products.name}) LIKE upper(${searchTerm}) OR
      upper(${products.sku}) LIKE upper(${searchTerm})
    )`);
  }

  const sellerOrders = await db
    .select({ order: orders, product: products })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(and(...conditions))
    .get();

  const total = totalResult?.count ?? 0;

  const ordersWithDetails = await Promise.all(
    sellerOrders.map(async ({ order, product }) => {
      const relatedProduct = product || await db
        .select()
        .from(products)
        .where(eq(products.id, order.productId))
        .get();

      return {
        ...order,
        productName: relatedProduct?.name,
        productImage: relatedProduct?.imageUrls?.[0],
      };

      return {
        ...order,
        productName: product?.name,
        productImage: product?.imageUrls?.[0],
      };
    })
  );

  return {
    orders: ordersWithDetails,
    total,
    pageCount: Math.ceil(total / limit),
  };
}