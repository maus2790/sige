import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { giftCards } from '@/db/schema';
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

  const card = await db
    .select()
    .from(giftCards)
    .where(eq(giftCards.code, code))
    .get();

  if (!card) {
    return NextResponse.json({ error: 'Código no encontrado. Verifica que lo escribiste correctamente.' }, { status: 404 });
  }

  const now = new Date();
  const isExpired = card.expiresAt < now;

  // Return safe public info only (no private IDs)
  return NextResponse.json({
    code: card.code,
    balance: card.balance,
    amount: card.amount,
    status: isExpired ? 'expired' : card.status,
    expiresAt: card.expiresAt instanceof Date
      ? card.expiresAt.toISOString()
      : new Date(Number(card.expiresAt)).toISOString(),
    message: card.message,
  });
}
