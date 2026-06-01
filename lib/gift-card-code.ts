import 'server-only';

import crypto from 'crypto';

const GIFT_CARD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 12;
const BLOCK_SIZE = 4;

export function generateSecureGiftCardCode() {
  let rawCode = '';

  for (let i = 0; i < CODE_LENGTH; i++) {
    rawCode += GIFT_CARD_ALPHABET[crypto.randomInt(0, GIFT_CARD_ALPHABET.length)];
  }

  return rawCode.match(new RegExp(`.{1,${BLOCK_SIZE}}`, 'g'))!.join('-');
}

export function hashGiftCardCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function normalizeGiftCardCode(code: string) {
  return code.trim().toUpperCase();
}
