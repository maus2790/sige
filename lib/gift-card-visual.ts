import { getGiftCardTemplate } from '@/components/gift-cards/gift-card-templates';
import { getGiftCardOccasion } from '@/components/gift-cards/gift-card-customization';

export type CustomCardStyle = {
  useCustom: boolean;
  colors: string[];
  angle: number;
  type: 'linear' | 'radial' | 'conic' | 'reflected' | 'diamond';
  iconId: string;
  bgIconId: string;
  centerX?: number;
  centerY?: number;
};

export type GiftCardVisualInput = {
  templateName?: string | null;
  storeName?: string | null;
  amount?: string | number | null;
  cardName?: string | null;
  recipientName?: string | null;
  message?: string | null;
  occasion?: string | null;
  designId?: number | null;
  templateId?: number | null;
  customStyle?: CustomCardStyle | string | null;
  code?: string | null;
};

export const DEFAULT_CUSTOM_CARD_STYLE: CustomCardStyle = {
  useCustom: false,
  colors: ['#ec4899', '#8b5cf6'],
  angle: 135,
  type: 'linear',
  iconId: 'gift',
  bgIconId: 'gift',
  centerX: 50,
  centerY: 50,
};

export const PRESET_GRADIENT_COLORS: Record<number, string[]> = {
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

export function parseGiftCardCustomStyle(value?: CustomCardStyle | string | null): CustomCardStyle | null {
  if (!value) return null;

  let parsed: Partial<CustomCardStyle> | null = null;
  if (typeof value === 'string') {
    if (!value.trim() || value.trim() === '{}') return null;
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  } else {
    parsed = value;
  }

  if (!parsed?.useCustom) return null;

  return {
    ...DEFAULT_CUSTOM_CARD_STYLE,
    ...parsed,
    colors: Array.isArray(parsed.colors) && parsed.colors.length >= 2 ? parsed.colors : DEFAULT_CUSTOM_CARD_STYLE.colors,
    angle: Number.isFinite(Number(parsed.angle)) ? Number(parsed.angle) : DEFAULT_CUSTOM_CARD_STYLE.angle,
    centerX: Number.isFinite(Number(parsed.centerX)) ? Number(parsed.centerX) : DEFAULT_CUSTOM_CARD_STYLE.centerX,
    centerY: Number.isFinite(Number(parsed.centerY)) ? Number(parsed.centerY) : DEFAULT_CUSTOM_CARD_STYLE.centerY,
    iconId: parsed.iconId || DEFAULT_CUSTOM_CARD_STYLE.iconId,
    bgIconId: parsed.bgIconId || DEFAULT_CUSTOM_CARD_STYLE.bgIconId,
    type: parsed.type || DEFAULT_CUSTOM_CARD_STYLE.type,
    useCustom: true,
  };
}

export function getCustomBackgroundCss(style: CustomCardStyle) {
  const colors = style.colors?.length >= 2 ? style.colors : DEFAULT_CUSTOM_CARD_STYLE.colors;
  const angle = style.angle ?? DEFAULT_CUSTOM_CARD_STYLE.angle;
  const cx = style.centerX ?? DEFAULT_CUSTOM_CARD_STYLE.centerX;
  const cy = style.centerY ?? DEFAULT_CUSTOM_CARD_STYLE.centerY;

  switch (style.type) {
    case 'radial':
      return `radial-gradient(circle at ${cx}% ${cy}%, ${colors.join(', ')})`;
    case 'conic':
      return `conic-gradient(from ${angle}deg at ${cx}% ${cy}%, ${colors.join(', ')})`;
    case 'reflected':
      return `linear-gradient(${angle}deg, ${[...colors, ...colors.slice(0, -1).reverse()].join(', ')})`;
    case 'diamond': {
      const quad = [...colors, ...colors.slice(1, -1).reverse()];
      const full = [...quad, ...quad, ...quad, ...quad, colors[0]];
      const stops = full.map((color, index) => `${color} ${((index / (full.length - 1)) * 100).toFixed(1)}%`);
      return `conic-gradient(from ${angle}deg at ${cx}% ${cy}%, ${stops.join(', ')})`;
    }
    default:
      return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  }
}

export function resolveGiftCardVisual(input: GiftCardVisualInput, mode: 'seller' | 'buyer' = 'buyer') {
  const designId = Number(input.designId ?? input.templateId ?? 1) || 1;
  const template = getGiftCardTemplate(designId);
  const customStyle = parseGiftCardCustomStyle(input.customStyle);
  const occasionId = input.occasion || 'otros';
  const occasion = getGiftCardOccasion(occasionId);
  const amount = Number(input.amount || 0);
  const displayName =
    mode === 'buyer'
      ? (input.cardName || input.recipientName || '________')
      : (input.templateName || 'Gift Card');

  return {
    designId,
    template,
    customStyle,
    isCustom: Boolean(customStyle),
    occasionId,
    occasionLabel: occasion.label,
    amount,
    displayName,
    storeName: input.storeName || 'Tienda',
    templateName: input.templateName || 'Gift Card',
    message: input.message || '',
    code: input.code || 'XXXX-XXXX-XXXX',
    visualName: customStyle ? 'Personalizado' : template.name,
    topRightLabel: customStyle ? 'CUSTOM' : template.name,
    backgroundCss: customStyle ? getCustomBackgroundCss(customStyle) : null,
    presetColors: PRESET_GRADIENT_COLORS[designId] || PRESET_GRADIENT_COLORS[1],
    iconId: customStyle?.iconId || null,
    bgIconId: customStyle?.bgIconId || null,
  };
}
