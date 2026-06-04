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
import { Textarea } from '@/components/ui/textarea';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from './gift-card-templates';
import {
  GIFT_CARD_MAX_MESSAGE_LENGTH,
  GIFT_CARD_OCCASIONS,
  getGiftCardMessages,
  getGiftCardOccasion,
} from './gift-card-customization';

export type GiftCardDesignValue = {
  templateName?: string;
  storeName: string;
  amount?: string | number;
  recipientName?: string;
  message: string;
  occasion: string;
  designId: number;
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

export function GiftCardPreview({
  value,
  mode = 'buyer',
  code = 'XXXX-XXXX-XXXX',
}: {
  value: GiftCardDesignValue;
  mode?: 'seller' | 'buyer';
  code?: string;
}) {
  const visual = getGiftCardTemplate(value.designId);
  const occasion = getGiftCardOccasion(value.occasion);
  const OccasionIcon = occasion.icon;
  const amount = Number(value.amount || 0);

  return (
    <div className={`card-shine relative aspect-[1.62/1] w-full overflow-hidden rounded-[2rem] p-5 text-white shadow-2xl ring-1 ring-white/20 ${visual.className}`}>
      <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/25" />
      <div className="absolute right-4 top-4 opacity-15 pointer-events-none"><Gift size={124} /></div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm">
              <OccasionIcon className="h-5 w-5" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
              {mode === 'buyer' ? 'Para' : 'Boceto'}
            </p>
            <h3 className="truncate text-xl font-black leading-tight">
              {mode === 'buyer' ? (value.recipientName || '________') : (value.templateName || 'Gift Card')}
            </h3>
            <p className="mt-0.5 text-[10px] font-bold opacity-75">
              {occasion.label} - {visual.name}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest">{value.storeName}</p>
            <p className="text-[8px] uppercase tracking-wider opacity-75">{visual.name}</p>
          </div>
        </div>

        {value.message && (
          <p className="overflow-hidden text-ellipsis whitespace-nowrap rounded-2xl border border-white/5 bg-black/15 px-4 py-2 text-center text-xs italic backdrop-blur-xs">
            "{value.message.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH)}"
          </p>
        )}

        <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Codigo</p>
            <p className="font-mono text-[10px] font-black tracking-widest">{code}</p>
          </div>
          <p className="shrink-0 text-3xl font-black">Bs. {amount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

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
  const fields = (
    <div className="space-y-4 rounded-[1.75rem] bg-background p-4 shadow-sm ring-1 ring-border/60">
      {sections.includes('details') && (
        <div className="space-y-4">
          {mode === 'seller' && (
            <div className="space-y-2">
              <Label>Nombre interno</Label>
              <Input
                value={value.templateName || ''}
                onChange={(event) => onChange({ templateName: event.target.value })}
                placeholder="Gift Card Premium"
                className="h-12 rounded-2xl"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Monto Bs. (max. Bs. {maxAmount.toLocaleString('es-BO')})</Label>
            <Input
              type="number"
              value={value.amount || ''}
              onChange={(event) => {
                const next = event.target.value;
                if (next === '' || (Number(next) >= 0 && Number(next) <= maxAmount)) {
                  onChange({ amount: next });
                }
              }}
              placeholder="100"
              className="h-12 rounded-2xl"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[100, 300, 500, 1000, maxAmount].filter((amount, index, arr) => amount <= maxAmount && arr.indexOf(amount) === index).map((amount) => (
              <Button key={amount} type="button" variant={Number(value.amount) === amount ? 'default' : 'outline'} className="h-10 rounded-xl text-xs font-black" onClick={() => onChange({ amount })}>
                Bs. {amount}
              </Button>
            ))}
          </div>
        </div>
      )}

      {sections.includes('occasion') && (
        <div className="space-y-3">
          <Label>Ocasion</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GIFT_CARD_OCCASIONS.map((occasion) => {
              const Icon = occasion.icon;
              const selected = value.occasion === occasion.id;
              return (
                <button
                  key={occasion.id}
                  type="button"
                  onClick={() => onChange({ occasion: occasion.id, message: value.message || getGiftCardMessages(occasion.id)[0] })}
                  className={`flex h-12 items-center gap-2 rounded-2xl px-3 text-left text-xs font-black transition ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted/70 hover:bg-muted'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{occasion.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sections.includes('suggestions') && (
        <div className="space-y-3">
          <Label>Sugerencias</Label>
          <div className="space-y-2">
            {getGiftCardMessages(value.occasion).map((message) => (
              <Button
                key={message}
                type="button"
                variant={value.message === message ? 'default' : 'outline'}
                className="h-auto w-full justify-start whitespace-normal rounded-2xl px-4 py-3 text-left text-xs font-bold"
                onClick={() => onChange({ message: message.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH) })}
              >
                "{message}"
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Mensaje corto</Label>
            <Textarea
              value={value.message}
              onChange={(event) => onChange({ message: event.target.value.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH) })}
              placeholder="Un detalle especial para ti."
              className="min-h-24 rounded-2xl"
            />
            <p className="text-right text-[11px] font-bold text-muted-foreground">{value.message.length}/{GIFT_CARD_MAX_MESSAGE_LENGTH}</p>
          </div>
        </div>
      )}

      {sections.includes('style') && (
        <div className="space-y-3">
          <Label>Estilo de tarjeta</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GIFT_CARD_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onChange({ designId: template.id })}
                className={`card-shine relative h-20 overflow-hidden rounded-2xl p-3 text-left text-[10px] font-black text-white ring-offset-background transition ${template.className} ${value.designId === template.id ? 'scale-[1.02] ring-2 ring-primary ring-offset-2' : 'opacity-90 hover:opacity-100'}`}
              >
                {template.name.replace(' CARD', '')}
                {value.designId === template.id && <Check className="absolute bottom-2 right-2 h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (hidePreview) return fields;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(300px,430px)_1fr]">
      <section className="space-y-3 md:sticky md:top-4 md:self-start">
        <GiftCardPreview value={value} mode={mode} code={mode === 'seller' ? 'SIN CODIGO' : 'XXXX-XXXX-XXXX'} />
      </section>
      {fields}
    </div>
  );
}
