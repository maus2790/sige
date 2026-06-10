import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { giftCards, stores } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Simple in-memory rate limiter (5 requests per minute per IP)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true; // allowed
  }

  if (entry.count >= 5) return false; // blocked

  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const code = request.nextUrl.searchParams.get('code')?.toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
  }

  if (!getRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento antes de intentar de nuevo.' },
      { status: 429 }
    );
  }

  const cardData = await db
    .select({
      id: giftCards.id,
      code: giftCards.code,
      amount: giftCards.amount,
      balance: giftCards.balance,
      expiresAt: giftCards.expiresAt,
      status: giftCards.status,
      message: giftCards.message,
      templateId: giftCards.templateId,
      occasion: giftCards.occasion,
      customStyle: giftCards.customStyle,
      storeName: stores.name,
    })
    .from(giftCards)
    .leftJoin(stores, eq(giftCards.businessId, stores.id))
    .where(eq(giftCards.code, code))
    .get();

  if (!cardData) {
    return NextResponse.json({ error: 'Código no encontrado. Verifica que lo escribiste correctamente.' }, { status: 404 });
  }

  const now = new Date();
  const expiresAtMs = cardData.expiresAt instanceof Date
    ? cardData.expiresAt.getTime()
    : Number(cardData.expiresAt);
  const isExpired = expiresAtMs < now.getTime();

  // Return safe public info only (no private IDs)
  return NextResponse.json({
    code: cardData.code,
    balance: cardData.balance,
    amount: cardData.amount,
    status: isExpired ? 'expired' : cardData.status,
    expiresAt: cardData.expiresAt instanceof Date
      ? cardData.expiresAt.toISOString()
      : new Date(Number(cardData.expiresAt)).toISOString(),
    message: cardData.message,
    templateId: cardData.templateId,
    occasion: cardData.occasion,
    customStyle: cardData.customStyle,
    storeName: cardData.storeName || 'SIGE Store',
  });
}

