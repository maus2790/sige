'use client';

import {
  Cake,
  Camera,
  Check,
  Coffee,
  Crown,
  Flame,
  Gem,
  Gift,
  Heart,
  Medal,
  Music,
  PartyPopper,
  ShoppingBag,
  Smile,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from './gift-card-templates';
import {
  getCustomBackgroundCss,
  parseGiftCardCustomStyle,
  resolveGiftCardVisual,
  type CustomCardStyle,
} from '@/lib/gift-card-visual';
import {
  GIFT_CARD_MAX_MESSAGE_LENGTH,
  GIFT_CARD_OCCASIONS,
  getGiftCardMessages,
  getGiftCardOccasion,
} from './gift-card-customization';

/* ─── Custom style type ──────────────────────────────────────────────────── */
export type { CustomCardStyle } from '@/lib/gift-card-visual';

export type GiftCardDesignValue = {
  templateName?: string;
  storeName: string;
  amount?: string | number;
  /** For buyer: card name / owner label shown in preview */
  cardName?: string;
  recipientName?: string;
  message: string;
  occasion: string;
  designId: number;
  customStyle?: CustomCardStyle | null;
};

export type DesignerSection = 'details' | 'occasion' | 'suggestions' | 'style';

export const CUSTOM_CARD_ICONS: Record<string, LucideIcon> = {
  gift: Gift,
  sparkles: Sparkles,
  heart: Heart,
  cake: Cake,
  party: PartyPopper,
  smile: Smile,
  star: Star,
  crown: Crown,
  bag: ShoppingBag,
  coffee: Coffee,
  flame: Flame,
  music: Music,
  gem: Gem,
  medal: Medal,
  camera: Camera,
};

const GRADIENT_TYPES: { id: CustomCardStyle['type']; label: string }[] = [
  { id: 'linear', label: 'Lineal' },
  { id: 'radial', label: 'Radial' },
  { id: 'conic', label: 'Cónico' },
  { id: 'reflected', label: 'Reflejado' },
  { id: 'diamond', label: 'Diamante' },
];

/* ─── Helper: compute inline bg from custom style ────────────────────────── */
export function getCustomBgStyle(cfg: CustomCardStyle): React.CSSProperties {
  return { background: getCustomBackgroundCss(cfg) };
}

/* ─── Preview card ───────────────────────────────────────────────────────── */
export function GiftCardPreview({
  value,
  mode = 'buyer',
  code = 'XXXX-XXXX-XXXX',
}: {
  value: GiftCardDesignValue;
  mode?: 'seller' | 'buyer';
  code?: string;
}) {
  const resolved = resolveGiftCardVisual({ ...value, code }, mode);
  const visual = resolved.template;
  const occasion = getGiftCardOccasion(resolved.occasionId);
  const OccasionIconFallback = occasion.icon;

  /* Custom style overrides */
  const isCustom = resolved.isCustom;
  const cfg = resolved.customStyle;

  const bgStyle: React.CSSProperties = resolved.backgroundCss ? { background: resolved.backgroundCss } : {};
  const containerClass = `card-shine relative aspect-[1.62/1] w-full overflow-hidden rounded-[2rem] p-5 text-white shadow-2xl ring-1 ring-white/20 ${isCustom ? '' : visual.className}`;

  const BadgeIcon: LucideIcon =
    isCustom && cfg?.iconId && CUSTOM_CARD_ICONS[cfg.iconId]
      ? CUSTOM_CARD_ICONS[cfg.iconId]
      : OccasionIconFallback;

  const WatermarkIcon: LucideIcon =
    isCustom && cfg?.bgIconId && CUSTOM_CARD_ICONS[cfg.bgIconId]
      ? CUSTOM_CARD_ICONS[cfg.bgIconId]
      : Gift;

  /* Display label for top-left */
  return (
    <div className={containerClass} style={bgStyle}>
      <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/25" />
      <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
        <WatermarkIcon size={124} />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm">
              <BadgeIcon className="h-5 w-5" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
              {mode === 'buyer' ? 'Nombre' : 'Boceto'}
            </p>
            <h3 className="truncate text-xl font-black leading-tight">{resolved.displayName}</h3>
            <p className="mt-0.5 text-[10px] font-bold opacity-75">
              {resolved.occasionLabel} - {resolved.visualName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest">{resolved.storeName}</p>
            <p className="text-[8px] uppercase tracking-wider opacity-75">{resolved.topRightLabel}</p>
          </div>
        </div>

        {resolved.message && (
          <p className="overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl border border-white/5 bg-black/15 px-4 py-2 text-center text-xs italic backdrop-blur-xs">
            "{resolved.message.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH)}"
          </p>
        )}

        <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Codigo</p>
            <p className="font-mono text-[10px] font-black tracking-widest">{resolved.code}</p>
          </div>
          <p className="shrink-0 text-3xl font-black">Bs. {resolved.amount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export function GiftCardPreviewFromRecord({
  record,
  template,
  storeName,
  mode = 'buyer',
  code,
}: {
  record: {
    amount?: string | number | null;
    recipientName?: string | null;
    cardName?: string | null;
    message?: string | null;
    occasion?: string | null;
    templateId?: number | null;
    designId?: number | null;
    customStyle?: CustomCardStyle | string | null;
    name?: string | null;
    code?: string | null;
  };
  template?: {
    name?: string | null;
    designId?: number | null;
    occasion?: string | null;
    description?: string | null;
    customStyle?: CustomCardStyle | string | null;
  } | null;
  storeName: string;
  mode?: 'seller' | 'buyer';
  code?: string;
}) {
  return (
    <GiftCardPreview
      mode={mode}
      code={code || record.code || (mode === 'seller' ? 'SIN CODIGO' : 'XXXX-XXXX-XXXX')}
      value={{
        templateName: template?.name || record.name || 'Gift Card',
        storeName,
        amount: record.amount || 0,
        recipientName: record.recipientName || undefined,
        cardName: record.cardName || undefined,
        message: record.message || template?.description || '',
        occasion: record.occasion || template?.occasion || 'otros',
        designId: record.templateId || record.designId || template?.designId || 1,
        customStyle: parseGiftCardCustomStyle(record.customStyle || template?.customStyle || null),
      }}
    />
  );
}

/* ─── Icon picker row ────────────────────────────────────────────────────── */
function IconPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-black">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(CUSTOM_CARD_ICONS).map(([id, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 transition ${
              value === id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-muted hover:bg-muted/80'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main designer ──────────────────────────────────────────────────────── */
export function GiftCardDesigner({
  value,
  onChange,
  sections,
  mode = 'buyer',
  maxAmount = 5000,
  hidePreview = false,
}: {
  value: GiftCardDesignValue;
  onChange: (patch: Partial<GiftCardDesignValue>) => void;
  sections: DesignerSection[];
  mode?: 'seller' | 'buyer';
  maxAmount?: number;
  hidePreview?: boolean;
}) {
  const cs = value.customStyle;
  const isCustom = cs?.useCustom ?? false;

  function patchCustomStyle(patch: Partial<CustomCardStyle>) {
    const base: CustomCardStyle = {
      useCustom: cs?.useCustom ?? false,
      colors: cs?.colors ?? ['#ec4899', '#8b5cf6'],
      angle: cs?.angle ?? 135,
      type: cs?.type ?? 'linear',
      iconId: cs?.iconId ?? 'gift',
      bgIconId: cs?.bgIconId ?? 'gift',
      ...patch,
    };
    onChange({ customStyle: base });
  }

  const fields = (
    <div className="space-y-4 rounded-[1.75rem] bg-background p-4 shadow-sm ring-1 ring-border/60">
      {/* ── DETAILS ── */}
      {sections.includes('details') && (
        <div className="space-y-4">
          {mode === 'seller' && (
            <div className="space-y-2">
              <Label>Nombre interno</Label>
              <Input
                value={value.templateName || ''}
                onChange={(e) => onChange({ templateName: e.target.value })}
                placeholder="Gift Card Premium"
                className="h-12 rounded-2xl"
              />
            </div>
          )}

          {/* Nombre (buyer only — before amount) */}
          {mode === 'buyer' && (
            <div className="space-y-2">
              <Label>Nombre de la tarjeta</Label>
              <Input
                value={value.cardName ?? ''}
                onChange={(e) => onChange({ cardName: e.target.value })}
                placeholder="Mi Gift Card"
                className="h-12 rounded-2xl"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Monto Bs. (max. Bs. {maxAmount.toLocaleString('es-BO')})</Label>
            <Input
              type="number"
              value={value.amount || ''}
              onChange={(e) => {
                const next = e.target.value;
                if (next === '' || (Number(next) >= 0 && Number(next) <= maxAmount)) {
                  onChange({ amount: next });
                }
              }}
              placeholder="100"
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[100, 300, 500, 1000, maxAmount]
              .filter((a, i, arr) => a <= maxAmount && arr.indexOf(a) === i)
              .map((a) => (
                <Button
                  key={a}
                  type="button"
                  variant={Number(value.amount) === a ? 'default' : 'outline'}
                  className="h-10 rounded-xl text-xs font-black"
                  onClick={() => onChange({ amount: a })}
                >
                  Bs. {a}
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* ── OCCASION ── */}
      {sections.includes('occasion') && (
        <div className="space-y-3">
          <Label>Ocasion</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GIFT_CARD_OCCASIONS.map((occ) => {
              const Icon = occ.icon;
              const selected = value.occasion === occ.id;
              return (
                <button
                  key={occ.id}
                  type="button"
                  onClick={() =>
                    onChange({ occasion: occ.id, message: value.message || getGiftCardMessages(occ.id)[0] })
                  }
                  className={`flex h-12 items-center gap-2 rounded-2xl px-3 text-left text-xs font-black transition ${
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted/70 hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{occ.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SUGGESTIONS ── */}
      {sections.includes('suggestions') && (
        <div className="space-y-3">
          <Label>Sugerencias</Label>
          <div className="space-y-2">
            {getGiftCardMessages(value.occasion).map((msg) => (
              <Button
                key={msg}
                type="button"
                variant={value.message === msg ? 'default' : 'outline'}
                className="h-auto w-full justify-start whitespace-normal rounded-2xl px-4 py-3 text-left text-xs font-bold"
                onClick={() => onChange({ message: msg.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH) })}
              >
                "{msg}"
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Mensaje corto</Label>
            <Textarea
              value={value.message}
              onChange={(e) => onChange({ message: e.target.value.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH) })}
              placeholder="Un detalle especial para ti."
              className="min-h-24 rounded-2xl"
            />
            <p className="text-right text-[11px] font-bold text-muted-foreground">
              {value.message.length}/{GIFT_CARD_MAX_MESSAGE_LENGTH}
            </p>
          </div>
        </div>
      )}

      {/* ── STYLE ── */}
      {sections.includes('style') && (
        <div className="space-y-4">
          <Label>Estilo de tarjeta</Label>

          {/* Template presets */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GIFT_CARD_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onChange({ designId: tpl.id });
                  // disable custom when picking a preset
                  if (isCustom) patchCustomStyle({ useCustom: false });
                }}
                className={`card-shine relative h-20 overflow-hidden rounded-2xl p-3 text-left text-[10px] font-black text-white ring-offset-background transition ${tpl.className} ${
                  value.designId === tpl.id && !isCustom ? 'scale-[1.02] ring-2 ring-primary ring-offset-2' : 'opacity-90 hover:opacity-100'
                }`}
              >
                {tpl.name.replace(' CARD', '')}
                {value.designId === tpl.id && !isCustom && <Check className="absolute bottom-2 right-2 h-4 w-4" />}
              </button>
            ))}
          </div>

          {/* ── Custom style toggle ── */}
          <div className="rounded-2xl border bg-muted/40 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black">Personalizar tarjeta</p>
                <p className="text-[11px] text-muted-foreground">Colores, degradado e íconos propios</p>
              </div>
              <Switch
                checked={isCustom}
                onCheckedChange={(checked) => patchCustomStyle({ useCustom: checked })}
              />
            </div>

            {isCustom && (
              <div className="space-y-5 pt-1">
                {/* Colors */}
                <div className="space-y-2">
                  <Label className="text-xs font-black">Colores del degradado</Label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(cs?.colors ?? ['#ec4899', '#8b5cf6']).map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const next = [...(cs?.colors ?? ['#ec4899', '#8b5cf6'])];
                            next[i] = e.target.value;
                            patchCustomStyle({ colors: next });
                          }}
                          className="h-10 w-10 cursor-pointer rounded-xl border-0 p-0.5 shadow"
                          style={{ background: 'transparent' }}
                        />
                        {(cs?.colors?.length ?? 2) > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...(cs?.colors ?? [])];
                              next.splice(i, 1);
                              patchCustomStyle({ colors: next });
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-black"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {(cs?.colors?.length ?? 2) < 5 && (
                      <button
                        type="button"
                        onClick={() =>
                          patchCustomStyle({ colors: [...(cs?.colors ?? ['#ec4899', '#8b5cf6']), '#3b82f6'] })
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground text-lg font-black hover:bg-muted"
                      >
                        +
                      </button>
                    )}
                  </div>
                  {/* mini preview strip */}
                  <div
                    className="h-3 w-full rounded-full"
                    style={getCustomBgStyle({ ...((cs as CustomCardStyle) ?? {}), useCustom: true, colors: cs?.colors ?? ['#ec4899', '#8b5cf6'], type: cs?.type ?? 'linear', angle: cs?.angle ?? 135, iconId: cs?.iconId ?? 'gift', bgIconId: cs?.bgIconId ?? 'gift' })}
                  />
                </div>

                {/* Gradient type */}
                <div className="space-y-2">
                  <Label className="text-xs font-black">Forma del degradado</Label>
                  <div className="flex flex-wrap gap-2">
                    {GRADIENT_TYPES.map((gt) => (
                      <button
                        key={gt.id}
                        type="button"
                        onClick={() => patchCustomStyle({ type: gt.id })}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                          (cs?.type ?? 'linear') === gt.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {gt.label}
                      </button>
                    ))}
                  </div>
                </div>

                 {/* Angle (for linear, reflected, conic, diamond) */}
                 {(!cs?.type || cs.type === 'linear' || cs.type === 'reflected' || cs.type === 'conic' || cs.type === 'diamond') && (
                   <div className="space-y-2">
                     <Label className="text-xs font-black">
                       Ángulo / Rotación: {cs?.angle ?? 135}°
                     </Label>
                     <Slider
                       min={0}
                       max={360}
                       step={5}
                       value={[cs?.angle ?? 135]}
                       onValueChange={([val]) => patchCustomStyle({ angle: val })}
                       className="w-full"
                     />
                   </div>
                 )}

                 {/* Center position X and Y (for radial, conic, diamond) */}
                 {(cs?.type === 'radial' || cs?.type === 'conic' || cs?.type === 'diamond') && (
                   <div className="space-y-3 border-t pt-3">
                     <p className="text-xs font-black">Posición del Centro</p>
                     <div className="space-y-2">
                       <div className="flex justify-between text-[11px] font-bold">
                         <span>Centro X: {cs?.centerX ?? 50}%</span>
                       </div>
                       <Slider
                         min={0}
                         max={100}
                         step={1}
                         value={[cs?.centerX ?? 50]}
                         onValueChange={([val]) => patchCustomStyle({ centerX: val })}
                         className="w-full"
                       />
                     </div>
                     <div className="space-y-2">
                       <div className="flex justify-between text-[11px] font-bold">
                         <span>Centro Y: {cs?.centerY ?? 50}%</span>
                       </div>
                       <Slider
                         min={0}
                         max={100}
                         step={1}
                         value={[cs?.centerY ?? 50]}
                         onValueChange={([val]) => patchCustomStyle({ centerY: val })}
                         className="w-full"
                       />
                     </div>
                   </div>
                 )}

                {/* Badge icon */}
                <IconPicker
                  label="Ícono de la tarjeta"
                  value={cs?.iconId ?? 'gift'}
                  onChange={(id) => patchCustomStyle({ iconId: id })}
                />

                {/* Watermark icon */}
                <IconPicker
                  label="Ícono de marca de agua (fondo)"
                  value={cs?.bgIconId ?? 'gift'}
                  onChange={(id) => patchCustomStyle({ bgIconId: id })}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (hidePreview) return fields;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(300px,430px)_1fr] relative">
      <section className="sticky top-[-1rem] z-40 bg-background/95 backdrop-blur-md py-3 md:py-0 md:relative md:top-4 md:self-start md:bg-transparent md:backdrop-blur-none shadow-sm md:shadow-none border-b md:border-b-0 -mx-4 px-4 md:mx-0 md:px-0">
        <GiftCardPreview
          value={value}
          mode={mode}
          code={mode === 'seller' ? 'SIN CODIGO' : 'XXXX-XXXX-XXXX'}
        />
      </section>
      <div className="pt-2 md:pt-0">
        {fields}
      </div>
    </div>
  );
}
