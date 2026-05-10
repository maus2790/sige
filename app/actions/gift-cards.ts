'use server';

import { db } from '@/db';
import { giftCards, products, stores, comercialConfig, users } from '@/db/schema';
import { eq, or, desc, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import crypto from 'crypto';
import { uploadImageFromBuffer } from '@/lib/cloudflare';

export async function getCurrentUser() {
  const session = await getServerSession(nextauthConfig);
  if (!(session?.user as any)?.id) return null;
  
  const user = session!.user as any;
  return {
    id: user.id as string,
    role: user.role as string || 'user',
    name: user.name as string || '',
  };
}

export async function getSIGEUsers() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  // Fetch users excluding the current one
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(sql`${users.id} != ${currentUser.id}`)
    .limit(50);

  return allUsers;
}

function generateGiftCode(): string {
  const prefix = 'GIFT';
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

function generateQrHash(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function getUserGiftCards() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const userGiftCards = await db
    .select()
    .from(giftCards)
    .where(
      or(
        eq(giftCards.senderId, user.id),
        eq(giftCards.recipientId, user.id)
      )
    )
    .orderBy(desc(giftCards.createdAt));
  
  const sent = userGiftCards.filter(gc => gc.senderId === user.id && gc.recipientId !== user.id);
  const received = userGiftCards.filter(gc => gc.recipientId === user.id && gc.senderId !== user.id);
  const saved = userGiftCards.filter(gc => gc.senderId === user.id && gc.recipientId === user.id);
  
  return { sent, received, saved, all: userGiftCards };
}

export async function getGiftCardById(giftCardId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const giftCard = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.id, giftCardId))
    .limit(1);
  
  if (!giftCard[0]) {
    return null;
  }
  
  if (giftCard[0].senderId !== user.id && giftCard[0].recipientId !== user.id) {
    return null;
  }
  
  return giftCard[0];
}

export async function getTotalBalance() {
  const user = await getCurrentUser();
  
  if (!user) {
    return 0;
  }
  
  const result = await db
    .select({
      total: sql<number>`SUM(${giftCards.balance})`,
    })
    .from(giftCards)
    .where(
      and(
        eq(giftCards.recipientId, user.id),
        eq(giftCards.status, 'active'),
        sql`${giftCards.expiresAt} > ${new Date()}`
      )
    );
  
  return result[0]?.total || 0;
}

export async function getGiftCardStats() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const allCards = await db
    .select()
    .from(giftCards)
    .where(
      or(
        eq(giftCards.senderId, user.id),
        eq(giftCards.recipientId, user.id)
      )
    );
  
  const sent = allCards.filter(c => c.senderId === user.id && c.recipientId !== user.id);
  const received = allCards.filter(c => c.recipientId === user.id && c.senderId !== user.id);
  const saved = allCards.filter(c => c.senderId === user.id && c.recipientId === user.id);
  
  const activeReceived = received.filter(c => 
    c.status === 'active' && c.expiresAt > new Date()
  );
  
  const totalBalance = activeReceived.reduce((sum, c) => sum + c.balance, 0);
  
  const expiredReceived = received.filter(c => 
    c.expiresAt < new Date() && c.status !== 'redeemed'
  );
  
  const redeemedReceived = received.filter(c => 
    c.status === 'redeemed' || c.balance === 0
  );
  
  return {
    totalCards: allCards.length,
    sentCount: sent.length,
    receivedCount: received.length,
    savedCount: saved.length,
    activeCount: activeReceived.length,
    totalBalance,
    expiredCount: expiredReceived.length,
    redeemedCount: redeemedReceived.length,
  };
}

export async function checkAndUpdateExpiredStatus(giftCardId: string) {
  const giftCard = await getGiftCardById(giftCardId);
  
  if (!giftCard) {
    return null;
  }
  
  const now = new Date();
  
  if (giftCard.expiresAt < now && giftCard.status === 'active') {
    await db
      .update(giftCards)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, giftCardId));
    
    revalidatePath(`/gift-cards/${giftCardId}`);
    revalidatePath('/gift-cards');
    
    return { ...giftCard, status: 'expired' };
  }
  
  return giftCard;
}

export async function markGiftCardAsOpened(giftCardId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: 'No autorizado' };
  }
  
  const giftCard = await getGiftCardById(giftCardId);
  
  if (!giftCard) {
    return { error: 'Gift card no encontrada' };
  }
  
  if (giftCard.recipientId !== user.id) {
    return { error: 'No autorizado' };
  }
  
  if (giftCard.openedAt) {
    return { success: true };
  }
  
  await db
    .update(giftCards)
    .set({
      openedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));
  
  revalidatePath(`/gift-cards/${giftCardId}`);
  revalidatePath('/gift-cards');
  
  return { success: true };
}

export async function transferGiftCard(giftCardId: string, recipientEmail: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: 'No autorizado' };
  }
  
  const giftCard = await getGiftCardById(giftCardId);
  
  if (!giftCard) {
    return { error: 'Gift card no encontrada' };
  }
  
  if (giftCard.recipientId !== user.id) {
    return { error: 'No autorizado' };
  }
  
  if (giftCard.expiresAt < new Date()) {
    return { error: 'La gift card está expirada' };
  }
  
  if (giftCard.balance === 0) {
    return { error: 'La gift card ya fue canjeada completamente' };
  }
  
  // Aquí deberías buscar el usuario por email
  // Por simplicidad, asumimos que el usuario existe
  
  await db
    .update(giftCards)
    .set({
      recipientEmail: recipientEmail,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));
  
  revalidatePath('/gift-cards');
  revalidatePath(`/gift-cards/${giftCardId}`);
  
  return { success: true };
}

export async function validateGiftCard(code: string) {
  if (!code) return { error: "Código no proporcionado" };

  const card = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.code, code.toUpperCase()))
    .get();

  if (!card) {
    return { error: "Tarjeta de regalo no válida" };
  }

  if (card.status !== "active") {
    return { error: `La tarjeta está ${card.status}` };
  }

  if (card.expiresAt < new Date()) {
    return { error: "La tarjeta de regalo ha expirado" };
  }

  if (card.balance <= 0) {
    return { error: "La tarjeta no tiene saldo disponible" };
  }

  return {
    success: true,
    card: {
      ...card,
      currentBalance: card.balance
    }
  };
}

export async function purchaseGiftCard(data: {
  amount: number;
  recipientEmail: string;
  recipientName: string;
  message?: string;
  templateId?: number;
  businessId: string;
  productId?: string;
  recipientId?: string;
  occasion?: string;
  cardImageUrl?: string;
  receiptUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const code = generateGiftCode();
  const qrHash = generateQrHash(code);
  const id = crypto.randomUUID();

  // Expiración en 1 año
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db.insert(giftCards).values({
    id,
    code,
    qrHash,
    amount: data.amount,
    balance: data.amount,
    expiresAt,
    status: 'active',
    senderId: user.id,
    recipientId: data.recipientId,
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName,
    businessId: data.businessId,
    productId: data.productId,
    message: data.message,
    templateId: data.templateId,
    occasion: data.occasion,
    cardImageUrl: data.cardImageUrl,
    receiptUrl: data.receiptUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/gift-cards');
  return { success: true, id };
}

export async function updateGiftCardRecipient(data: {
  giftCardId: string;
  recipientName: string;
  recipientEmail: string;
  recipientId?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  const giftCard = await getGiftCardById(data.giftCardId);
  if (!giftCard) return { error: 'Gift card no encontrada' };
  if (giftCard.senderId !== user.id) return { error: 'No autorizado' };

  await db
    .update(giftCards)
    .set({
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      recipientId: data.recipientId || null,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, data.giftCardId));

  revalidatePath('/gift-cards');
  revalidatePath(`/gift-cards/${data.giftCardId}`);
  
  return { success: true };
}

export async function saveGiftCardToWallet(giftCardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  await db
    .update(giftCards)
    .set({
      recipientId: user.id,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  revalidatePath('/gift-cards');
  return { success: true };
}

export async function searchGiftingProducts(query: string) {
  if (!query || query.length < 2) return [];

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      price: comercialConfig.precioVenta,
      imageUrls: products.imageUrls,
      storeId: products.storeId,
      storeName: stores.name,
    })
    .from(products)
    .innerJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .innerJoin(stores, eq(products.storeId, stores.id))
    .where(
      and(
        sql`${products.name} LIKE ${`%${query}%`}`,
        eq(comercialConfig.isPublished, true)
      )
    )
    .limit(10);
  
  return results;
}

export async function uploadGiftCardImage(base64Image: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  try {
    // Convert base64 to buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const result = await uploadImageFromBuffer(
      buffer, 
      `gift-card-${Date.now()}.png`, 
      'image/png', 
      'gift-cards'
    );

    return { success: true, url: result.url };
  } catch (error) {
    console.error('Error uploading gift card image:', error);
    return { error: 'Error al subir la imagen' };
  }
}

export async function uploadGiftCardReceipt(base64Image: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Attempt to guess extension from base64 (default png)
    const extension = base64Image.match(/^data:image\/(\w+);base64,/)?.[1] || 'png';
    
    const result = await uploadImageFromBuffer(
      buffer, 
      `receipt-${Date.now()}.${extension}`, 
      `image/${extension}`, 
      'receipts'
    );

    return { success: true, url: result.url };
  } catch (error) {
    console.error('Error uploading receipt image:', error);
    return { error: 'Error al subir el comprobante' };
  }
}