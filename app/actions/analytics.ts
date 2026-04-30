"use server";

import { db } from "@/db";
import { products, orders, stores, inventory } from "@/db/schema";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { requireRole } from "./auth";

// ============================================
// TIPOS
// ============================================

interface SalesData {
  date: string;
  total: number;
  count: number;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  imageUrl: string | null;
}

interface CategoryStat {
  category: string;
  sales: number;
  revenue: number;
}

// ============================================
// OBTENER ESTADÍSTICAS GENERALES DEL VENDEDOR
// ============================================

export async function getSellerStats() {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return {
      totalProducts: 0,
      totalSales: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      averageOrderValue: 0,
      lowStockProducts: 0,
      topProducts: [],
      salesByDay: [],
      salesByCategory: [],
    };
  }

  // Total de productos
  const totalProductsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.storeId, store.id))
    .get();

  // Productos con stock bajo (< 5 unidades) - CORREGIDO
  const lowStockResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .where(
      and(
        eq(products.storeId, store.id),
        lt(inventory.stockActual, 5)
      )
    )
    .get();

  // Estadísticas de órdenes
  const ordersStats = await db
    .select({
      totalSales: sql<number>`count(*)`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})`,
      pendingOrders: sql<number>`sum(case when ${orders.status} = 'pending_payment' then 1 else 0 end)`,
    })
    .from(orders)
    .where(eq(orders.storeId, store.id))
    .get();

  const totalRevenue = ordersStats?.totalRevenue || 0;
  const totalSales = ordersStats?.totalSales || 0;

  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Top 5 productos más vendidos
  const topProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sales: products.sales,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      imageUrl: sql<string>`json_extract(${products.imageUrls}, '$[0]')`,
    })
    .from(products)
    .leftJoin(orders, eq(orders.productId, products.id))
    .where(eq(products.storeId, store.id))
    .groupBy(products.id)
    .orderBy(desc(products.sales))
    .limit(5)
    .all();

  // Ventas por categoría
  const salesByCategory = await db
    .select({
      category: products.category,
      sales: sql<number>`coalesce(count(${orders.id}), 0)`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
    })
    .from(products)
    .leftJoin(orders, eq(orders.productId, products.id))
    .where(eq(products.storeId, store.id))
    .groupBy(products.category)
    .orderBy(desc(sql`coalesce(sum(${orders.totalAmount}), 0)`))
    .all();

  // Ventas por día (últimos 7 días)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const salesByDay = await Promise.all(
    last7Days.map(async (date) => {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const daySales = await db
        .select({
          total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
          count: sql<number>`coalesce(count(*), 0)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, store.id),
            sql`date(${orders.createdAt} / 1000, 'unixepoch') = date(${startDate.getTime() / 1000}, 'unixepoch')`
          )
        )
        .get();

      return {
        date: new Date(date).toLocaleDateString("es-BO", { weekday: "short" }),
        total: daySales?.total || 0,
        count: daySales?.count || 0,
      };
    })
  );

  return {
    totalProducts: totalProductsResult?.count || 0,
    totalSales: ordersStats?.totalSales || 0,
    totalRevenue: totalRevenue,
    pendingOrders: ordersStats?.pendingOrders || 0,
    averageOrderValue: averageOrderValue,
    lowStockProducts: lowStockResult?.count || 0,
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sales: p.sales || 0,
      revenue: p.revenue || 0,
      imageUrl: p.imageUrl,
    })),
    salesByDay,
    salesByCategory: salesByCategory.map((c) => ({
      category: c.category || "Sin categoría",
      sales: c.sales || 0,
      revenue: c.revenue || 0,
    })),
  };
}

// ============================================
// OBTENER VENTAS POR MES
// ============================================

export async function getSalesByMonth(year?: number) {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return [];
  }

  const currentYear = year || new Date().getFullYear();

  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  const salesByMonth = await Promise.all(
    months.map(async (month, index) => {
      const startDate = new Date(currentYear, index, 1);
      const endDate = new Date(currentYear, index + 1, 1);

      const monthSales = await db
        .select({
          total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
          count: sql<number>`coalesce(count(*), 0)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, store.id),
            sql`${orders.createdAt} >= ${startDate.getTime()}`,
            sql`${orders.createdAt} < ${endDate.getTime()}`
          )
        )
        .get();

      return {
        month,
        total: monthSales?.total || 0,
        count: monthSales?.count || 0,
      };
    })
  );

  return salesByMonth;
}

// ============================================
// OBTENER PRODUCTOS CON STOCK BAJO
// ============================================

export async function getLowStockProducts() {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    return [];
  }

  const lowStock = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      stockActual: inventory.stockActual,
      stockMinimo: inventory.stockMinimo,
      imageUrl: sql<string>`json_extract(${products.imageUrls}, '$[0]')`,
    })
    .from(inventory)
    .innerJoin(products, eq(inventory.productId, products.id))
    .where(
      and(
        eq(products.storeId, store.id),
        lt(inventory.stockActual, 10)
      )
    )
    .orderBy(inventory.stockActual)
    .limit(10)
    .all();

  return lowStock.map(item => ({
    ...item,
    stock: item.stockActual,
  }));
}

// ============================================
// ACTUALIZAR ESTADÍSTICAS DE PRODUCTOS
// ============================================

export async function updateProductStats(productId: string) {
  const user = await requireRole("seller");

  // Verificar que el producto pertenece al vendedor
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) return;

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store || product.storeId !== store.id) return;

  // Actualizar conteo de ventas
  const salesStats = await db
    .select({
      sales: sql<number>`coalesce(count(*), 0)`,
    })
    .from(orders)
    .where(eq(orders.productId, productId))
    .get();

  await db
    .update(products)
    .set({
      sales: salesStats?.sales || 0,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));
}