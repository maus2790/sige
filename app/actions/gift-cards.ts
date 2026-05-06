"use server";

import { db } from "@/db";
import { giftCards, giftCardTransactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser, requireAuth } from "./auth";

// Generar código único SIGE-XXXX-XXXX
function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sin O, 0, I, 1 para evitar confusión
  const part1 = Array.from(randomBytes(4)).map(b => chars[b % chars.length]).join("");
  const part2 = Array.from(randomBytes(4)).map(b => chars[b % chars.length]).join("");
  return `SIGE-${part1}-${part2}`;
}

export async function createGiftCard({
  amount,
  storeId = null,
  recipientEmail = null,
  expiresInDays = 365,
  templateType = "general",
  dedicationMessage = null,
  photoUrl = null,
  videoUrl = null
}: {
  amount: number;
  storeId?: string | null;
  recipientEmail?: string | null;
  expiresInDays?: number;
  templateType?: "general" | "birthday" | "anniversary" | "wedding" | "graduation";
  dedicationMessage?: string | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
}) {
  const user = await requireAuth();
  
  const code = generateGiftCardCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const newCard = {
    id: randomUUID(),
    code,
    initialAmount: amount,
    currentBalance: amount,
    storeId,
    buyerId: user.id,
    recipientEmail,
    status: "active" as const,
    expiresAt,
    templateType,
    dedicationMessage,
    photoUrl,
    videoUrl,
  };

  try {
    await db.insert(giftCards).values(newCard);
    revalidatePath("/dashboard/gift-cards");
    return { success: true, card: newCard };
  } catch (error) {
    console.error("Error creating gift card:", error);
    return { error: "No se pudo generar la tarjeta de regalo." };
  }
}

export async function validateGiftCard(code: string) {
  try {
    const card = await db
      .select()
      .from(giftCards)
      .where(eq(giftCards.code, code.toUpperCase()))
      .get();

    if (!card) {
      return { error: "Código de tarjeta inválido." };
    }

    if (card.status !== "active") {
      return { error: "Esta tarjeta ya no está activa." };
    }

    if (card.expiresAt && new Date() > card.expiresAt) {
      return { error: "Esta tarjeta ha expirado." };
    }

    if (card.currentBalance <= 0) {
      return { error: "Esta tarjeta no tiene saldo suficiente." };
    }

    return { success: true, card };
  } catch (error) {
    console.error("Error validating gift card:", error);
    return { error: "Error al validar la tarjeta." };
  }
}

export async function redeemGiftCard(code: string, orderId: string, amountToRedeem: number) {
  try {
    const validation = await validateGiftCard(code);
    if (!validation.success || !validation.card) {
      return { error: validation.error || "Tarjeta no válida." };
    }

    const card = validation.card;

    if (card.currentBalance < amountToRedeem) {
      return { error: "Saldo insuficiente en la tarjeta." };
    }

    // Actualizar saldo de la tarjeta
    await db
      .update(giftCards)
      .set({
        currentBalance: card.currentBalance - amountToRedeem,
        status: card.currentBalance - amountToRedeem <= 0 ? "redeemed" : "active",
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, card.id));

    // Registrar transacción
    await db.insert(giftCardTransactions).values({
      id: randomUUID(),
      giftCardId: card.id,
      orderId,
      amountUsed: amountToRedeem,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error redeeming gift card:", error);
    return { error: "Error al procesar el canje de la tarjeta." };
  }
}

export async function getMyGiftCards() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select()
    .from(giftCards)
    .where(eq(giftCards.buyerId, user.id))
    .all();
}

export async function deleteGiftCard(id: string) {
  try {
    const user = await requireAuth();
    
    // Verificar que la tarjeta pertenezca al usuario (opcional, dependiendo de si son globales)
    await db.delete(giftCards).where(eq(giftCards.id, id));
    
    revalidatePath("/dashboard/gift-cards");
    return { success: true };
  } catch (error) {
    console.error("Error deleting gift card:", error);
    return { error: "No se pudo eliminar la tarjeta." };
  }
}

export async function updateGiftCard({
  id,
  amount,
  templateType,
  dedicationMessage,
  photoUrl,
  videoUrl
}: {
  id: string;
  amount: number;
  templateType: "general" | "birthday" | "anniversary" | "wedding" | "graduation";
  dedicationMessage?: string | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
}) {
  try {
    await requireAuth();
    
    await db.update(giftCards)
      .set({
        initialAmount: amount,
        currentBalance: amount, // Ojo: si ya se usó, tal vez no deberíamos resetear el saldo.
        templateType,
        dedicationMessage,
        photoUrl,
        videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(giftCards.id, id));
    
    revalidatePath("/dashboard/gift-cards");
    return { success: true };
  } catch (error) {
    console.error("Error updating gift card:", error);
    return { error: "No se pudo actualizar la tarjeta." };
  }
}
