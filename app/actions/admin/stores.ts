"use server";

import { db } from "@/db";
import { stores, users, products, inventory, orders } from "@/db/schema";
import { eq, desc, sql, and, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/app/actions/auth";

// ============================================
// TIPOS
// ============================================

export interface StoreWithDetails {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  verified: boolean;
  rating: number | null;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  productsCount: number;
  totalRevenue: number;
  totalOrders: number;
}

// ============================================
// OBTENER TODAS LAS TIENDAS (CON DETALLES)
// ============================================

export async function getAllStores(
  page: number = 1,
  limit: number = 10,
  search?: string,
  verified?: boolean
) {
  await requireRole("superadmin");

  const offset = (page - 1) * limit;
  const conditions = [];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`${stores.name} LIKE ${searchTerm} OR ${users.email} LIKE ${searchTerm}`
    );
  }

  if (verified !== undefined) {
    conditions.push(eq(stores.verified, verified));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Obtener tiendas con información básica
  const allStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      description: stores.description,
      address: stores.address,
      phone: stores.phone,
      logoUrl: stores.logoUrl,
      verified: stores.verified,
      rating: stores.rating,
      createdAt: stores.createdAt,
      userId: stores.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(stores)
    .innerJoin(users, eq(stores.userId, users.id))
    .where(whereClause)
    .orderBy(desc(stores.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Obtener estadísticas adicionales para cada tienda (SQLite compatible)
  const storesWithStats = await Promise.all(
    allStores.map(async (store) => {
      // Contar productos (sin join con inventory porque products no tiene stock)
      const productsCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.storeId, store.id))
        .get();

      // Calcular ingresos totales y número de órdenes
      // SQLite requiere repetir la expresión en ORDER BY, no usamos orderBy aquí
      const statsResult = await db
        .select({
          totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
          totalOrders: sql<number>`coalesce(count(${orders.id}), 0)`,
        })
        .from(orders)
        .where(eq(orders.storeId, store.id))
        .get();

      return {
        id: store.id,
        name: store.name,
        description: store.description ?? undefined,
        address: store.address ?? undefined,
        phone: store.phone ?? undefined,
        logoUrl: store.logoUrl ?? undefined,
        verified: !!store.verified,
        rating: store.rating ?? undefined,
        createdAt: store.createdAt,
        userId: store.userId,
        user: {
          id: store.userId,
          name: store.userName ?? undefined,
          email: store.userEmail ?? undefined,
        },
        productsCount: productsCountResult?.count ?? 0,
        totalRevenue: statsResult?.totalRevenue ?? 0,
        totalOrders: statsResult?.totalOrders ?? 0,
      };
    })
  );

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .innerJoin(users, eq(stores.userId, users.id))
    .where(whereClause)
    .get();

  const total = totalResult?.count ?? 0;

  return {
    stores: storesWithStats,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

// ============================================
// VERIFICAR TIENDA (ACTIVAR/DESACTIVAR)
// ============================================

export async function verifyStore(storeId: string, verified: boolean) {
  await requireRole("superadmin");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .get();

  if (!store) {
    return { error: "Tienda no encontrada" };
  }

  await db
    .update(stores)
    .set({
      verified,
    })
    .where(eq(stores.id, storeId));

  revalidatePath("/admin/tiendas");
  revalidatePath("/tiendas");

  return {
    success: true,
    message: verified ? "Tienda verificada correctamente" : "Verificación de tienda cancelada",
  };
}

// ============================================
// OBTENER TIENDA POR ID
// ============================================

export async function getStoreById(id: string) {
  await requireRole("superadmin");

  const store = await db
    .select({
      id: stores.id,
      name: stores.name,
      description: stores.description,
      address: stores.address,
      phone: stores.phone,
      logoUrl: stores.logoUrl,
      verified: stores.verified,
      rating: stores.rating,
      createdAt: stores.createdAt,
      userId: stores.userId,
      userEmail: users.email,
      userName: users.name,
      userRole: users.role,
      userCreatedAt: users.createdAt,
    })
    .from(stores)
    .innerJoin(users, eq(stores.userId, users.id))
    .where(eq(stores.id, id))
    .get();

  if (!store) {
    return null;
  }

  // Contar productos
  const productsCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.storeId, id))
    .get();

  // Contar órdenes y calcular ingresos
  const statsResult = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      totalOrders: sql<number>`coalesce(count(${orders.id}), 0)`,
      pendingOrders: sql<number>`coalesce(sum(case when ${orders.status} = 'pending_payment' then 1 else 0 end), 0)`,
    })
    .from(orders)
    .where(eq(orders.storeId, id))
    .get();

  // Últimos 5 productos
  const recentProducts = await db
    .select()
    .from(products)
    .where(eq(products.storeId, id))
    .orderBy(desc(products.createdAt))
    .limit(5)
    .all();

  return {
    id: store.id,
    name: store.name,
    description: store.description ?? undefined,
    address: store.address ?? undefined,
    phone: store.phone ?? undefined,
    logoUrl: store.logoUrl ?? undefined,
    verified: !!store.verified,
    rating: store.rating ?? undefined,
    createdAt: store.createdAt,
    userId: store.userId,
    user: {
      id: store.userId,
      name: store.userName ?? undefined,
      email: store.userEmail ?? undefined,
      role: store.userRole ?? undefined,
      createdAt: store.userCreatedAt,
    },
    productsCount: productsCountResult?.count ?? 0,
    totalRevenue: statsResult?.totalRevenue ?? 0,
    totalOrders: statsResult?.totalOrders ?? 0,
    pendingOrders: statsResult?.pendingOrders ?? 0,
    recentProducts: recentProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrls?.[0] ?? undefined,
    })),
  };
}

// ============================================
// OBTENER ESTADÍSTICAS DE TIENDAS
// ============================================

export async function getStoresStats() {
  await requireRole("superadmin");

  const totalStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .get();

  const verifiedStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.verified, true))
    .get();

  const pendingStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.verified, false))
    .get();

  // Tiendas verificadas hoy (SQLite timestamp handling)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const verifiedToday = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(
      and(
        eq(stores.verified, true),
        sql`${stores.createdAt} >= ${today.getTime()}`,
        sql`${stores.createdAt} < ${tomorrow.getTime()}`
      )
    )
    .get();

  const activeSellers = await db
    .select({ count: sql<number>`count(distinct ${stores.userId})` })
    .from(stores)
    .get();

  return {
    totalStores: totalStores?.count ?? 0,
    verifiedStores: verifiedStores?.count ?? 0,
    pendingStores: pendingStores?.count ?? 0,
    verifiedToday: verifiedToday?.count ?? 0,
    activeSellers: activeSellers?.count ?? 0,
  };
}