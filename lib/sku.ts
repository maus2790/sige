const SKU_SEGMENT_RE = /^[A-Z0-9]{4}$/;
const SKU_ALPHABET_SIZE = 36;
const SKU_SEGMENT_LENGTH = 4;
const SKU_MAX_VALUE = SKU_ALPHABET_SIZE ** SKU_SEGMENT_LENGTH - 1;

export function normalizeSkuSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, SKU_SEGMENT_LENGTH);
}

export function isValidSkuSegment(value: string) {
  return SKU_SEGMENT_RE.test(value);
}

export function numberToSkuSegment(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > SKU_MAX_VALUE) {
    throw new Error("No hay codigos SKU disponibles.");
  }

  return value.toString(36).toUpperCase().padStart(SKU_SEGMENT_LENGTH, "0");
}

export function skuSegmentToNumber(value: string) {
  const segment = normalizeSkuSegment(value);
  if (!isValidSkuSegment(segment)) {
    return 0;
  }

  return parseInt(segment, 36);
}

export function composeProductSku(storeSku: string, productSku: string) {
  const cleanStoreSku = normalizeSkuSegment(storeSku);
  const cleanProductSku = normalizeSkuSegment(productSku);

  if (!isValidSkuSegment(cleanStoreSku) || !isValidSkuSegment(cleanProductSku)) {
    throw new Error("El codigo SKU debe tener 4 caracteres alfanumericos en mayusculas.");
  }

  return `${cleanStoreSku}-${cleanProductSku}`;
}

export function getProductSkuSegment(fullSku?: string | null) {
  if (!fullSku) {
    return "";
  }

  const parts = fullSku.split("-");
  return normalizeSkuSegment(parts.length > 1 ? parts[1] : parts[0]);
}

export function getStoreSkuSegment(fullSku?: string | null) {
  if (!fullSku) {
    return "";
  }

  return normalizeSkuSegment(fullSku.split("-")[0]);
}
