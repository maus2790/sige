'use client';

import { Check, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from './gift-card-templates';
import { GIFT_CARD_MAX_MESSAGE_LENGTH, GIFT_CARD_OCCASIONS, getGiftCardMessages, getGiftCardOccasion } from './gift-card-customization';

export type GiftCardDesignValue = {
  templateName?: string;
  storeName: string;
  amount?: string | number;
  recipientName?: string;
  message: string;
  occasion: string;
  designId: number;
  isActive?: boolean;
};

export type DesignerSection = 'details' | 'occasion' | 'suggestions' | 'message' | 'style' | 'active';

export function GiftCardPreview({
  value,
  showActiveBadge = false,
  isBuyer = false,
}: {
  value: GiftCardDesignValue;
  showActiveBadge?: boolean;
  isBuyer?: boolean;
}) {
  const visual = getGiftCardTemplate(value.designId);
  const occasion = getGiftCardOccasion(value.occasion);
  const OccasionIcon = occasion.icon;
  const amountNumber = Number(value.amount || 0);

  return (
    <div className={`card-shine relative aspect-[1.62/1] w-full overflow-hidden rounded-[2rem] p-5 text-white shadow-2xl ring-1 ring-white/20 ${visual.className}`}>
      <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/25" />
      <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
        <Gift size={120} />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3 border border-white/30 backdrop-blur-sm">
              <OccasionIcon className="h-5 w-5" />
            </div>
            {isBuyer ? (
              <>
                <p className="text-[9px] uppercase tracking-widest font-black opacity-70">Para</p>
                <h3 className="text-xl font-black leading-tight truncate">
                  {value.recipientName || '________'}
                </h3>
                <p className="mt-0.5 text-[10px] font-bold opacity-75">
                  {occasion.label} · {visual.name}
                </p>
              </>
            ) : (
              <>
                <p className="text-[9px] uppercase tracking-widest font-black opacity-70">{value.storeName}</p>
                <h3 className="text-xl font-black leading-tight truncate font-sans">
                  {value.templateName || 'Gift Card'}
                </h3>
                <p className="mt-0.5 text-[10px] font-bold opacity-75">
                  {occasion.label} · {visual.name}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-right shrink-0">
            {isBuyer ? (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest">{value.storeName}</p>
                <p className="text-[8px] opacity-75 tracking-wider uppercase">{value.templateName || 'Gift Card'}</p>
              </>
            ) : (
              showActiveBadge && (
                <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ring-1 ring-white/20 ${value.isActive ? 'bg-emerald-400/25' : 'bg-zinc-950/35'}`}>
                  {value.isActive ? 'Activa' : 'Boceto'}
                </span>
              )
            )}
          </div>
        </div>

        {value.message && (
          <p className="bg-black/15 rounded-2xl px-4 py-2 text-xs italic text-center overflow-hidden text-ellipsis whitespace-nowrap border border-white/5 backdrop-blur-xs">
            "{value.message.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH)}"
          </p>
        )}

        <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Codigo</p>
            <p className="font-mono text-[10px] font-black tracking-widest">
              {isBuyer ? 'XXXX-XXXX-XXXX' : (value.isActive === false ? 'SIN CODIGO' : 'SE GENERA AL ACTIVAR')}
            </p>
          </div>
          {value.amount !== undefined && (
            <p className="shrink-0 text-3xl font-black">Bs. {amountNumber.toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function GiftCardDesigner({
  value,
  onChange,
  sections = ['details', 'occasion', 'suggestions', 'message', 'style', 'active'],
  showTemplateFields = false,
  showActiveSwitch = false,
  hidePreview = false,
  maxAmount = 5000,
}: {
  value: GiftCardDesignValue;
  onChange: (patch: Partial<GiftCardDesignValue>) => void;
  sections?: DesignerSection[];
  showTemplateFields?: boolean;
  showActiveSwitch?: boolean;
  hidePreview?: boolean;
  maxAmount?: number;
}) {
  const FormFields = (
    <div className="space-y-4 rounded-[1.75rem] bg-background p-4 shadow-sm ring-1 ring-border/60">
      {sections.includes('details') && showTemplateFields && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre interno</Label>
              <Input value={value.templateName || ''} onChange={(e) => onChange({ templateName: e.target.value })} placeholder="Gift Card Premium" className="h-12 rounded-2xl" />
            </div>
            <div className="space-y-2">
              <Label>Monto Bs. (Máx: Bs. {maxAmount.toLocaleString()})</Label>
              <Input
                type="number"
                value={value.amount || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (Number(val) >= 0 && Number(val) <= maxAmount)) {
                    onChange({ amount: val });
                  }
                }}
                placeholder="100"
                className="h-12 rounded-2xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-black">Montos sugeridos</Label>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const presets = [100, 300, 500, 1000, 5000].filter(p => p < maxAmount);
                if (!presets.includes(maxAmount)) presets.push(maxAmount);
                presets.sort((a, b) => a - b);
                return presets.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={Number(value.amount) === p ? 'default' : 'outline'}
                    className="h-10 rounded-xl px-4 text-xs font-black"
                    onClick={() => onChange({ amount: p })}
                  >
                    Bs. {p} {p === maxAmount ? '(Max)' : ''}
                  </Button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {sections.includes('occasion') && (
        <div className="space-y-3">
          <Label>Ocasion</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GIFT_CARD_OCCASIONS.map((item) => {
              const Icon = item.icon;
              const selected = value.occasion === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange({ occasion: item.id, message: value.message || getGiftCardMessages(item.id)[0] })}
                  className={`flex h-12 items-center gap-2 rounded-2xl px-3 text-left text-xs font-black transition ${selected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/70 hover:bg-muted'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sections.includes('suggestions') && (
        <div className="space-y-3">
          <Label>Sugerencias de Mensajes</Label>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {getGiftCardMessages(value.occasion).map((preset) => {
              const selected = value.message === preset;
              return (
                <Button
                  key={preset}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  className={`h-auto w-full justify-start rounded-2xl px-4 py-3 text-left text-xs font-bold whitespace-normal transition-all duration-300 ${selected ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/40 hover:bg-muted'}`}
                  onClick={() => onChange({ message: preset.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH) })}
                >
                  "{preset}"
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {sections.includes('message') && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Mensaje Personalizado</Label>
            <Textarea
              value={value.message}
              onChange={(e) => onChange({ message: e.target.value.slice(0, GIFT_CARD_MAX_MESSAGE_LENGTH) })}
              placeholder="Escribe un mensaje corto especial..."
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

      {sections.includes('active') && showActiveSwitch && (
        <div className="flex items-center justify-between rounded-2xl bg-muted/70 p-4">
          <div>
            <Label>Publicar activa</Label>
            <p className="text-xs text-muted-foreground">Si queda como boceto no recibe codigo.</p>
          </div>
          <Switch checked={value.isActive ?? true} onCheckedChange={(checked) => onChange({ isActive: checked })} />
        </div>
      )}
    </div>
  );

  if (hidePreview) {
    return FormFields;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(300px,430px)_1fr]">
      <section className="space-y-3 md:sticky md:top-4 md:self-start">
        <GiftCardPreview value={value} showActiveBadge={showActiveSwitch} isBuyer={false} />
      </section>
      {FormFields}
    </div>
  );
}
