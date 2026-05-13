'use server';

import { db } from '@/db';
import { users, stores, orders, giftCards, notifications } from '@/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from './auth';
import { z } from 'zod';
import { uploadImageFromBuffer, deleteImage, extractKeyFromUrl } from '@/lib/cloudflare';

// ============================================
// OBTENER DATOS COMPLETOS DEL PERFIL
// ============================================

export async function getProfileData() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        phone: users.phone,
        image: users.image,
        provider: users.provider,
        videoPlan: users.videoPlan,
        videoPlanExpiresAt: users.videoPlanExpiresAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .get();

    if (!user) return null;

    // Obtener tienda del usuario
    let store = null;
    try {
      store = await db
        .select()
        .from(stores)
        .where(eq(stores.userId, user.id))
        .get() || null;
    } catch (e) {
      console.error('Error fetching store in profile:', e);
    }

    // Estadísticas de órdenes
    let orderStats = { total: 0, pending: 0, delivered: 0 };
    if (store) {
      try {
        const storeOrders = await db
          .select({
            status: orders.status,
            count: count(),
          })
          .from(orders)
          .where(eq(orders.storeId, store.id))
          .groupBy(orders.status)
          .all();

        for (const row of storeOrders) {
          orderStats.total += row.count;
          if (row.status === 'pending_payment') orderStats.pending += row.count;
          if (row.status === 'delivered') orderStats.delivered += row.count;
        }
      } catch (e) {
        console.error('Error fetching order stats:', e);
      }
    }

    // Estadísticas de Gift Cards
    let gcSentCount = 0;
    let gcReceivedCount = 0;
    try {
      const sent = await db
        .select({ count: count() })
        .from(giftCards)
        .where(eq(giftCards.senderId, user.id))
        .get();
      gcSentCount = sent?.count ?? 0;

      const received = await db
        .select({ count: count() })
        .from(giftCards)
        .where(eq(giftCards.recipientId, user.id))
        .get();
      gcReceivedCount = received?.count ?? 0;
    } catch (e) {
      console.error('Error fetching GC stats:', e);
    }

    // Notificaciones no leídas
    let unreadNotifs = 0;
    try {
      const notifs = await db
        .select({ count: count() })
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .get();
      unreadNotifs = notifs?.count ?? 0;
    } catch (e) {
      console.error('Error fetching notification count:', e);
    }

    return {
      user,
      store,
      stats: {
        orders: orderStats,
        giftCardsSent: gcSentCount,
        giftCardsReceived: gcReceivedCount,
        notifications: unreadNotifs,
      },
    };
  } catch (error) {
    console.error('Error in getProfileData:', error);
    return null;
  }
}

// ============================================
// ACTUALIZAR PERFIL DE USUARIO
// ============================================

const updateProfileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

export async function updateProfile(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'No autorizado' };

  const result = updateProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, phone } = result.data;

  await db
    .update(users)
    .set({ name, phone: phone || null })
    .where(eq(users.id, currentUser.id));

  revalidatePath('/profile');
  return { success: true };
}

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirma la contraseña'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export async function changePassword(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'No autorizado' };

  const result = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { currentPassword, newPassword } = result.data;

  // Fetch user with password
  const userWithPw = await db
    .select({ password: users.password, provider: users.provider })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .get();

  if (!userWithPw) return { error: 'Usuario no encontrado' };

  if (userWithPw.provider === 'google') {
    return { error: 'Tu cuenta usa Google. No puedes cambiar contraseña aquí.' };
  }

  if (!userWithPw.password) {
    return { error: 'No tienes contraseña configurada' };
  }

  const isValid = await bcrypt.compare(currentPassword, userWithPw.password);
  if (!isValid) {
    return { error: 'La contraseña actual es incorrecta' };
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashed }).where(eq(users.id, currentUser.id));

  return { success: true };
}

// ============================================
// ACTUALIZAR FOTO DE PERFIL
// ============================================

export async function updateProfileImage(base64Image: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'No autorizado' };

  try {
    // 1. Convertir base64 a Buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Detectar mime type
    const mimeType = base64Image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    
    // 2. Eliminar imagen anterior si existe
    const user = await db
      .select({ image: users.image })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .get();
    
    if (user?.image) {
      const oldKey = extractKeyFromUrl(user.image);
      if (oldKey) {
        await deleteImage(oldKey).catch(err => console.error("Error deleting old profile pic:", err));
      }
    }

    // 3. Subir nueva imagen
    const result = await uploadImageFromBuffer(
      buffer,
      `profile-${currentUser.id}.jpg`,
      mimeType,
      'profiles'
    );

    // 4. Actualizar base de datos
    await db
      .update(users)
      .set({ image: result.url })
      .where(eq(users.id, currentUser.id));

    revalidatePath('/profile');
    return { success: true, url: result.url };
  } catch (error: any) {
    console.error('Error updating profile image:', error);
    return { error: 'No se pudo actualizar la imagen: ' + error.message };
  }
}

// ============================================
// ELIMINAR FOTO DE PERFIL
// ============================================

export async function removeProfileImage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'No autorizado' };

  try {
    const user = await db
      .select({ image: users.image })
      .from(users)
      .where(eq(users.id, currentUser.id))
      .get();

    if (user?.image) {
      const oldKey = extractKeyFromUrl(user.image);
      if (oldKey) {
        await deleteImage(oldKey).catch(err => console.error("Error deleting profile pic:", err));
      }
    }

    await db
      .update(users)
      .set({ image: null })
      .where(eq(users.id, currentUser.id));

    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    console.error('Error removing profile image:', error);
    return { error: 'No se pudo eliminar la imagen' };
  }
}
