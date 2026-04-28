"use server";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, desc, sql, and, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/app/actions/auth";
import { randomUUID } from "crypto";

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const createCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres"),
  icon: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres").optional(),
  icon: z.string().optional(),
});

// ============================================
// GENERAR SLUG A PARTIR DEL NOMBRE
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================
// OBTENER TODAS LAS CATEGORÍAS
// ============================================

export async function getAllCategories(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  await requireRole("superadmin");

  const offset = (page - 1) * limit;
  const conditions = [];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`${categories.name} LIKE ${searchTerm} OR ${categories.slug} LIKE ${searchTerm}`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
    })
    .from(categories)
    .where(whereClause)
    .orderBy(desc(categories.name))
    .limit(limit)
    .offset(offset)
    .all();

  // Obtener conteo de productos por categoría
  const categoriesWithCount = await Promise.all(
    allCategories.map(async (category) => {
      const productsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.category, category.name))
        .get();

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon ?? undefined,
        productsCount: productsCount?.count ?? 0,
      };
    })
  );

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .where(whereClause)
    .get();

  const total = totalResult?.count ?? 0;

  return {
    categories: categoriesWithCount,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

// ============================================
// OBTENER CATEGORÍA POR ID
// ============================================

export async function getCategoryById(id: string) {
  await requireRole("superadmin");

  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .get();

  if (!category) {
    return null;
  }

  const productsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.category, category.name))
    .get();

  // Obtener productos de ejemplo de esta categoría
  const sampleProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: sql<string>`json_extract(${products.imageUrls}, '$[0]')`,
    })
    .from(products)
    .where(eq(products.category, category.name))
    .limit(5)
    .all();

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? undefined,
    productsCount: productsCount?.count ?? 0,
    sampleProducts: sampleProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl ?? undefined,
    })),
  };
}

// ============================================
// CREAR CATEGORÍA
// ============================================

export async function createCategory(formData: FormData) {
  await requireRole("superadmin");

  const name = formData.get("name") as string;
  const customSlug = formData.get("slug") as string;
  
  // Generar slug automáticamente o usar el personalizado
  const slug = customSlug && customSlug.trim() ? generateSlug(customSlug) : generateSlug(name);
  const icon = formData.get("icon") as string;

  const validatedFields = createCategorySchema.safeParse({
    name,
    slug,
    icon: icon || undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
      fields: { name, slug, icon },
    };
  }

  const { name: validatedName, slug: validatedSlug, icon: validatedIcon } = validatedFields.data;

  // Verificar si el slug ya existe
  const existingCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, validatedSlug))
    .get();

  if (existingCategory) {
    return {
      error: "El slug ya está en uso. Usa otro nombre o slug personalizado.",
      fields: { name: validatedName, slug: validatedSlug, icon: validatedIcon },
    };
  }

  const categoryId = randomUUID();

  await db.insert(categories).values({
    id: categoryId,
    name: validatedName,
    slug: validatedSlug,
    icon: validatedIcon || null,
  });

  revalidatePath("/admin/categorias");
  redirect("/admin/categorias?created=true");
}

// ============================================
// ACTUALIZAR CATEGORÍA
// ============================================

export async function updateCategory(categoryId: string, formData: FormData) {
  await requireRole("superadmin");

  const existingCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .get();

  if (!existingCategory) {
    return { error: "Categoría no encontrada" };
  }

  const name = formData.get("name") as string;
  const customSlug = formData.get("slug") as string;
  const slug = customSlug && customSlug.trim() ? generateSlug(customSlug) : generateSlug(name);
  const icon = formData.get("icon") as string;

  const validatedFields = updateCategorySchema.safeParse({
    name: name || undefined,
    slug: slug || undefined,
    icon: icon || undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const updateData: any = {};

  if (validatedFields.data.name) updateData.name = validatedFields.data.name;
  if (validatedFields.data.slug) updateData.slug = validatedFields.data.slug;
  if (validatedFields.data.icon !== undefined) updateData.icon = validatedFields.data.icon || null;

  // Si el slug cambió, verificar que no exista otra categoría con ese slug
  if (updateData.slug && updateData.slug !== existingCategory.slug) {
    const duplicateCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, updateData.slug))
      .get();

    if (duplicateCategory) {
      return { error: "El slug ya está en uso por otra categoría" };
    }
  }

  await db
    .update(categories)
    .set(updateData)
    .where(eq(categories.id, categoryId));

  revalidatePath("/admin/categorias");
  revalidatePath(`/admin/categorias/${categoryId}`);

  return {
    success: true,
    message: "Categoría actualizada correctamente",
  };
}

// ============================================
// ELIMINAR CATEGORÍA
// ============================================

export async function deleteCategory(categoryId: string) {
  await requireRole("superadmin");

  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .get();

  if (!category) {
    return { error: "Categoría no encontrada" };
  }

  // Verificar si hay productos usando esta categoría
  const productsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.category, category.name))
    .get();

  if (productsCount && productsCount.count > 0) {
    return { 
      error: `No se puede eliminar la categoría porque tiene ${productsCount.count} producto(s) asociado(s). Primero reasigna o elimina esos productos.` 
    };
  }

  await db.delete(categories).where(eq(categories.id, categoryId));

  revalidatePath("/admin/categorias");

  return { success: true };
}

// ============================================
// OBTENER ESTADÍSTICAS DE CATEGORÍAS
// ============================================

export async function getCategoriesStats() {
  await requireRole("superadmin");

  const totalCategories = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .get();

  const categoriesWithProducts = await db
    .select({
      name: categories.name,
      count: sql<number>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(products, eq(products.category, categories.name))
    .groupBy(categories.id)
    .orderBy(desc(sql`count(${products.id})`))
    .limit(5)
    .all();

  const totalProductsInCategories = categoriesWithProducts.reduce((acc, c) => acc + (c.count || 0), 0);

  return {
    totalCategories: totalCategories?.count ?? 0,
    topCategories: categoriesWithProducts.map(c => ({
      name: c.name,
      count: c.count ?? 0,
    })),
    totalProductsInCategories,
  };
}