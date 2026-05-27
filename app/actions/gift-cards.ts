'use server';

import { db } from '@/db';
import { giftCards, products, stores, comercialConfig, users, giftCardRecharges, giftCardHistory, systemConfig } from '@/db/schema';
import { eq, or, desc, asc, and, sql, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import crypto from 'crypto';
import { uploadImageFromBuffer, deleteImage, extractKeyFromUrl } from '@/lib/cloudflare';
import { sendOneSignalNotification } from '@/lib/onesignal';

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
  // Generar código corto de 4 caracteres alfanuméricos
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos como I, O, 0, 1
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

function generateQrHash(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function addHistoryRecord(
  giftCardId: string,
  userId: string,
  action: 'sent' | 'received' | 'saved' | 'transferred' | 'redeemed' | 'recharge',
  description?: string,
  amount?: number
) {
  try {
    await db.insert(giftCardHistory).values({
      id: crypto.randomUUID(),
      giftCardId,
      userId,
      action,
      description: description || null,
      amount: amount || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error al registrar historial de gift card:', error);
  }
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

  const userRow = await db
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, user.id))
    .get();
  const directBalance = userRow?.balance ?? 0;

  const nowUnix = Math.floor(Date.now() / 1000);
  
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${giftCards.balance}), 0)`,
    })
    .from(giftCards)
    .where(
      and(
        eq(giftCards.recipientId, user.id),
        eq(giftCards.status, 'active'),
        sql`${giftCards.expiresAt} > ${nowUnix}`
      )
    );
  
  const cardsBalance = result[0]?.total ?? 0;
  return Number((directBalance + cardsBalance).toFixed(2));
}

export async function getGiftCardStats() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const userRow = await db
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, user.id))
    .get();
  const directBalance = userRow?.balance ?? 0;
  
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
  const activeSaved = saved.filter(c => 
    c.status === 'active' && c.expiresAt > new Date()
  );
  
  const cardsBalance = [...activeReceived, ...activeSaved].reduce((sum, c) => sum + c.balance, 0);
  const totalBalance = Number((directBalance + cardsBalance).toFixed(2));
  
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
    activeCount: activeReceived.length + activeSaved.length,
    totalBalance,
    expiredCount: expiredReceived.length,
    redeemedCount: redeemedReceived.length,
    directBalance,
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

  // Registrar transferencia en historial
  await addHistoryRecord(giftCardId, user.id, 'transferred', `Gift card transferida a ${recipientEmail}`, giftCard.balance);
  
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
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName: string;
  message?: string;
  templateId?: number;
  businessId: string;
  productId?: string;
  recipientId?: string;
  occasion?: string;
  cardImageUrl?: string;
  receiptUrl?: string;
  saveToWallet?: boolean;
  scheduledAt?: Date;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    return { error: 'Monto invalido' };
  }

  if (data.amount > 10000) {
    return { error: 'El monto maximo por Gift Card es Bs. 10.000' };
  }

  const availableBalance = await getTotalBalance();
  if (availableBalance < data.amount) {
    return { error: 'Saldo insuficiente para crear la Gift Card' };
  }

  // Generar código único verificando que no exista
  let code = generateGiftCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.code, code))
      .get();
    
    if (!existing) break;
    code = generateGiftCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    return { error: 'No se pudo generar un código único. Intenta nuevamente.' };
  }

  const qrHash = generateQrHash(code);
  const id = crypto.randomUUID();

  // Expiración en 1 año
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db.transaction(async (tx) => {
    await consumeGiftCardBalance(tx, user.id, data.amount);

    await tx.insert(giftCards).values({
      id,
      code,
      qrHash,
      amount: data.amount,
      balance: data.amount,
      expiresAt,
      status: 'active',
      senderId: user.id,
      recipientId: data.saveToWallet ? user.id : data.recipientId,
      recipientEmail: data.recipientEmail || null,
      recipientPhone: data.recipientPhone || null,
      recipientName: data.recipientName,
      businessId: data.businessId,
      productId: data.productId || null,
      message: data.message || null,
      templateId: data.templateId || null,
      occasion: data.occasion || null,
      cardImageUrl: data.cardImageUrl || null,
      receiptUrl: data.receiptUrl || null,
      scheduledAt: data.scheduledAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // Registrar en historial
  if (data.saveToWallet) {
    await addHistoryRecord(id, user.id, 'saved', `Gift card guardada en billetera`, data.amount);
  } else {
    await addHistoryRecord(id, user.id, 'sent', `Gift card enviada a ${data.recipientName || data.recipientEmail || 'usuario'}`, data.amount);
    if (data.recipientId) {
      await addHistoryRecord(id, data.recipientId, 'received', `Gift card recibida de ${user.name || 'usuario'}`, data.amount);
    }
  }

  revalidatePath('/gift-cards');
  return { success: true, id };
}

export async function requestGiftCardBalanceTopUp(data: {
  amount: number;
  receiptUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    return { error: 'Monto invalido' };
  }

  if (data.amount > 10000) {
    return { error: 'El monto maximo de carga es Bs. 10.000' };
  }

  // Generar código único verificando que no exista
  let code = generateGiftCode();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const existing = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.code, code))
      .get();
    
    if (!existing) break;
    code = generateGiftCode();
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    return { error: 'No se pudo generar un código único. Intenta nuevamente.' };
  }

  const qrHash = generateQrHash(code);
  const id = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db.insert(giftCards).values({
    id,
    code,
    qrHash,
    amount: data.amount,
    balance: data.amount,
    expiresAt,
    status: 'pending_payment',
    senderId: user.id,
    recipientId: user.id,
    recipientName: user.name || 'Mi saldo Gift Card',
    recipientEmail: '',
    businessId: 'SIGE-GLOBAL',
    message: 'Carga de saldo global Gift Card',
    receiptUrl: data.receiptUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Registrar solicitud de recarga en historial
  await addHistoryRecord(id, user.id, 'recharge', `Solicitud de recarga de crédito global`, data.amount);

  revalidatePath('/gift-cards');
  revalidatePath('/assistant/pagos-pendientes');
  return { success: true, id };
}

async function consumeGiftCardBalance(tx: any, userId: string, amount: number) {
  let remaining = amount;

  // 1. Consumir del saldo directo del usuario primero
  const userRow = await tx
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  const directBalance = userRow?.balance ?? 0;
  if (directBalance > 0) {
    const deduction = Math.min(directBalance, remaining);
    const nextBalance = Number((directBalance - deduction).toFixed(2));
    await tx
      .update(users)
      .set({ balance: nextBalance })
      .where(eq(users.id, userId));
    remaining = Number((remaining - deduction).toFixed(2));
  }

  if (remaining <= 0) return;

  // 2. Consumir de las Gift Cards activas
  const cards = await tx
    .select()
    .from(giftCards)
    .where(
      and(
        eq(giftCards.recipientId, userId),
        eq(giftCards.status, 'active'),
        gt(giftCards.balance, 0),
        sql`${giftCards.expiresAt} > ${new Date()}`
      )
    )
    .orderBy(asc(giftCards.expiresAt));

  for (const card of cards) {
    if (remaining <= 0) break;

    const deduction = Math.min(card.balance, remaining);
    const nextBalance = Number((card.balance - deduction).toFixed(2));

    await tx
      .update(giftCards)
      .set({
        balance: nextBalance,
        status: nextBalance <= 0 ? 'redeemed' : card.status,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, card.id));

    remaining = Number((remaining - deduction).toFixed(2));
  }
}

export async function updateGiftCardRecipient(data: {
  giftCardId: string;
  recipientName: string;
  recipientEmail?: string;
  recipientId?: string;
  recipientPhone?: string;
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
      recipientEmail: data.recipientEmail || null,
      recipientId: data.recipientId || null,
      recipientPhone: data.recipientPhone || null,
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

  const giftCard = await getGiftCardById(giftCardId);
  if (!giftCard) return { error: 'Gift card no encontrada' };

  await db
    .update(giftCards)
    .set({
      recipientId: user.id,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  // Registrar guardado en historial
  await addHistoryRecord(giftCardId, user.id, 'saved', `Gift card guardada en billetera`, giftCard.balance);

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

export async function deleteGiftCard(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  try {
    const card = await getGiftCardById(id);
    if (!card) return { error: 'Tarjeta no encontrada' };

    // Verificar permisos: solo el creador o el destinatario pueden borrarla
    if (card.senderId !== user.id && card.recipientId !== user.id) {
      return { error: 'No tienes permiso para eliminar esta tarjeta' };
    }

    // Verificar condición: solo se puede borrar si el saldo es 0 o está vencida
    const isExpired = new Date(card.expiresAt) < new Date();
    if (card.balance > 0 && !isExpired) {
      return { error: 'No puedes eliminar una tarjeta activa que aún tiene saldo' };
    }

    // Intentar eliminar las imágenes asociadas en Cloudflare R2
    if (card.cardImageUrl) {
      const imageKey = extractKeyFromUrl(card.cardImageUrl);
      if (imageKey) {
        await deleteImage(imageKey).catch(e => console.error("Error al borrar imagen de R2:", e));
      }
    }

    if (card.receiptUrl) {
      const receiptKey = extractKeyFromUrl(card.receiptUrl);
      if (receiptKey) {
        await deleteImage(receiptKey).catch(e => console.error("Error al borrar comprobante de R2:", e));
      }
    }

    // Eliminar el registro de la base de datos
    await db.delete(giftCards).where(eq(giftCards.id, id));

    revalidatePath('/gift-cards');
    return { success: true };
  } catch (error) {
    console.error('Error deleting gift card:', error);
    return { error: 'Error interno al intentar eliminar la tarjeta' };
  }
}

export async function deleteAllHistoryCards() {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  try {
    // Obtener todas las tarjetas del usuario que están en el historial
    const allCards = await db
      .select()
      .from(giftCards)
      .where(
        or(
          eq(giftCards.senderId, user.id),
          eq(giftCards.recipientId, user.id)
        )
      )
      .all();

    const now = new Date();
    const historyCards = allCards.filter(card => {
      const isExpired = new Date(card.expiresAt) < now;
      const isInactive = card.status !== 'active' || card.balance === 0;
      return isExpired || isInactive;
    });

    if (historyCards.length === 0) {
      return { error: 'No hay tarjetas en el historial para eliminar' };
    }

    // Eliminar imágenes y tarjetas
    for (const card of historyCards) {
      if (card.cardImageUrl) {
        const imageKey = extractKeyFromUrl(card.cardImageUrl);
        if (imageKey) {
          await deleteImage(imageKey).catch(e => console.error("Error al borrar imagen de R2:", e));
        }
      }

      if (card.receiptUrl) {
        const receiptKey = extractKeyFromUrl(card.receiptUrl);
        if (receiptKey) {
          await deleteImage(receiptKey).catch(e => console.error("Error al borrar comprobante de R2:", e));
        }
      }

      await db.delete(giftCards).where(eq(giftCards.id, card.id));
    }

    revalidatePath('/gift-cards');
    return { success: true, deletedCount: historyCards.length };
  } catch (error) {
    console.error('Error deleting all history cards:', error);
    return { error: 'Error interno al intentar eliminar las tarjetas' };
  }
}

// ============================================
// VERIFICACIÓN DE GIFT CARDS (ASISTENTE)
// ============================================

export async function getPendingGiftCards() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || (sessionUser.role !== "assistant" && sessionUser.role !== "superadmin")) {
    return [];
  }

  const pendingCards = await db
    .select({
      giftCard: giftCards,
      senderName: users.name,
      senderEmail: users.email,
    })
    .from(giftCards)
    .leftJoin(users, eq(giftCards.senderId, users.id))
    .where(eq(giftCards.status, "pending_payment"))
    .orderBy(desc(giftCards.createdAt))
    .all();

  return pendingCards.map(record => ({
    ...record.giftCard,
    senderName: record.senderName || "Usuario Desconocido",
    senderEmail: record.senderEmail || "Sin email",
  }));
}

export async function verifyGiftCardPayment(giftCardId: string, action: "approve" | "reject", notes?: string) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || (sessionUser.role !== "assistant" && sessionUser.role !== "superadmin")) {
    return { error: "No autorizado" };
  }

  const giftCard = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.id, giftCardId))
    .get();

  if (!giftCard) {
    return { error: "Gift Card no encontrada" };
  }

  if (giftCard.status !== "pending_payment") {
    return { error: "Esta Gift Card ya fue procesada" };
  }

  const newStatus = action === "approve" ? "active" : "cancelled";

  await db
    .update(giftCards)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  // Si se aprueba, enviar la notificación pendiente
  if (action === "approve" && giftCard.recipientId) {
    // Obtener info del remitente para el mensaje
    const sender = await db.select().from(users).where(eq(users.id, giftCard.senderId)).get();
    const senderName = sender?.name || "Alguien";

    await sendOneSignalNotification({
      userIds: [giftCard.recipientId],
      title: "¡Has recibido un regalo! 🎁",
      message: `${senderName} te ha enviado una Gift Card de Bs. ${giftCard.amount.toFixed(2)}.`,
      url: `/gift-cards/${giftCardId}`
    });

    const { createNotification } = await import('./notifications');
    await createNotification({
      userId: giftCard.recipientId,
      title: "¡Has recibido un regalo! 🎁",
      message: `${senderName} te ha enviado una Gift Card de Bs. ${giftCard.amount.toFixed(2)}.`,
      type: 'gift_card',
      link: `/gift-cards/${giftCardId}`
    });
  }

  revalidatePath("/assistant/pagos-pendientes");
  revalidatePath("/assistant");
  revalidatePath("/gift-cards");

  return {
    success: true,
    message: action === "approve" ? "Gift Card activada correctamente" : "Pago de Gift Card rechazado",
  };
}

// ============================================
// RECARGAS DE SALDO GLOBAL
// ============================================

export async function getUserActiveRecharge() {
  const user = await getCurrentUser();
  if (!user) return null;

  const active = await db
    .select()
    .from(giftCardRecharges)
    .where(
      and(
        eq(giftCardRecharges.userId, user.id),
        or(
          eq(giftCardRecharges.status, 'pending'),
          eq(giftCardRecharges.status, 'pending_operator'),
          eq(giftCardRecharges.status, 'rejected')
        )
      )
    )
    .orderBy(desc(giftCardRecharges.createdAt))
    .limit(1)
    .all();

  return active[0] || null;
}

export async function createRechargeRequest(data: {
  amount: number;
  paymentMethod: string;
  transactionNumber?: string;
  receiptUrl?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  if (data.amount <= 0 && data.paymentMethod !== 'operator') {
    return { error: 'Monto inválido' };
  }

  const existing = await getUserActiveRecharge();
  if (existing && (existing.status === 'pending' || existing.status === 'pending_operator')) {
    return { error: 'Ya tienes una solicitud en verificación' };
  }

  const id = crypto.randomUUID();
  const status = data.paymentMethod === 'operator' ? 'pending_operator' : 'pending';

  await db.insert(giftCardRecharges).values({
    id,
    userId: user.id,
    amount: data.amount || 0,
    paymentMethod: data.paymentMethod,
    transactionNumber: data.transactionNumber || null,
    receiptUrl: data.receiptUrl || null,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/gift-cards');
  return { success: true, id };
}

export async function getPendingRecharges() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "assistant" && user.role !== "superadmin")) {
    return [];
  }

  const recharges = await db
    .select({
      recharge: giftCardRecharges,
      userName: users.name,
      userEmail: users.email,
    })
    .from(giftCardRecharges)
    .leftJoin(users, eq(giftCardRecharges.userId, users.id))
    .where(
      or(
        eq(giftCardRecharges.status, 'pending'),
        eq(giftCardRecharges.status, 'pending_operator')
      )
    )
    .orderBy(desc(giftCardRecharges.createdAt))
    .all();

  return recharges.map(r => ({
    ...r.recharge,
    userName: r.userName || "Usuario Desconocido",
    userEmail: r.userEmail || "Sin email",
  }));
}

export async function verifyRechargeRequest(
  rechargeId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || (sessionUser.role !== "assistant" && sessionUser.role !== "superadmin")) {
    return { error: "No autorizado" };
  }

  const recharge = await db
    .select()
    .from(giftCardRecharges)
    .where(eq(giftCardRecharges.id, rechargeId))
    .get();

  if (!recharge) {
    return { error: "Solicitud no encontrada" };
  }

  if (recharge.status === 'approved' || recharge.status === 'rejected') {
    return { error: "Esta solicitud ya fue procesada" };
  }

  if (action === 'approve') {
    await db.transaction(async (tx) => {
      // 1. Obtener y actualizar el saldo del usuario directamente
      const targetUser = await tx.select().from(users).where(eq(users.id, recharge.userId)).get();
      const currentBalance = targetUser?.balance ?? 0;
      const nextBalance = Number((currentBalance + recharge.amount).toFixed(2));

      await tx
        .update(users)
        .set({
          balance: nextBalance,
        })
        .where(eq(users.id, recharge.userId));

      // 2. Marcar la solicitud como aprobada
      await tx
        .update(giftCardRecharges)
        .set({
          status: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(giftCardRecharges.id, rechargeId));
    });

    revalidatePath('/gift-cards');
    revalidatePath('/assistant/gift-cards');

    // Notificar al usuario que su recarga fue aprobada
    await sendOneSignalNotification({
      userIds: [recharge.userId],
      title: '¡Recarga aprobada! 💳',
      message: `Tu recarga de Bs. ${recharge.amount.toFixed(2)} fue verificada y acreditada a tu billetera.`,
      url: '/gift-cards'
    });

    const { createNotification } = await import('./notifications');
    await createNotification({
      userId: recharge.userId,
      title: '¡Recarga aprobada! 💳',
      message: `Tu recarga de Bs. ${recharge.amount.toFixed(2)} fue verificada y acreditada a tu billetera Gift Card.`,
      type: 'gift_card',
      link: '/gift-cards'
    });

    return { success: true, message: "Recarga aprobada y saldo acreditado con éxito" };
  } else {
    await db
      .update(giftCardRecharges)
      .set({
        status: 'rejected',
        rejectionReason: rejectionReason || "Pago no verificado",
        updatedAt: new Date(),
      })
      .where(eq(giftCardRecharges.id, rechargeId));

    revalidatePath('/gift-cards');
    revalidatePath('/assistant/gift-cards');

    // Notificar al usuario que su recarga fue rechazada
    const { createNotification } = await import('./notifications');
    await createNotification({
      userId: recharge.userId,
      title: 'Recarga rechazada ❌',
      message: `Tu solicitud de recarga de Bs. ${recharge.amount?.toFixed(2) ?? '0.00'} fue rechazada. Revisa el motivo en tu billetera.`,
      type: 'gift_card',
      link: '/gift-cards'
    });

    return { success: true, message: "Recarga rechazada correctamente" };
  }
}

export async function updateOperatorRecharge(
  rechargeId: string,
  amount: number,
  transactionNumber: string,
  receiptUrl: string
) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || (sessionUser.role !== "assistant" && sessionUser.role !== "superadmin")) {
    return { error: "No autorizado" };
  }

  const recharge = await db
    .select()
    .from(giftCardRecharges)
    .where(eq(giftCardRecharges.id, rechargeId))
    .get();

  if (!recharge) {
    return { error: "Solicitud no encontrada" };
  }

  if (recharge.status !== 'pending_operator') {
    return { error: "Esta solicitud no es de tipo operador o ya fue procesada" };
  }

  await db
    .update(giftCardRecharges)
    .set({
      amount,
      transactionNumber,
      receiptUrl,
      updatedAt: new Date(),
    })
    .where(eq(giftCardRecharges.id, rechargeId));

  return verifyRechargeRequest(rechargeId, 'approve');
}

export async function dismissRechargeRequest(rechargeId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  await db
    .delete(giftCardRecharges)
    .where(
      and(
        eq(giftCardRecharges.id, rechargeId),
        eq(giftCardRecharges.userId, user.id)
      )
    );

  revalidatePath('/gift-cards');
  return { success: true };
}

export async function getPaymentSettings() {
  const configs = await db
    .select()
    .from(systemConfig)
    .where(
      or(
        eq(systemConfig.key, 'payment_qr_url'),
        eq(systemConfig.key, 'payment_bank_details'),
        eq(systemConfig.key, 'payment_tigo_money')
      )
    )
    .all();

  return {
    qrUrl: configs.find(c => c.key === 'payment_qr_url')?.value || '',
    bankDetails: configs.find(c => c.key === 'payment_bank_details')?.value || '',
    tigoMoney: configs.find(c => c.key === 'payment_tigo_money')?.value || '',
  };
}

export async function updatePaymentSettings(data: {
  qrUrl: string;
  bankDetails: string;
  tigoMoney: string;
}) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || (sessionUser.role !== "assistant" && sessionUser.role !== "superadmin")) {
    return { error: "No autorizado" };
  }

  const updates = [
    { key: 'payment_qr_url', value: data.qrUrl },
    { key: 'payment_bank_details', value: data.bankDetails },
    { key: 'payment_tigo_money', value: data.tigoMoney },
  ];

  for (const update of updates) {
    await db
      .insert(systemConfig)
      .values(update)
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value: update.value, updatedAt: new Date() }
      });
  }

  return { success: true };
}

// ============================================
// HISTORIAL DE GIFT CARDS
// ============================================

export async function getGiftCardHistory(giftCardId?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (giftCardId) {
    // Si se especifica una gift card, filtrar por esa
    const history = await db
      .select({
        id: giftCardHistory.id,
        giftCardId: giftCardHistory.giftCardId,
        action: giftCardHistory.action,
        description: giftCardHistory.description,
        amount: giftCardHistory.amount,
        createdAt: giftCardHistory.createdAt,
        giftCard: giftCards,
      })
      .from(giftCardHistory)
      .leftJoin(giftCards, eq(giftCardHistory.giftCardId, giftCards.id))
      .where(eq(giftCardHistory.giftCardId, giftCardId))
      .orderBy(desc(giftCardHistory.createdAt))
      .all();
    
    return history;
  } else {
    // Si no, traer el historial del usuario
    const history = await db
      .select({
        id: giftCardHistory.id,
        giftCardId: giftCardHistory.giftCardId,
        action: giftCardHistory.action,
        description: giftCardHistory.description,
        amount: giftCardHistory.amount,
        createdAt: giftCardHistory.createdAt,
        giftCard: giftCards,
      })
      .from(giftCardHistory)
      .leftJoin(giftCards, eq(giftCardHistory.giftCardId, giftCards.id))
      .where(eq(giftCardHistory.userId, user.id))
      .orderBy(desc(giftCardHistory.createdAt))
      .all();

    return history;
  }
}

export async function getGiftCardHistoryByAction(action: 'sent' | 'received' | 'saved' | 'transferred' | 'redeemed' | 'recharge') {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const history = await db
    .select({
      id: giftCardHistory.id,
      giftCardId: giftCardHistory.giftCardId,
      action: giftCardHistory.action,
      description: giftCardHistory.description,
      amount: giftCardHistory.amount,
      createdAt: giftCardHistory.createdAt,
      giftCard: giftCards,
    })
    .from(giftCardHistory)
    .leftJoin(giftCards, eq(giftCardHistory.giftCardId, giftCards.id))
    .where(
      and(
        eq(giftCardHistory.userId, user.id),
        eq(giftCardHistory.action, action)
      )
    )
    .orderBy(desc(giftCardHistory.createdAt))
    .all();

  return history;
}

