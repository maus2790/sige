import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextauthConfig } from '@/lib/nextauth.config';
import { db } from '@/db';
import { giftCards, storeGiftCardTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSecureGiftCardCode, hashGiftCardCode } from '@/lib/gift-card-code';

/**
 * POST /api/gift-cards/generate-code
 *
 * Generates a secure, unique gift card code using cryptographic randomness.
 * This endpoint ensures:
 * - Cryptographically secure random generation (Node.js crypto module)
 * - 32-character alphabet (A-Z excluding O,I; 2-9 excluding 0,1)
 * - 12-character format divided into 3 blocks of 4: XXXX-XXXX-XXXX
 * - Uniqueness verification against existing gift cards and templates
 * - SHA-256 hash generation for QR code verification
 *
 * @returns {object} Success response with generated code, hash, and format details
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextauthConfig);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let code: string;
    let qrHash: string;
    let attempts = 0;
    const maxAttempts = 20;

    do {
      code = generateSecureGiftCardCode();
      qrHash = hashGiftCardCode(code);

      const [existingCard, existingTemplate] = await Promise.all([
        db
          .select({ id: giftCards.id })
          .from(giftCards)
          .where(eq(giftCards.code, code))
          .get(),
        db
          .select({ id: storeGiftCardTemplates.id })
          .from(storeGiftCardTemplates)
          .where(eq(storeGiftCardTemplates.code, code))
          .get(),
      ]);

      if (!existingCard && !existingTemplate) {
        return NextResponse.json({
          success: true,
          code,
          qrHash,
          format: {
            length: 12,
            blocks: 3,
            blockSize: 4,
            separator: '-',
            example: 'A3KF-XW9M-P2QR',
          },
          alphabet: {
            letters: 'A-Z (excluding O, I)',
            numbers: '2-9 (excluding 0, 1)',
            totalCharacters: 32,
          },
          security: {
            generator: 'crypto.randomInt() - Cryptographically secure',
            hash: 'SHA-256 for QR verification',
            distribution: 'Uniform random distribution',
          },
        });
      }

      attempts++;
    } while (attempts < maxAttempts);

    return NextResponse.json(
      {
        error: 'Failed to generate unique gift card code after maximum attempts',
        attempts: attempts,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error generating gift card code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
