"use server";

import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/app/actions/auth";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const updateUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  role: z.enum(["seller", "assistant", "superadmin"]).optional(),
  phone: z.string().optional(),
  videoPlan: z.enum(["free", "video", "pro"]).optional(),
  image: z.string().optional().nullable(),
});

const createUserSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["seller", "assistant", "superadmin"]).default("seller"),
  phone: z.string().optional(),
  image: z.string().optional().nullable(),
});

// ============================================
// OBTENER TODOS LOS USUARIOS (SUPERADMIN)
// ============================================

export async function getAllUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string
) {
  await requireRole("superadmin");

  const offset = (page - 1) * limit;
  const conditions = [];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`${users.name} LIKE ${searchTerm} OR ${users.email} LIKE ${searchTerm}`
    );
  }

  if (role && role !== "todos") {
    conditions.push(eq(users.role, role));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      videoPlan: users.videoPlan,
      videoPlanExpiresAt: users.videoPlanExpiresAt,
      provider: users.provider,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Obtener tienda asociada para vendedores
  const usersWithStore = await Promise.all(
    allUsers.map(async (user) => {
      const store = await db
        .select({ id: stores.id, name: stores.name, verified: stores.verified })
        .from(stores)
        .where(eq(stores.userId, user.id))
        .get();

      return {
        ...user,
        store,
      };
    })
  );

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(whereClause)
    .get();

  const total = totalResult?.count ?? 0;

  return {
    users: usersWithStore,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

// ============================================
// OBTENER USUARIO POR ID
// ============================================

export async function getUserById(id: string) {
  await requireRole("superadmin");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!user) {
    return null;
  }

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  return {
    ...user,
    store,
  };
}

// ============================================
// CREAR USUARIO (SUPERADMIN)
// ============================================

export async function createUser(formData: FormData) {
  await requireRole("superadmin");

  const validatedFields = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    phone: formData.get("phone") || undefined,
    image: formData.get("image") as string || undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
      fields: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
      },
    };
  }

  const { name, email, password, role, phone, image } = validatedFields.data;

  // Verificar si el email ya existe
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (existingUser) {
    return {
      error: "El email ya está registrado",
      fields: { name, email },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    name,
    email,
    password: hashedPassword,
    role,
    phone,
    image,
    createdAt: new Date(),
  });

  // Si el usuario es vendedor, crear tienda automáticamente
  if (role === "seller") {
    await db.insert(stores).values({
      id: randomUUID(),
      userId: userId,
      name: `Tienda de ${name}`,
      description: "Bienvenido a tu nueva tienda.",
      verified: false,
      createdAt: new Date(),
    });
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?created=true");
}

// ============================================
// ACTUALIZAR USUARIO
// ============================================

export async function updateUser(userId: string, formData: FormData) {
  await requireRole("superadmin");

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!existingUser) {
    return { error: "Usuario no encontrado" };
  }

  const validatedFields = updateUserSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    role: formData.get("role") || undefined,
    phone: formData.get("phone") || undefined,
    videoPlan: formData.get("videoPlan") || undefined,
    image: formData.get("image") as string || undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const updateData = validatedFields.data;

  await db
    .update(users)
    .set({
      ...updateData,
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);

  return {
    success: true,
    message: "Usuario actualizado correctamente",
  };
}

// ============================================
// ELIMINAR USUARIO
// ============================================

export async function deleteUser(userId: string) {
  await requireRole("superadmin");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return { error: "Usuario no encontrado" };
  }

  // Eliminar tienda asociada si existe
  await db.delete(stores).where(eq(stores.userId, userId));

  // Eliminar usuario
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin/usuarios");

  return { success: true };
}

// ============================================
// OBTENER ESTADÍSTICAS DE USUARIOS
// ============================================

export async function getUserStats() {
  await requireRole("superadmin");

  const totalUsers = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .get();

  const sellers = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "seller"))
    .get();

  const assistants = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "assistant"))
    .get();

  const superadmins = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "superadmin"))
    .get();

  const verifiedSellers = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.verified, true))
    .get();

  return {
    totalUsers: totalUsers?.count || 0,
    sellers: sellers?.count || 0,
    assistants: assistants?.count || 0,
    superadmins: superadmins?.count || 0,
    verifiedSellers: verifiedSellers?.count || 0,
  };
}