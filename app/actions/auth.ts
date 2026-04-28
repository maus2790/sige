
//app/actions/auth.ts
"use server";

import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendResetEmail } from "@/lib/send-reset-email";

// ============================================
// ESQUEMAS DE VALIDACIÓN CORREGIDOS
// ============================================

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Función para generar ID único
function generateId() {
  return randomUUID();
}

// ============================================
// 3.3 REGISTRO DE USUARIO
// ============================================

export async function handleRegister(formData: FormData) {
  const result = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      error: firstError.message,
      fields: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
      },
    };
  }

  const { name, email, password } = result.data;

  // Verificar si el usuario ya existe
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

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear usuario
  const userId = generateId();

  await db.insert(users).values({
    id: userId,
    name,
    email,
    password: hashedPassword,
    role: "seller",
    createdAt: new Date(),
  });

  // Crear tienda automáticamente para el vendedor
  const storeId = generateId();
  const storeName = `Tienda de ${name}`;

  await db.insert(stores).values({
    id: storeId,
    userId: userId,
    name: storeName,
    description: "Bienvenido a tu nueva tienda. Completa los datos para personalizarla.",
    verified: false,
    createdAt: new Date(),
  });

  redirect("/auth/login?registered=true");
}

// ============================================
// 3.4 LOGIN DE USUARIO
// ============================================

export async function handleLogin(formData: FormData) {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      error: firstError.message,
      fields: {
        email: formData.get("email") as string,
      },
    };
  }

  const { email, password } = result.data;

  // Buscar usuario por email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    return {
      error: "Email o contraseña incorrectos",
      fields: { email },
    };
  }

  // Verificar contraseña (solo para usuarios con password local, no Google)
  if (user.password) {
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return {
        error: "Email o contraseña incorrectos",
        fields: { email },
      };
    }
  } else if (user.provider === "google") {
    return {
      error: "Esta cuenta usa Google. Inicia sesión con Google.",
      fields: { email },
    };
  }

  // Crear cookie de sesión
  const cookieStore = await cookies();
  cookieStore.set("session_id", generateId(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
  cookieStore.set("user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  cookieStore.set("user_name", user.name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  cookieStore.set("user_role", user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Redirigir según rol
  if (user.role === "superadmin") {
    redirect("/admin");
  } else if (user.role === "seller") {
    redirect("/dashboard");
  } else if (user.role === "assistant") {
    redirect("/assistant");
  } else {
    redirect("/");
  }
}

// ============================================
// 3.5 LOGOUT
// ============================================

export async function handleLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("session_id");
  cookieStore.delete("user_id");
  cookieStore.delete("user_name");
  cookieStore.delete("user_role");

  redirect("/auth/login");
}

// ============================================
// 3.6 OBTENER USUARIO ACTUAL
// ============================================

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      videoPlan: users.videoPlan,
      videoPlanExpiresAt: users.videoPlanExpiresAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return null;
  }

  return user;
}

// ============================================
// 3.7 REQUERIR AUTENTICACIÓN
// ============================================

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

// ============================================
// 3.8 REQUERIR ROL ESPECÍFICO
// ============================================

export async function requireRole(allowedRoles: string | string[]) {
  const user = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    // Redirigir según el rol real del usuario
    if (user.role === "superadmin") {
      redirect("/admin");
    } else if (user.role === "seller") {
      redirect("/dashboard");
    } else if (user.role === "assistant") {
      redirect("/assistant");
    } else {
      redirect("/unauthorized");
    }
  }

  return user;
}

// ============================================
// 3.9 RECUPERAR CONTRASEÑA - ENVIAR EMAIL
// ============================================

export async function handleForgotPassword(formData: FormData) {
  const result = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const { email } = result.data;

  // Buscar usuario
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user) {
    // Por seguridad, no revelamos si el email existe o no
    return {
      success: "Si el email está registrado, recibirás un enlace para recuperar tu contraseña",
    };
  }

  // Generar token de recuperación
  const resetToken = generateId();
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expira en 1 hora

  // Guardar token en la base de datos
  await db
    .update(users)
    .set({
      resetToken: resetToken,
      resetTokenExpiry: resetTokenExpiry,
    })
    .where(eq(users.id, user.id));

  // Construir enlace de recuperación


  // Enviar email de recuperación
  await sendResetEmail(user.email, user.name, resetToken);

  return {
    success: "Revisa tu email para recuperar tu contraseña",
  };
}

// ============================================
// 3.10 RESTABLECER CONTRASEÑA
// ============================================

export async function handleResetPassword(formData: FormData, token: string) {
  const result = resetPasswordSchema.safeParse({
    token,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const { password } = result.data;

  // Buscar usuario por token no expirado
  const user = await db
    .select()
    .from(users)
    .where(eq(users.resetToken, token))
    .get();

  if (!user) {
    return {
      error: "Token inválido o expirado",
    };
  }

  // Verificar si el token expiró
  if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
    return {
      error: "El enlace ha expirado. Solicita uno nuevo.",
    };
  }

  // Hashear nueva contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Actualizar contraseña y limpiar token
  await db
    .update(users)
    .set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, user.id));

  redirect("/auth/login?reset=true");
}