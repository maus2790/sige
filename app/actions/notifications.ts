'use server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import crypto from 'crypto';

export async function getCurrentUser() {
  const session = await getServerSession(nextauthConfig);
  if (!(session?.user as any)?.id) return null;
  return session!.user as any;
}

export async function getUserNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return results;
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  const id = crypto.randomUUID();
  
  await db.insert(notifications).values({
    id,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type || 'general',
    link: data.link,
    read: false,
    createdAt: new Date(),
  });

  revalidatePath('/');
  return { success: true, id };
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, user.id)
    ));

  revalidatePath('/');
  return { success: true };
}

export async function markAllAsRead() {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, user.id));

  revalidatePath('/');
  return { success: true };
}
