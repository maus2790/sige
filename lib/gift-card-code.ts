import 'server-only';

import crypto from 'crypto';

const GIFT_CARD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;
const BLOCK_SIZE = 4;
const BLOCKS = CODE_LENGTH / BLOCK_SIZE;

/**
 * Generates a cryptographically secure gift card code.
 *
 * Alphabet: 32 characters (A-Z excluding O,I + 2-9 excluding 0,1)
 * Format: XXXX-XXXX-XXXX (12 characters in 3 blocks of 4)
 * Security: Uses Node.js crypto.randomInt() for uniform random distribution
 *
 * Example output: A3KF-XW9M-P2QR
 *
 * @returns {string} A formatted gift card code with uniform cryptographic randomness
 */
export function generateSecureGiftCardCode(): string {
  let rawCode = '';

  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, GIFT_CARD_ALPHABET.length);
    rawCode += GIFT_CARD_ALPHABET[randomIndex];
  }

  const blocks = rawCode.match(new RegExp(`.{1,${BLOCK_SIZE}}`, 'g'))!;
  return blocks.join('-');
}

/**
 * Creates a SHA-256 hash of a gift card code for QR verification.
 *
 * @param {string} code - The gift card code to hash
 * @returns {string} SHA-256 hex digest for secure code verification
 */
export function hashGiftCardCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Normalizes a gift card code for database storage and comparison.
 *
 * @param {string} code - The raw gift card code
 * @returns {string} Trimmed and uppercase code
 */
export function normalizeGiftCardCode(code: string): string {
  return code.trim().toUpperCase();
}
