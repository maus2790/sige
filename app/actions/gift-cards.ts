'use server';

import { db } from '@/db';
import { giftCards, products, stores, comercialConfig, users, giftCardRecharges, giftCardHistory, systemConfig, storeGiftCardTemplates, storeGiftCardPaymentSettings } from '@/db/schema';
import { eq, or, desc, asc, and, sql, gt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import crypto from 'crypto';
import { uploadImageFromBuffer, deleteImage, extractKeyFromUrl } from '@/lib/cloudflare';
import { sendOneSignalNotification } from '@/lib/onesignal';
import { generateSecureGiftCardCode, hashGiftCardCode } from '@/lib/gift-card-code';

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
    .select({
      id: giftCards.id,
      code: giftCards.code,
      qrHash: giftCards.qrHash,
      amount: giftCards.amount,
      balance: giftCards.balance,
      expiresAt: giftCards.expiresAt,
      status: giftCards.status,
      senderId: giftCards.senderId,
      senderName: users.name,
      recipientId: giftCards.recipientId,
      recipientEmail: giftCards.recipientEmail,
      recipientPhone: giftCards.recipientPhone,
      recipientName: giftCards.recipientName,
      businessId: giftCards.businessId,
      storeGiftCardTemplateId: giftCards.storeGiftCardTemplateId,
      productId: giftCards.productId,
      message: giftCards.message,
      templateId: giftCards.templateId,
      occasion: giftCards.occasion,
      customImageUrl: giftCards.customImageUrl,
      cardImageUrl: giftCards.cardImageUrl,
      receiptUrl: giftCards.receiptUrl,
      paymentMethod: giftCards.paymentMethod,
      transactionNumber: giftCards.transactionNumber,
      rejectionReason: giftCards.rejectionReason,
      verifiedBy: giftCards.verifiedBy,
      verifiedAt: giftCards.verifiedAt,
      scheduledAt: giftCards.scheduledAt,
      deliveredAt: giftCards.deliveredAt,
      openedAt: giftCards.openedAt,
      customStyle: giftCards.customStyle,
      createdAt: giftCards.createdAt,
      updatedAt: giftCards.updatedAt,
    })
    .from(giftCards)
    .leftJoin(users, eq(giftCards.senderId, users.id))
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
  
  return { sent, received, saved, mine: saved, all: userGiftCards };
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
  amount?: number;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName: string;
  message?: string;
  templateId?: number;
  businessId?: string;
  productId?: string;
  recipientId?: string;
  occasion?: string;
  cardImageUrl?: string;
  receiptUrl?: string;
  saveToWallet?: boolean;
  scheduledAt?: Date;
  storeGiftCardTemplateId?: string;
  paymentMethod?: string;
  transactionNumber?: string;
  customStyle?: string;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  let amount = data.amount || 0;
  let businessId = data.businessId || 'SIGE-GLOBAL';
  let status = 'active';

  if (data.storeGiftCardTemplateId) {
    const template = await db
      .select({
        amount: storeGiftCardTemplates.amount,
        storeId: storeGiftCardTemplates.storeId,
        giftCardsEnabled: stores.giftCardsEnabled,
        isActive: storeGiftCardTemplates.isActive,
      })
      .from(storeGiftCardTemplates)
      .innerJoin(stores, eq(storeGiftCardTemplates.storeId, stores.id))
      .where(eq(storeGiftCardTemplates.id, data.storeGiftCardTemplateId))
      .get();
    if (!template) return { error: 'Template no encontrado' };
    if (!template.isActive) return { error: 'Esta Gift Card ya no esta disponible' };
    if (!template.giftCardsEnabled) return { error: 'La tienda no tiene Gift Cards habilitadas' };

    const reserved = await db
      .select({ id: giftCards.id })
      .from(giftCards)
      .where(
        and(
          eq(giftCards.storeGiftCardTemplateId, data.storeGiftCardTemplateId),
          sql`${giftCards.status} != 'cancelled'`
        )
      )
      .get();
    if (reserved) return { error: 'Esta Gift Card ya fue tomada por otro cliente' };

    amount = template.amount;
    businessId = template.storeId;
    status = 'pending_payment';
  } else {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: 'Monto invalido' };
    }
    if (amount > 10000) {
      return { error: 'El monto maximo por Gift Card es Bs. 10.000' };
    }
    if (businessId === 'SIGE-GLOBAL') {
      const availableBalance = await getTotalBalance();
      if (availableBalance < amount) {
        return { error: 'Saldo insuficiente para crear la Gift Card' };
      }
    } else {
      const store = await db
        .select({ id: stores.id, giftCardsEnabled: stores.giftCardsEnabled })
        .from(stores)
        .where(eq(stores.id, businessId))
        .get();
      if (!store) return { error: 'Tienda no encontrada' };
      if (!store.giftCardsEnabled) return { error: 'La tienda no tiene Gift Cards habilitadas' };

      const settings = await db
        .select({ maxAmount: storeGiftCardPaymentSettings.maxAmount })
        .from(storeGiftCardPaymentSettings)
        .where(eq(storeGiftCardPaymentSettings.storeId, businessId))
        .get();
      const maxLimit = settings?.maxAmount ?? 5000;
      if (amount > maxLimit) return { error: `El monto maximo por Gift Card es Bs. ${maxLimit.toLocaleString()}` };
      status = 'pending_payment';
    }
  }

  // Generar código único de forma segura
  const code = status === 'pending_payment' ? null : await generateUniqueGiftCardCode();
  const qrHash = code ? hashGiftCardCode(code) : null;
  const id = crypto.randomUUID();

  // Expiración en 1 año
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await db.transaction(async (tx) => {
    if (!data.storeGiftCardTemplateId && businessId === 'SIGE-GLOBAL') {
      await consumeGiftCardBalance(tx, user.id, amount);
    }

    await tx.insert(giftCards).values({
      id,
      code,
      qrHash,
      amount,
      balance: amount,
      expiresAt,
      status,
      senderId: user.id,
      recipientId: data.saveToWallet ? user.id : data.recipientId,
      recipientEmail: data.recipientEmail || null,
      recipientPhone: data.recipientPhone || null,
      recipientName: data.recipientName,
      businessId,
      productId: data.productId || null,
      message: data.message || null,
      templateId: data.templateId || null,
      occasion: data.occasion || null,
      cardImageUrl: data.cardImageUrl || null,
      receiptUrl: data.receiptUrl || null,
      paymentMethod: data.paymentMethod || null,
      transactionNumber: data.transactionNumber || null,
      storeGiftCardTemplateId: data.storeGiftCardTemplateId || null,
      scheduledAt: data.scheduledAt || null,
      customStyle: data.customStyle || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // Registrar en historial solo si la tarjeta ya está activa
  // Si está pending_payment, el historial se crea cuando el vendedor la active
  if (status !== 'pending_payment') {
    if (data.saveToWallet) {
      await addHistoryRecord(id, user.id, 'saved', `Gift card guardada en billetera`, data.amount);
    } else {
      await addHistoryRecord(id, user.id, 'sent', `Gift card enviada a ${data.recipientName || data.recipientEmail || 'usuario'}`, data.amount);
      if (data.recipientId) {
        await addHistoryRecord(id, data.recipientId, 'received', `Gift card recibida de ${user.name || 'usuario'}`, data.amount);
      }
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

  // Generar código único de forma segura
  const code = await generateUniqueGiftCardCode();
  const qrHash = hashGiftCardCode(code);
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
  if (giftCard.senderId !== user.id && giftCard.recipientId !== user.id) {
    return { error: 'No autorizado' };
  }

  const updates: any = {
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail || null,
    recipientId: data.recipientId || null,
    recipientPhone: data.recipientPhone || null,
    updatedAt: new Date(),
  };

  // Si el destinatario decide regalarla, se convierte en el nuevo remitente
  const isRegifting = giftCard.recipientId === user.id;
  if (isRegifting) {
    updates.senderId = user.id;
  }

  if (giftCard.status === 'active' && giftCard.code) {
    const store = await db
      .select({ name: stores.name })
      .from(stores)
      .where(eq(stores.id, giftCard.businessId))
      .get();
    const nextCard = {
      ...giftCard,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail || null,
      recipientId: data.recipientId || null,
      recipientPhone: data.recipientPhone || null,
    };
    const imageBuffer = await renderGiftCardImageBuffer(nextCard, giftCard.code, store?.name || 'Tienda');
    const upload = await uploadImageFromBuffer(imageBuffer, `gift-card-${data.giftCardId}.png`, 'image/png', 'gift-cards');
    if (giftCard.cardImageUrl) {
      const key = extractKeyFromUrl(giftCard.cardImageUrl);
      if (key) await deleteImage(key).catch((error) => console.error('Error deleting old gift card image:', error));
    }
    updates.cardImageUrl = upload.url;
  }

  await db
    .update(giftCards)
    .set(updates)
    .where(eq(giftCards.id, data.giftCardId));

  // Registrar historial del re-regalo
  if (isRegifting) {
    await addHistoryRecord(
      data.giftCardId,
      user.id,
      'sent',
      `Gift card regalada a ${data.recipientName || data.recipientEmail || 'usuario'}`,
      giftCard.balance
    );
    if (data.recipientId) {
      await addHistoryRecord(
        data.giftCardId,
        data.recipientId,
        'received',
        `Gift card recibida de ${user.name}`,
        giftCard.balance
      );
    }
  }

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

  // Si se aprueba, registrar historial y enviar notificación
  if (action === "approve") {
    // Obtener info del remitente para el mensaje
    const sender = await db.select().from(users).where(eq(users.id, giftCard.senderId)).get();
    const senderName = sender?.name || "Alguien";

    // Registrar historial ahora que la tarjeta está activa
    const isSavedToWallet = giftCard.senderId === giftCard.recipientId;
    if (isSavedToWallet) {
      await addHistoryRecord(giftCardId, giftCard.senderId, 'saved', `Gift card guardada en billetera`, giftCard.amount);
    } else {
      await addHistoryRecord(giftCardId, giftCard.senderId, 'sent', `Gift card enviada a ${giftCard.recipientName || giftCard.recipientEmail || 'usuario'}`, giftCard.amount);
      if (giftCard.recipientId) {
        await addHistoryRecord(giftCardId, giftCard.recipientId, 'received', `Gift card recibida de ${senderName}`, giftCard.amount);
      }
    }

    if (giftCard.recipientId) {
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

export async function getStoreGiftCardPaymentSettings(storeId: string) {
  const settings = await db
    .select()
    .from(storeGiftCardPaymentSettings)
    .where(eq(storeGiftCardPaymentSettings.storeId, storeId))
    .get();

  return settings || null;
}

export async function getMyStoreGiftCardData() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const store = await getOwnedStoreForUser(user.id);
  if (!store) {
    return {
      store: null,
      templates: [],
      availableTemplates: [],
      activeCards: [],
      inactiveCards: [],
      settings: null,
      giftCardsEnabled: true,
      pending: [],
    };
  }

  const [templates, settings, pendingRows, issuedCards] = await Promise.all([
    db
      .select()
      .from(storeGiftCardTemplates)
      .where(eq(storeGiftCardTemplates.storeId, store.id))
      .orderBy(desc(storeGiftCardTemplates.createdAt))
      .all(),
    db
      .select()
      .from(storeGiftCardPaymentSettings)
      .where(eq(storeGiftCardPaymentSettings.storeId, store.id))
      .get(),
    db
      .select({
        giftCard: giftCards,
        senderName: users.name,
        senderEmail: users.email,
      })
      .from(giftCards)
      .leftJoin(users, eq(giftCards.senderId, users.id))
      .where(and(eq(giftCards.businessId, store.id), eq(giftCards.status, 'pending_payment')))
      .orderBy(desc(giftCards.createdAt))
      .all(),
    db
      .select()
      .from(giftCards)
      .where(eq(giftCards.businessId, store.id))
      .orderBy(desc(giftCards.createdAt))
      .all(),
  ]);

  const activeCards = issuedCards
    .filter((card) => card.status === 'active' && card.balance > 1)
    .sort((a, b) => b.balance - a.balance);
  const inactiveCards = issuedCards.filter((card) => card.status !== 'active' || card.balance <= 1);
  const reservedTemplateIds = new Set(
    issuedCards
      .filter((card) => card.storeGiftCardTemplateId && card.status !== 'cancelled')
      .map((card) => card.storeGiftCardTemplateId)
  );
  const availableTemplates = templates.filter((template) => template.isActive && !reservedTemplateIds.has(template.id));

  return {
    store,
    templates,
    availableTemplates,
    activeCards,
    inactiveCards,
    settings: settings || null,
    giftCardsEnabled: (store.giftCardsEnabled ?? true) as boolean,
    pending: pendingRows.map((row) => ({
      ...row.giftCard,
      senderName: row.senderName || 'Usuario desconocido',
      senderEmail: row.senderEmail || 'Sin email',
    })),
  };
}

export async function upsertStoreGiftCardTemplate(data: {
  id?: string;
  storeId: string;
  name: string;
  amount: number;
  description?: string;
  designId?: number;
  occasion?: string;
  isActive?: boolean;
  customStyle?: string;
}) {
  const auth = await ensureStoreOwner(data.storeId);
  if ('error' in auth) return auth;

  if (!data.name.trim()) return { error: 'El nombre es obligatorio' };
  if (!Number.isFinite(data.amount) || data.amount <= 0) return { error: 'Monto invalido' };

  const settings = await db
    .select({ maxAmount: storeGiftCardPaymentSettings.maxAmount })
    .from(storeGiftCardPaymentSettings)
    .where(eq(storeGiftCardPaymentSettings.storeId, data.storeId))
    .get();
  const maxLimit = settings?.maxAmount ?? 5000;
  if (data.amount > maxLimit) return { error: `El monto maximo por Gift Card es Bs. ${maxLimit.toLocaleString()}` };

  const now = new Date();
  const isActive = data.isActive ?? true;
  const payload = {
    storeId: data.storeId,
    name: data.name.trim(),
    amount: Number(data.amount.toFixed(2)),
    description: data.description?.trim() || null,
    designId: data.designId || 1,
    occasion: data.occasion || null,
    isActive,
    customStyle: data.customStyle || null,
    updatedAt: now,
  };

  if (data.id) {
    const existing = await db
      .select()
      .from(storeGiftCardTemplates)
      .where(and(eq(storeGiftCardTemplates.id, data.id), eq(storeGiftCardTemplates.storeId, data.storeId)))
      .get();

    if (!existing) return { error: 'Gift Card de tienda no encontrada' };

    await db
      .update(storeGiftCardTemplates)
      .set({ ...payload, code: null })
      .where(eq(storeGiftCardTemplates.id, data.id));
  } else {
    const id = crypto.randomUUID();
    await db.insert(storeGiftCardTemplates).values({
      id,
      ...payload,
      code: null,
      createdAt: now,
    });
    revalidatePath('/dashboard/gift-cards');
    revalidatePath(`/tienda/${data.storeId}`);
    revalidatePath('/gift-cards/buy');
    return { success: true, id };
  }

  revalidatePath('/dashboard/gift-cards');
  revalidatePath(`/tienda/${data.storeId}`);
  revalidatePath('/gift-cards/buy');
  return { success: true, id: data.id };
}

export async function toggleStoreGiftCardTemplate(templateId: string, isActive: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  const store = await getOwnedStoreForUser(user.id);
  if (!store) return { error: 'Tienda no encontrada' };

  await db
    .update(storeGiftCardTemplates)
    .set({
      isActive,
      code: null,
      updatedAt: new Date(),
    })
    .where(and(eq(storeGiftCardTemplates.id, templateId), eq(storeGiftCardTemplates.storeId, store.id)));

  revalidatePath('/dashboard/gift-cards');
  revalidatePath(`/tienda/${store.id}`);
  revalidatePath('/gift-cards/buy');
  return { success: true };
}

export async function updateStoreGiftCardPaymentSettings(data: {
  storeId: string;
  qrUrl?: string;
  bankDetails?: string;
  tigoMoney?: string;
  operatorPhone?: string;
  maxAmount?: number;
}) {
  const auth = await ensureStoreOwner(data.storeId);
  if ('error' in auth) return auth;

  const now = new Date();
  const existing = await db
    .select()
    .from(storeGiftCardPaymentSettings)
    .where(eq(storeGiftCardPaymentSettings.storeId, data.storeId))
    .get();

  const values = {
    storeId: data.storeId,
    qrUrl: data.qrUrl?.trim() || null,
    bankDetails: data.bankDetails?.trim() || null,
    tigoMoney: data.tigoMoney?.trim() || null,
    operatorPhone: data.operatorPhone?.trim() || null,
    maxAmount: data.maxAmount !== undefined ? Number(data.maxAmount) : 5000,
    updatedAt: now,
  };

  if (existing) {
    await db
      .update(storeGiftCardPaymentSettings)
      .set(values)
      .where(eq(storeGiftCardPaymentSettings.storeId, data.storeId));
  } else {
    await db.insert(storeGiftCardPaymentSettings).values({
      id: crypto.randomUUID(),
      ...values,
      createdAt: now,
    });
  }

  revalidatePath('/dashboard/gift-cards');
  revalidatePath('/gift-cards/buy');
  return { success: true };
}

const SERVER_GIFT_CARD_GRADIENTS: Record<number, string[]> = {
  1: ['#2563eb', '#1d4ed8', '#312e81'],
  2: ['#fde047', '#f59e0b', '#c2410c'],
  3: ['#09090b', '#164e63', '#0891b2'],
  4: ['#fb7185', '#db2777', '#701a75'],
  5: ['#6ee7b7', '#059669', '#052e16'],
  6: ['#c4b5fd', '#7e22ce', '#312e81'],
  7: ['#7dd3fc', '#2563eb', '#172554'],
  8: ['#fdba74', '#ef4444', '#9f1239'],
  9: ['#a5f3fc', '#06b6d4', '#115e59'],
  10: ['#f87171', '#be123c', '#1c1917'],
};

function escapeSvgText(value?: string | null) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderGiftCardImageBuffer(card: typeof giftCards.$inferSelect, code: string, storeName: string) {
  const sharp = (await import('sharp')).default;
  const colors = SERVER_GIFT_CARD_GRADIENTS[card.templateId || 1] || SERVER_GIFT_CARD_GRADIENTS[1];
  const width = 1200;
  const height = 740;
  const recipient = escapeSvgText(card.recipientName || '________');
  const message = escapeSvgText(card.message || '');
  const occasion = escapeSvgText(card.occasion || 'Gift Card');
  const store = escapeSvgText(storeName);
  const amount = Number(card.amount || 0).toFixed(2);

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          ${colors.map((color, index) => `<stop offset="${(index / (colors.length - 1)) * 100}%" stop-color="${color}" />`).join('')}
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.24"/>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" rx="64" fill="url(#bg)" filter="url(#shadow)" />
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="64" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <circle cx="1020" cy="120" r="180" fill="rgba(255,255,255,0.10)" />
      <text x="70" y="96" font-family="Arial, sans-serif" font-size="24" font-weight="900" letter-spacing="6" fill="rgba(255,255,255,0.72)">${store}</text>
      <text x="70" y="175" font-family="Arial, sans-serif" font-size="32" font-weight="900" letter-spacing="4" fill="rgba(255,255,255,0.72)">PARA</text>
      <text x="70" y="246" font-family="Arial, sans-serif" font-size="66" font-weight="900" fill="#ffffff">${recipient}</text>
      <text x="70" y="300" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="rgba(255,255,255,0.76)">${occasion}</text>
      ${message ? `<rect x="70" y="370" width="1060" height="96" rx="28" fill="rgba(0,0,0,0.16)" stroke="rgba(255,255,255,0.10)" /><text x="600" y="428" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-style="italic" fill="#ffffff">${message.slice(0, 60)}</text>` : ''}
      <line x1="70" y1="560" x2="1130" y2="560" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      <text x="70" y="620" font-family="Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="5" fill="rgba(255,255,255,0.62)">CODIGO</text>
      <text x="70" y="672" font-family="Courier New, monospace" font-size="34" font-weight="900" letter-spacing="4" fill="#ffffff">${escapeSvgText(code)}</text>
      <text x="1130" y="672" text-anchor="end" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="#ffffff">Bs. ${amount}</text>
    </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function verifyStoreGiftCardPayment(
  giftCardId: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  const store = await getOwnedStoreForUser(user.id);
  if (!store && user.role !== 'superadmin') {
    return { error: 'Tienda no encontrada' };
  }

  const card = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.id, giftCardId))
    .get();

  if (!card) return { error: 'Gift Card no encontrada' };
  if (store && card.businessId !== store.id) return { error: 'No autorizado para esta tienda' };
  if (card.status !== 'pending_payment') return { error: 'Esta Gift Card ya fue procesada' };

  let assignedCode: string | null = null;
  let cardImageUrl = card.cardImageUrl;

  if (action === 'approve') {
    assignedCode = card.code || await generateUniqueGiftCardCode();
    const imageBuffer = await renderGiftCardImageBuffer(card, assignedCode, store?.name || 'Tienda');
    const upload = await uploadImageFromBuffer(imageBuffer, `gift-card-${giftCardId}.png`, 'image/png', 'gift-cards');
    cardImageUrl = upload.url;
  }

  await db
    .update(giftCards)
    .set({
      status: action === 'approve' ? 'active' : 'cancelled',
      code: action === 'approve' ? assignedCode : card.code,
      qrHash: action === 'approve' && assignedCode ? hashGiftCardCode(assignedCode) : card.qrHash,
      cardImageUrl,
      rejectionReason: action === 'reject' ? (rejectionReason || 'Pago no verificado') : null,
      verifiedBy: user.id,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  if (action === 'approve') {
    // Obtener nombre del remitente para el historial
    const sender = await db.select({ name: users.name }).from(users).where(eq(users.id, card.senderId)).get();
    const senderName = sender?.name || 'Alguien';

    // Registrar historial ahora que la tarjeta está activa
    const isSavedToWallet = card.senderId === card.recipientId;
    if (isSavedToWallet) {
      await addHistoryRecord(giftCardId, card.senderId, 'saved', `Gift card guardada en billetera`, card.amount);
    } else {
      await addHistoryRecord(giftCardId, card.senderId, 'sent', `Gift card enviada a ${card.recipientName || card.recipientEmail || 'usuario'}`, card.amount);
      if (card.recipientId) {
        await addHistoryRecord(giftCardId, card.recipientId, 'received', `Gift card recibida de ${senderName}`, card.amount);
      }
    }

    if (card.recipientId) {
      await sendOneSignalNotification({
        userIds: [card.recipientId],
        title: 'Gift Card activada',
        message: `Tu Gift Card de Bs. ${card.amount.toFixed(2)} ya esta activa.`,
        url: `/gift-cards/${giftCardId}`,
      });

      const { createNotification } = await import('./notifications');
      await createNotification({
        userId: card.recipientId,
        title: 'Gift Card activada',
        message: `Tu Gift Card de Bs. ${card.amount.toFixed(2)} ya esta activa.`,
        type: 'gift_card',
        link: `/gift-cards/${giftCardId}`,
      });
    }
  } else {
    const message = rejectionReason || 'Pago no verificado';
    await sendOneSignalNotification({
      userIds: [card.senderId],
      title: 'Pago de Gift Card rechazado',
      message,
      url: '/gift-cards?tab=stores',
    });

    const { createNotification } = await import('./notifications');
    await createNotification({
      userId: card.senderId,
      title: 'Pago de Gift Card rechazado',
      message,
      type: 'gift_card',
      link: '/gift-cards?tab=stores',
    });
  }

  revalidatePath('/dashboard/gift-cards');
  revalidatePath('/gift-cards');
  revalidatePath(`/gift-cards/${giftCardId}`);
  return {
    success: true,
    message: action === 'approve' ? 'Gift Card activada correctamente' : 'Gift Card rechazada',
    ...(assignedCode && { code: assignedCode }),
  };
}

export async function updateStoreIssuedGiftCard(
  giftCardId: string,
  data: {
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    message?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  const store = await getOwnedStoreForUser(user.id);
  if (!store && user.role !== 'superadmin') return { error: 'Tienda no encontrada' };

  const card = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).get();
  if (!card) return { error: 'Gift Card no encontrada' };
  if (store && card.businessId !== store.id) return { error: 'No autorizado para esta tienda' };

  let cardImageUrl = card.cardImageUrl;
  const nextCard = {
    ...card,
    recipientName: data.recipientName?.trim() || card.recipientName,
    recipientEmail: data.recipientEmail?.trim() || null,
    recipientPhone: data.recipientPhone?.trim() || null,
    message: data.message?.trim() || null,
  };

  if (!cardImageUrl && card.code) {
    const imageBuffer = await renderGiftCardImageBuffer(nextCard, card.code, store?.name || 'Tienda');
    const upload = await uploadImageFromBuffer(imageBuffer, `gift-card-${giftCardId}.png`, 'image/png', 'gift-cards');
    cardImageUrl = upload.url;
  }

  await db
    .update(giftCards)
    .set({
      recipientName: nextCard.recipientName,
      recipientEmail: nextCard.recipientEmail,
      recipientPhone: nextCard.recipientPhone,
      message: nextCard.message,
      cardImageUrl,
      updatedAt: new Date(),
    })
    .where(eq(giftCards.id, giftCardId));

  revalidatePath('/dashboard/gift-cards');
  revalidatePath('/gift-cards');
  return { success: true };
}

export async function deleteStoreIssuedGiftCard(giftCardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' };

  const store = await getOwnedStoreForUser(user.id);
  if (!store && user.role !== 'superadmin') return { error: 'Tienda no encontrada' };

  const card = await db.select().from(giftCards).where(eq(giftCards.id, giftCardId)).get();
  if (!card) return { error: 'Gift Card no encontrada' };
  if (store && card.businessId !== store.id) return { error: 'No autorizado para esta tienda' };

  for (const url of [card.cardImageUrl, card.customImageUrl, card.receiptUrl]) {
    if (!url) continue;
    const key = extractKeyFromUrl(url);
    if (key) await deleteImage(key).catch((error) => console.error('Error deleting gift card R2 object:', error));
  }

  await db.delete(giftCardHistory).where(eq(giftCardHistory.giftCardId, giftCardId));
  await db.delete(giftCards).where(eq(giftCards.id, giftCardId));

  revalidatePath('/dashboard/gift-cards');
  revalidatePath('/gift-cards');
  return { success: true };
}

async function getOwnedStoreForUser(userId: string) {
  return db
    .select()
    .from(stores)
    .where(eq(stores.userId, userId))
    .get();
}

async function ensureStoreOwner(storeId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'No autorizado' as const };

  const store = await getOwnedStoreForUser(user.id);
  if (!store || store.id !== storeId) {
    return { error: 'No tienes permiso para administrar esta tienda' as const };
  }

  return { user, store };
}

async function generateUniqueGiftCardCode() {
  for (let attempts = 0; attempts < 20; attempts++) {
    const code = generateSecureGiftCardCode();
    const existingCard = await db
      .select({ id: giftCards.id })
      .from(giftCards)
      .where(eq(giftCards.code, code))
      .get();

    if (!existingCard) return code;
  }

  throw new Error('No se pudo generar un codigo unico de Gift Card');
}

export async function getActiveStoreGiftCardTemplates(storeId?: string) {
  const conditions = [
    eq(stores.giftCardsEnabled, true),
    eq(storeGiftCardTemplates.isActive, true),
  ];
  if (storeId) {
    conditions.push(eq(storeGiftCardTemplates.storeId, storeId));
  }

  const templates = await db
    .select({
      id: storeGiftCardTemplates.id,
      storeId: storeGiftCardTemplates.storeId,
      name: storeGiftCardTemplates.name,
      amount: storeGiftCardTemplates.amount,
      description: storeGiftCardTemplates.description,
      designId: storeGiftCardTemplates.designId,
      occasion: storeGiftCardTemplates.occasion,
      customStyle: storeGiftCardTemplates.customStyle,
      storeName: stores.name,
      storeLogoUrl: stores.logoUrl,
    })
    .from(storeGiftCardTemplates)
    .innerJoin(stores, eq(storeGiftCardTemplates.storeId, stores.id))
    .where(and(...conditions))
    .orderBy(desc(storeGiftCardTemplates.createdAt))
    .all();

  const templatesWithImages = await Promise.all(
    templates.map(async (template) => {
      const reserved = await db
        .select({ id: giftCards.id })
        .from(giftCards)
        .where(
          and(
            eq(giftCards.storeGiftCardTemplateId, template.id),
            sql`${giftCards.status} != 'cancelled'`
          )
        )
        .get();
      if (reserved) return null;

      const giftCardImage = await db
        .select({
          cardImageUrl: giftCards.cardImageUrl,
          customImageUrl: giftCards.customImageUrl,
        })
        .from(giftCards)
        .where(
          and(
            eq(giftCards.storeGiftCardTemplateId, template.id),
            eq(giftCards.status, 'active')
          )
        )
        .orderBy(desc(giftCards.createdAt))
        .get();

      return {
        ...template,
        imageUrl: giftCardImage?.cardImageUrl || giftCardImage?.customImageUrl || null,
      };
    })
  );

  return templatesWithImages.filter((template): template is NonNullable<typeof template> => Boolean(template));
}

export async function toggleStoreGiftCardsEnabled(enabled: boolean) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser || (sessionUser.role !== "seller" && sessionUser.role !== "assistant" && sessionUser.role !== "superadmin")) {
    return { error: "No autorizado" };
  }

  const store = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.userId, sessionUser.id))
    .get();

  if (!store) {
    return { error: "Tienda no encontrada" };
  }

  await db
    .update(stores)
    .set({ giftCardsEnabled: enabled })
    .where(eq(stores.id, store.id));

  revalidatePath("/dashboard/gift-cards");
  revalidatePath("/dashboard/configuracion");

  return { success: true, enabled };
}

export async function getStoreGiftCardsEnabled() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect('/login');
  }

  const storeData = await db
    .select({
      giftCardsEnabled: stores.giftCardsEnabled,
    })
    .from(stores)
    .where(eq(stores.userId, sessionUser.id))
    .get();

  return storeData?.giftCardsEnabled ?? true;
}

export async function getStoresWithGiftCards() {
  const conditions = [
    eq(stores.giftCardsEnabled, true),
  ];

  const results = await db
    .select({
      storeId: stores.id,
      storeName: stores.name,
      storeLogoUrl: stores.logoUrl,
      storeBannerUrl: stores.bannerUrl,
      templateId: storeGiftCardTemplates.id,
      templateName: storeGiftCardTemplates.name,
      templateDescription: storeGiftCardTemplates.description,
      templateAmount: storeGiftCardTemplates.amount,
      designId: storeGiftCardTemplates.designId,
      occasion: storeGiftCardTemplates.occasion,
      createdAt: storeGiftCardTemplates.createdAt,
    })
    .from(storeGiftCardTemplates)
    .innerJoin(stores, eq(storeGiftCardTemplates.storeId, stores.id))
    .where(and(...conditions))
    .orderBy(desc(stores.createdAt))
    .all();

  const storesMap = new Map();
  for (const result of results) {
    if (!storesMap.has(result.storeId)) {
      const giftCardImage = await db
        .select({
          cardImageUrl: giftCards.cardImageUrl,
          customImageUrl: giftCards.customImageUrl,
        })
        .from(giftCards)
        .where(
          and(
            eq(giftCards.businessId, result.storeId),
            eq(giftCards.status, 'active')
          )
        )
        .orderBy(desc(giftCards.createdAt))
        .get();

      storesMap.set(result.storeId, {
        id: result.storeId,
        name: result.storeName,
        logoUrl: result.storeLogoUrl,
        bannerUrl: result.storeBannerUrl,
        firstTemplateId: result.templateId,
        firstTemplateName: result.templateName,
        firstTemplateAmount: result.templateAmount,
        firstTemplateDesignId: result.designId,
        imageUrl: giftCardImage?.cardImageUrl || giftCardImage?.customImageUrl || null,
        templates: [],
      });
    }

    const reserved = await db
      .select({ id: giftCards.id })
      .from(giftCards)
      .where(
        and(
          eq(giftCards.storeGiftCardTemplateId, result.templateId),
          sql`${giftCards.status} != 'cancelled'`
        )
      )
      .get();

    if (!reserved) {
      storesMap.get(result.storeId).templates.push({
        id: result.templateId,
        storeId: result.storeId,
        name: result.templateName,
        amount: result.templateAmount,
        description: result.templateDescription,
        designId: result.designId,
        occasion: result.occasion,
        storeName: result.storeName,
        storeLogoUrl: result.storeLogoUrl,
      });
    }
  }

  return Array.from(storesMap.values()).filter((store) => store.templates.length > 0);
}

export async function getGiftCardStoreProducts(storeId: string) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      imageUrls: products.imageUrls,
      price: comercialConfig.precioVenta,
    })
    .from(products)
    .innerJoin(comercialConfig, eq(products.id, comercialConfig.productId))
    .where(and(eq(products.storeId, storeId), eq(comercialConfig.isPublished, true)))
    .orderBy(desc(products.createdAt))
    .limit(24)
    .all();

  return rows.map((product) => {
    let imageUrl: string | null = null;
    try {
      const parsed = Array.isArray(product.imageUrls)
        ? product.imageUrls
        : product.imageUrls
          ? JSON.parse(product.imageUrls)
          : [];
      imageUrl = Array.isArray(parsed) ? parsed[0] || null : null;
    } catch {
      imageUrl = null;
    }
    return { ...product, imageUrl };
  });
}

export async function getStoreWithGiftCards(storeId: string) {
  const store = await db
    .select({
      id: stores.id,
      name: stores.name,
      logoUrl: stores.logoUrl,
      bannerUrl: stores.bannerUrl,
      description: stores.description,
      giftCardsEnabled: stores.giftCardsEnabled,
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .get();

  if (!store) {
    return null;
  }

  const templates = await getActiveStoreGiftCardTemplates(storeId);

  return {
    ...store,
    templates: templates,
  };
}

export async function getActiveGiftCardsCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  const now = Date.now();
  const isCardActive = (c: any) => {
    const exp = c.expiresAt instanceof Date ? c.expiresAt.getTime() : Number(c.expiresAt);
    return c.status === 'active' && exp > now && c.balance > 0;
  };

  const userGiftCards = await db
    .select({
      id: giftCards.id,
      status: giftCards.status,
      balance: giftCards.balance,
      expiresAt: giftCards.expiresAt,
      senderId: giftCards.senderId,
      recipientId: giftCards.recipientId,
    })
    .from(giftCards)
    .where(
      or(
        eq(giftCards.senderId, user.id),
        eq(giftCards.recipientId, user.id)
      )
    )
    .all();

  const mine = userGiftCards.filter(gc => gc.senderId === user.id && gc.recipientId === user.id);
  const sent = userGiftCards.filter(gc => gc.senderId === user.id && gc.recipientId !== user.id);
  const received = userGiftCards.filter(gc => gc.recipientId === user.id && gc.senderId !== user.id);

  const pendingVerification = [...sent, ...received, ...mine]
    .filter((c, index, self) =>
      c.status === 'pending_payment' &&
      self.findIndex(t => t.id === c.id) === index
    );

  const activeMine = [
    ...mine,
    ...pendingVerification
  ].filter((c, index, self) => self.findIndex(t => t.id === c.id) === index)
    .filter(isCardActive);

  return activeMine.length;
}



