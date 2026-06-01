'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
  Plus,
  QrCode,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from '@/components/gift-cards/gift-card-templates';
import { GIFT_CARD_MAX_MESSAGE_LENGTH, GIFT_CARD_OCCASIONS, getGiftCardMessages, getGiftCardOccasion } from '@/components/gift-cards/gift-card-customization';
import { GiftCardDesigner } from '@/components/gift-cards/gift-card-designer';
import {
  toggleStoreGiftCardTemplate,
  updateStoreGiftCardPaymentSettings,
  upsertStoreGiftCardTemplate,
  verifyStoreGiftCardPayment,
} from '@/app/actions/gift-cards';

type Store = { id: string; name: string };
type Template = {
  id: string;
  storeId: string;
  name: string;
  code: string | null;
  amount: number;
  description: string | null;
  designId: number;
  occasion: string | null;
  isActive: boolean;
};
type SettingsData = {
  qrUrl: string | null;
  bankDetails: string | null;
  tigoMoney: string | null;
  operatorPhone: string | null;
  maxAmount?: number | null;
} | null;
type Pending = {
  id: string;
  amount: number;
  recipientName: string | null;
  recipientEmail: string | null;
  paymentMethod: string | null;
  transactionNumber: string | null;
  receiptUrl: string | null;
  senderName: string;
  senderEmail: string;
  createdAt: Date;
};
type DraftCard = {
  name: string;
  amount: string;
  message: string;
  occasion: string;
  designId: number;
  isActive: boolean;
};

const defaultDraft = (): DraftCard => ({
  name: '',
  amount: '',
  message: '',
  occasion: 'otros',
  designId: 1,
  isActive: true,
});

export function GiftCardManagement({
  store,
  templates,
  settings,
  pending,
}: {
  store: Store | null;
  templates: Template[];
  settings: SettingsData;
  pending: Pending[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [drafts, setDrafts] = useState<DraftCard[]>([defaultDraft()]);
  const [activeDraftIndex, setActiveDraftIndex] = useState(0);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState(settings?.qrUrl || '');
  const [bankDetails, setBankDetails] = useState(settings?.bankDetails || '');
  const [tigoMoney, setTigoMoney] = useState(settings?.tigoMoney || '');
  const [operatorPhone, setOperatorPhone] = useState(settings?.operatorPhone || '');
  const [maxAmount, setMaxAmount] = useState<string>(String(settings?.maxAmount ?? 5000));
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!store) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h2 className="text-xl font-black">No encontramos tu tienda</h2>
          <p className="text-sm text-muted-foreground">Crea o revisa tu tienda antes de habilitar Gift Cards.</p>
        </CardContent>
      </Card>
    );
  }
  const activeStore = store;

  function updateDraft(index: number, patch: Partial<DraftCard>) {
    setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  }

  function addDraft() {
    setDrafts((current) => {
      const next = [...current, defaultDraft()];
      setActiveDraftIndex(next.length - 1);
      return next;
    });
  }

  function removeDraft(index: number) {
    setDrafts((current) => {
      if (current.length === 1) return current;
      const next = current.filter((_, i) => i !== index);
      setActiveDraftIndex((active) => Math.min(active, next.length - 1));
      return next;
    });
  }

  async function handleCreateTemplates() {
    setSavingTemplates(true);
    for (const draft of drafts) {
      const result = await upsertStoreGiftCardTemplate({
        storeId: activeStore.id,
        name: draft.name,
        amount: Number(draft.amount),
        description: draft.message,
        designId: draft.designId,
        occasion: draft.occasion,
        isActive: draft.isActive,
      });
      if ('error' in result && result.error) {
        setSavingTemplates(false);
        toast.error(result.error);
        return;
      }
    }
    toast.success(drafts.length === 1 ? 'Gift Card creada' : 'Gift Cards creadas');
    setSavingTemplates(false);
    setCreateOpen(false);
    setDrafts([defaultDraft()]);
    setActiveDraftIndex(0);
    window.location.reload();
  }

  function handleQrFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadQr() {
    if (!qrFile) return qrPreview;
    const fd = new FormData();
    fd.append('file', qrFile);
    const response = await fetch('/api/upload/payment-proof', { method: 'POST', body: fd });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo subir el QR');
    return result.url as string;
  }

  async function handleSaveSettings() {
    try {
      const qrUrl = await uploadQr();
      const result = await updateStoreGiftCardPaymentSettings({
        storeId: activeStore.id,
        qrUrl,
        bankDetails,
        tigoMoney,
        operatorPhone,
        maxAmount: Number(maxAmount),
      });
      if ('error' in result && result.error) return toast.error(result.error);
      toast.success('Datos de pago actualizados');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar');
    }
  }

  async function handleToggle(id: string, checked: boolean) {
    const result = await toggleStoreGiftCardTemplate(id, checked);
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success(checked ? 'Gift Card activa' : 'Gift Card inactiva');
    window.location.reload();
  }

  async function handleVerify(id: string, action: 'approve' | 'reject') {
    setProcessingId(id);
    const result = await verifyStoreGiftCardPayment(id, action);
    setProcessingId(null);
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('message' in result ? result.message : 'Operacion completada');
    window.location.reload();
  }

  const activeCount = templates.filter((template) => template.isActive).length;
  const inactiveCount = templates.length - activeCount;
  const activeDraft = drafts[activeDraftIndex] || drafts[0];
  const activeDraftVisual = getGiftCardTemplate(activeDraft.designId);
  const ActiveDraftIcon = getGiftCardOccasion(activeDraft.occasion).icon;
  const createDisabled = savingTemplates || drafts.some((draft) => !draft.name || !draft.amount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Gift Cards</h1>
          <p className="text-muted-foreground mt-1">Disena, publica y verifica las tarjetas de {activeStore.name}.</p>
        </div>
        <Button className="h-12 rounded-2xl gap-2 bg-brand-gradient text-white shadow-premium" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Crear Gift Card
        </Button>
      </div>

      <Tabs defaultValue="cards" className="space-y-5">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 rounded-2xl h-12 p-1">
          <TabsTrigger value="cards" className="rounded-xl gap-2"><Gift className="h-4 w-4" /> Gift Cards</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl gap-2"><BadgeCheck className="h-4 w-4" /> Verificaciones</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl gap-2"><Settings className="h-4 w-4" /> Datos de pago</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-14 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h2 className="font-black text-xl">Aun no creaste Gift Cards</h2>
                  <p className="text-sm text-muted-foreground mb-5">Crea una o varias tarjetas para que tus clientes puedan regalarlas.</p>
                  <Button onClick={() => setCreateOpen(true)} className="rounded-2xl">Crear ahora</Button>
                </CardContent>
              </Card>
            ) : templates.map((template) => {
              const visual = getGiftCardTemplate(template.designId);
              const occasion = getGiftCardOccasion(template.occasion);
              const OccasionIcon = occasion.icon;
              return (
                <article
                  key={template.id}
                  className={`card-shine group relative aspect-[1.62/1] overflow-hidden rounded-[2rem] p-5 text-white shadow-premium transition hover:-translate-y-0.5 hover:shadow-2xl ${visual.className}`}
                >
                  <div className="absolute inset-0 rounded-[2rem] ring-1 ring-white/25" />
                  <div className="absolute right-4 top-4 opacity-15"><Gift size={104} /></div>

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{activeStore.name}</p>
                        <h3 className="mt-1 text-2xl font-black leading-tight">{template.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold opacity-75">
                          <OccasionIcon className="h-3.5 w-3.5" />
                          {occasion.label} · {visual.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ring-1 ring-white/20 ${template.isActive ? 'bg-emerald-400/25' : 'bg-zinc-950/35'}`}>
                          {template.isActive ? 'Activa' : 'Boceto'}
                        </span>
                        <Switch checked={template.isActive} onCheckedChange={(checked) => handleToggle(template.id, checked)} />
                      </div>
                    </div>

                    {template.description && (
                      <p className="max-w-[78%] overflow-hidden text-ellipsis text-xs font-semibold opacity-80">"{template.description}"</p>
                    )}

                    <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Codigo</p>
                        <p className="font-mono text-xs font-black tracking-widest">
                          {template.isActive && template.code ? template.code : 'SIN CODIGO'}
                        </p>
                      </div>
                      <p className="shrink-0 text-3xl font-black">Bs. {template.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {templates.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">{activeCount} activas · {inactiveCount} bocetos</p>
          )}
        </TabsContent>

        <TabsContent value="verifications" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pending.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-14 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                  <h2 className="font-black text-xl">Sin verificaciones pendientes</h2>
                  <p className="text-sm text-muted-foreground">Cuando un cliente compre una Gift Card de tu tienda, aparecera aqui.</p>
                </CardContent>
              </Card>
            ) : pending.map((card) => (
              <Card key={card.id} className="overflow-hidden shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Bs. {card.amount.toFixed(2)}</CardTitle>
                      <CardDescription>De {card.senderName}</CardDescription>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">Pendiente</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Para:</span> <strong>{card.recipientName || 'Sin nombre'}</strong></p>
                    <p className="text-xs text-muted-foreground truncate">{card.senderEmail}</p>
                    <p className="text-xs">Metodo: {card.paymentMethod || 'N/A'} · Txn: {card.transactionNumber || 'N/A'}</p>
                  </div>
                  {card.receiptUrl && (
                    <a href={card.receiptUrl} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-xl overflow-hidden border bg-muted">
                      <Image src={card.receiptUrl} alt="Comprobante" fill className="object-contain" />
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="destructive" size="sm" onClick={() => handleVerify(card.id, 'reject')} disabled={processingId === card.id}>
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                    <Button size="sm" onClick={() => handleVerify(card.id, 'approve')} disabled={processingId === card.id}>
                      {processingId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Aprobar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Datos de pago</CardTitle>
              <CardDescription>Estos datos vera el cliente al comprar una Gift Card de tu tienda.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                {qrPreview ? (
                  <div className="relative h-52 w-52 rounded-2xl overflow-hidden border bg-white shadow-sm">
                    <Image src={qrPreview} alt="QR" fill className="object-contain p-2" />
                  </div>
                ) : (
                  <div className="h-52 w-52 rounded-2xl border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <QrCode className="h-10 w-10" />
                  </div>
                )}
                <label className="flex h-11 cursor-pointer items-center justify-center rounded-xl border gap-2 text-sm font-bold hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Subir QR
                  <input type="file" accept="image/*" className="hidden" onChange={handleQrFile} />
                </label>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Datos bancarios</Label>
                  <Textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={5} className="font-mono text-sm" />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tigo Money</Label>
                    <Input value={tigoMoney} onChange={(e) => setTigoMoney(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono operador</Label>
                    <Input value={operatorPhone} onChange={(e) => setOperatorPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto máximo Gift Card</Label>
                    <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="5000" />
                  </div>
                </div>
                <Button className="w-full h-11 rounded-2xl" onClick={handleSaveSettings}>Guardar datos de pago</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent
          showCloseButton={false}
          className="!left-0 !top-0 !flex !h-[100svh] !max-h-[100svh] !w-[100vw] !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-none p-0 sm:!left-1/2 sm:!top-1/2 sm:!h-[calc(100svh-2rem)] sm:!max-h-[calc(100svh-2rem)] sm:!w-[calc(100vw-2rem)] sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:rounded-[2rem] md:!w-[calc(100vw-18rem)] xl:!w-[1040px]"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 bg-brand-gradient px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white sm:p-5">
              <div className="flex items-start justify-between gap-3 pr-10">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-xl font-black sm:text-2xl">
                    <Sparkles className="h-5 w-5" />
                    Crear Gift Cards
                  </DialogTitle>
                  <DialogDescription className="text-white/75">
                    Disena una o varias tarjetas para publicar en tu tienda.
                  </DialogDescription>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black ring-1 ring-white/20">
                  {activeDraftIndex + 1}/{drafts.length}
                </span>
              </div>
              <div className="mt-4 flex gap-1 items-center">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${createStep >= s ? 'bg-white text-primary' : 'bg-white/25 text-white'}`}>
                      {s}
                    </div>
                    {s < 3 && <div className={`h-0.5 w-8 rounded-full ${createStep > s ? 'bg-white' : 'bg-white/25'}`} />}
                  </div>
                ))}
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 touch-pan-y overflow-y-scroll overscroll-contain bg-muted/30 px-4 py-4 pb-32 [-webkit-overflow-scrolling:touch] sm:px-5">
              <div className="mx-auto max-w-5xl space-y-4">
                <GiftCardDesigner
                  value={{
                    templateName: activeDraft.name,
                    storeName: activeStore.name,
                    amount: activeDraft.amount,
                    message: activeDraft.message,
                    occasion: activeDraft.occasion,
                    designId: activeDraft.designId,
                    isActive: activeDraft.isActive,
                  }}
                  onChange={(patch) => updateDraft(activeDraftIndex, {
                    name: patch.templateName ?? activeDraft.name,
                    amount: patch.amount !== undefined ? String(patch.amount) : activeDraft.amount,
                    message: patch.message ?? activeDraft.message,
                    occasion: patch.occasion ?? activeDraft.occasion,
                    designId: patch.designId ?? activeDraft.designId,
                    isActive: patch.isActive ?? activeDraft.isActive,
                  })}
                  showTemplateFields={createStep === 1}
                  showActiveSwitch={createStep === 3}
                  sections={
                    createStep === 1
                      ? ['details']
                      : createStep === 2
                      ? ['occasion', 'suggestions', 'message']
                      : ['style', 'active']
                  }
                  maxAmount={Number(maxAmount || 5000)}
                />

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {drafts.map((draft, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveDraftIndex(index)}
                      className={`h-10 shrink-0 rounded-full px-4 text-xs font-black transition ${index === activeDraftIndex ? 'bg-foreground text-background shadow-sm' : 'bg-background text-foreground ring-1 ring-border'}`}
                    >
                      Gift Card {index + 1}
                      {draft.name ? ` - ${draft.name.slice(0, 12)}` : ''}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" className="h-11 rounded-2xl" disabled={activeDraftIndex === 0} onClick={() => setActiveDraftIndex((index) => Math.max(0, index - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" className="h-11 rounded-2xl" disabled={drafts.length === 1} onClick={() => removeDraft(activeDraftIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" className="h-11 rounded-2xl" disabled={activeDraftIndex === drafts.length - 1} onClick={() => setActiveDraftIndex((index) => Math.min(drafts.length - 1, index + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur sm:p-4">
              <div className="grid w-full grid-cols-[1fr_1fr_1.3fr] gap-2">
                <Button variant="ghost" className="h-12 rounded-2xl" onClick={() => { setCreateOpen(false); setCreateStep(1); }} disabled={savingTemplates}>
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
                {createStep > 1 ? (
                  <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setCreateStep((s) => (s - 1) as any)}>
                    Atrás
                  </Button>
                ) : (
                  <Button variant="outline" className="h-12 rounded-2xl border-dashed" onClick={addDraft} disabled={savingTemplates}>
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Agregar</span>
                    <span className="sm:hidden">Otra</span>
                  </Button>
                )}
                {createStep < 3 ? (
                  <Button
                    className="h-12 rounded-2xl"
                    onClick={() => {
                      if (createStep === 1) {
                        if (!activeDraft.name.trim()) return toast.error('El nombre es obligatorio');
                        if (!activeDraft.amount || Number(activeDraft.amount) <= 0) return toast.error('Ingresa un monto válido');
                        if (Number(activeDraft.amount) > Number(maxAmount || 5000)) return toast.error(`El monto máximo es Bs. ${Number(maxAmount || 5000)}`);
                      }
                      setCreateStep((s) => (s + 1) as any);
                    }}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button onClick={handleCreateTemplates} disabled={createDisabled} className="h-12 rounded-2xl">
                    {savingTemplates ? <Loader2 className="h-4 w-4 animate-spin sm:mr-2" /> : <Check className="h-4 w-4 sm:mr-2" />}
                    <span>Crear {drafts.length}</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
