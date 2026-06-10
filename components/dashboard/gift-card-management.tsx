'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { AlertCircle, BadgeCheck, Check, CheckCircle, Gift, Loader2, Plus, QrCode, Settings, Trash2, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GiftCardDesigner, GiftCardPreview } from '@/components/gift-cards/gift-card-designer';
import {
  deleteStoreIssuedGiftCard,
  updateStoreIssuedGiftCard,
  updateStoreGiftCardPaymentSettings,
  upsertStoreGiftCardTemplate,
  verifyStoreGiftCardPayment,
} from '@/app/actions/gift-cards';

type Store = { id: string; name: string };
type Template = {
  id: string;
  storeId: string;
  name: string;
  amount: number;
  description: string | null;
  designId: number;
  occasion: string | null;
  isActive: boolean;
};
type IssuedCard = {
  id: string;
  code: string | null;
  amount: number;
  balance: number;
  status: string;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  message: string | null;
  templateId: number | null;
  occasion: string | null;
  cardImageUrl: string | null;
  receiptUrl: string | null;
  paymentMethod: string | null;
  transactionNumber: string | null;
  createdAt: Date;
};
type SettingsData = {
  qrUrl: string | null;
  bankDetails: string | null;
  tigoMoney: string | null;
  operatorPhone: string | null;
  maxAmount?: number | null;
} | null;
type Pending = IssuedCard & {
  senderName: string;
  senderEmail: string;
};
type DraftCard = {
  name: string;
  amount: string;
  message: string;
  occasion: string;
  designId: number;
};

const defaultDraft = (): DraftCard => ({
  name: '',
  amount: '',
  message: '',
  occasion: 'otros',
  designId: 1,
});

function IssuedCardGrid({
  cards,
  storeName,
  onOpen,
}: {
  cards: IssuedCard[];
  storeName: string;
  onOpen: (card: IssuedCard) => void;
}) {
  const [visible, setVisible] = useState(9);
  const shown = cards.slice(0, visible);

  useEffect(() => {
    setVisible(9);
  }, [cards.length]);

  return (
    <div
      className="max-h-[72vh] overflow-y-auto pr-1"
      onScroll={(event) => {
        const el = event.currentTarget;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 160) {
          setVisible((current) => Math.min(cards.length, current + 6));
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((card) => (
          <button key={card.id} type="button" onClick={() => onOpen(card)} className="group text-left">
            {card.cardImageUrl ? (
              <div className="relative aspect-[1.62/1] overflow-hidden rounded-[2rem] border bg-muted shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-xl">
                <Image src={card.cardImageUrl} alt="Gift Card" fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" loading="lazy" />
              </div>
            ) : (
              <GiftCardPreview
                value={{
                  storeName,
                  amount: card.amount,
                  recipientName: card.recipientName || '',
                  message: card.message || '',
                  occasion: card.occasion || 'otros',
                  designId: card.templateId || 1,
                }}
                mode="buyer"
                code={card.code || 'SIN IMAGEN'}
              />
            )}
            <div className="mt-2 flex items-center justify-between px-1 text-xs">
              <span className="truncate font-black">{card.recipientName || 'Sin destinatario'}</span>
              <span className="font-black text-muted-foreground">Bs. {card.balance.toFixed(2)}</span>
            </div>
          </button>
        ))}
      </div>
      {visible < cards.length && (
        <div className="py-6 text-center text-xs font-black text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
          Cargando mas Gift Cards...
        </div>
      )}
    </div>
  );
}

export function GiftCardManagement({
  store,
  availableTemplates,
  activeCards,
  inactiveCards,
  settings,
  pending,
  giftCardsEnabled,
}: {
  store: Store | null;
  templates?: Template[];
  availableTemplates: Template[];
  activeCards: IssuedCard[];
  inactiveCards: IssuedCard[];
  settings: SettingsData;
  pending: Pending[];
  giftCardsEnabled: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<DraftCard>(defaultDraft());
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState(settings?.qrUrl || '');
  const [bankDetails, setBankDetails] = useState(settings?.bankDetails || '');
  const [tigoMoney, setTigoMoney] = useState(settings?.tigoMoney || '');
  const [operatorPhone, setOperatorPhone] = useState(settings?.operatorPhone || '');
  const [maxAmount, setMaxAmount] = useState(String(settings?.maxAmount ?? 5000));
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmingCard, setConfirmingCard] = useState<Pending | null>(null);
  const [selectedCard, setSelectedCard] = useState<IssuedCard | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ recipientName: '', recipientEmail: '', recipientPhone: '', message: '' });
  const [localAvailableTemplates, setLocalAvailableTemplates] = useState(availableTemplates);

  const activeStore = store as Store;
  const maxAmountNumber = Number(maxAmount || 5000);
  const createDisabled = savingTemplate || !draft.amount || Number(draft.amount) <= 0 || Number(draft.amount) > maxAmountNumber;

  const sortedActiveCards = useMemo(() => [...activeCards].sort((a, b) => b.balance - a.balance), [activeCards]);

  if (!activeStore) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gift className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-black">No encontramos tu tienda</h2>
          <p className="text-sm text-muted-foreground">Crea o revisa tu tienda antes de habilitar Gift Cards.</p>
        </CardContent>
      </Card>
    );
  }

  function updateDraft(patch: Partial<DraftCard>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handleCreateTemplate(keepOpen = false) {
    setSavingTemplate(true);
    const amount = Number(draft.amount);
    const result = await upsertStoreGiftCardTemplate({
      storeId: activeStore.id,
      name: draft.name.trim() || 'Gift Card',
      amount,
      description: draft.message,
      designId: draft.designId,
      occasion: draft.occasion,
    });
    setSavingTemplate(false);
    if ('error' in result && result.error) return toast.error(result.error);

    setLocalAvailableTemplates((current) => [
      {
        id: 'id' in result && result.id ? result.id : crypto.randomUUID(),
        storeId: activeStore.id,
        name: draft.name.trim() || 'Gift Card',
        amount,
        description: draft.message || null,
        designId: draft.designId,
        occasion: draft.occasion,
        isActive: true,
      },
      ...current,
    ]);
    toast.success('Boceto disponible guardado');
    setDraft(defaultDraft());
    setCreateStep(1);
    if (!keepOpen) setCreateOpen(false);
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

  async function handleVerify(card: Pending, action: 'approve' | 'reject') {
    setProcessingId(card.id);
    const result = await verifyStoreGiftCardPayment(card.id, action);
    setProcessingId(null);
    setConfirmingCard(null);
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('message' in result ? result.message : 'Operacion completada');
    window.location.reload();
  }

  function openIssuedCard(card: IssuedCard) {
    setSelectedCard(card);
    setEditData({
      recipientName: card.recipientName || '',
      recipientEmail: card.recipientEmail || '',
      recipientPhone: card.recipientPhone || '',
      message: card.message || '',
    });
    setEditOpen(false);
  }

  async function handleUpdateIssuedCard() {
    if (!selectedCard) return;
    const result = await updateStoreIssuedGiftCard(selectedCard.id, editData);
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('Gift Card actualizada');
    window.location.reload();
  }

  async function handleDeleteIssuedCard() {
    if (!selectedCard) return;
    const result = await deleteStoreIssuedGiftCard(selectedCard.id);
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('Gift Card eliminada');
    setSelectedCard(null);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      {!giftCardsEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Gift Cards deshabilitado</p>
              <p>Los clientes no pueden ver ni comprar gift cards hasta habilitarlas en configuracion.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Gift Cards</h1>
          <p className="mt-1 text-muted-foreground">Bocetos, verificaciones y tarjetas emitidas de {activeStore.name}.</p>
        </div>
        <Button className="h-12 rounded-2xl gap-2 bg-brand-gradient text-white shadow-premium" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Crear Gift Card
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl p-1 sm:grid-cols-5">
          <TabsTrigger value="available" className="rounded-xl">Disponibles</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl">Verificaciones</TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl">Activas</TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-xl">Inactivas</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl">Datos de pago</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {localAvailableTemplates.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-14 text-center">
                  <Gift className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <h2 className="text-xl font-black">Sin bocetos disponibles</h2>
                  <p className="mb-5 text-sm text-muted-foreground">Crea una Gift Card para que los clientes puedan comprarla o personalizarla.</p>
                  <Button onClick={() => setCreateOpen(true)} className="rounded-2xl">Crear ahora</Button>
                </CardContent>
              </Card>
            ) : localAvailableTemplates.map((template) => (
              <GiftCardPreview
                key={template.id}
                mode="seller"
                code="SIN CODIGO"
                value={{
                  templateName: template.name,
                  storeName: activeStore.name,
                  amount: template.amount,
                  message: template.description || '',
                  occasion: template.occasion || 'otros',
                  designId: template.designId,
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verifications" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pending.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-14 text-center">
                  <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                  <h2 className="text-xl font-black">Sin verificaciones pendientes</h2>
                  <p className="text-sm text-muted-foreground">Las compras pendientes apareceran aqui.</p>
                </CardContent>
              </Card>
            ) : pending.map((card) => {
              const matchingTemplate = localAvailableTemplates.find(t => t.designId === card.templateId);
              return (
              <button key={card.id} type="button" onClick={() => setConfirmingCard(card)} className="group text-left">
                <GiftCardPreview
                  value={{
                    templateName: matchingTemplate?.name || 'Gift Card',
                    storeName: activeStore.name,
                    amount: card.amount,
                    message: card.message || '',
                    occasion: card.occasion || 'otros',
                    designId: card.templateId || 1,
                  }}
                  mode="seller"
                  code="PENDIENTE"
                />
                <div className="mt-2 rounded-xl bg-amber-50 p-2 text-xs">
                  <p className="font-black text-amber-900">De {card.senderName}</p>
                  <p className="truncate text-muted-foreground">{card.senderEmail}</p>
                  <p className="mt-1 text-[10px]">Metodo: {card.paymentMethod || 'N/A'} · Txn: {card.transactionNumber || 'N/A'}</p>
                  {card.receiptUrl && (
                    <a href={card.receiptUrl} target="_blank" rel="noreferrer" className="relative block aspect-video overflow-hidden rounded-xl border bg-muted mt-2">
                      <Image src={card.receiptUrl} alt="Comprobante" fill className="object-contain" />
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleVerify(card, 'reject'); }} disabled={processingId === card.id}>
                      <XCircle className="mr-1 h-4 w-4" /> Rechazar
                    </Button>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setConfirmingCard(card); }} disabled={processingId === card.id}>
                      {processingId === card.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-1 h-4 w-4" />}
                      Aprobar
                    </Button>
                  </div>
                </div>
              </button>
            );
            })}
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {sortedActiveCards.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Aun no hay Gift Cards activas con saldo.</CardContent></Card>
          ) : (
            <IssuedCardGrid cards={sortedActiveCards} storeName={activeStore.name} onOpen={openIssuedCard} />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-0">
          {inactiveCards.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No hay Gift Cards inactivas.</CardContent></Card>
          ) : (
            <IssuedCardGrid cards={inactiveCards} storeName={activeStore.name} onOpen={openIssuedCard} />
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Datos de pago</CardTitle>
              <CardDescription>Estos datos vera el cliente al pagar una Gift Card de tu tienda.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="space-y-3">
                {qrPreview ? (
                  <div className="relative h-52 w-52 overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <Image src={qrPreview} alt="QR" fill className="object-contain p-2" />
                  </div>
                ) : (
                  <div className="flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed text-muted-foreground">
                    <QrCode className="h-10 w-10" />
                  </div>
                )}
                <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  Subir QR
                  <input type="file" accept="image/*" className="hidden" onChange={handleQrFile} />
                </label>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Datos bancarios</Label>
                  <Textarea value={bankDetails} onChange={(event) => setBankDetails(event.target.value)} rows={5} className="font-mono text-sm" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tigo Money</Label>
                    <Input value={tigoMoney} onChange={(event) => setTigoMoney(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefono operador</Label>
                    <Input value={operatorPhone} onChange={(event) => setOperatorPhone(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto maximo</Label>
                    <Input type="number" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} />
                  </div>
                </div>
                <Button className="h-11 w-full rounded-2xl" onClick={handleSaveSettings}>Guardar datos de pago</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent showCloseButton={false} className="!left-0 !top-0 !flex !h-[100svh] !max-h-[100svh] !w-[100vw] !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-none p-0 sm:!left-1/2 sm:!top-1/2 sm:!h-[calc(100svh-2rem)] sm:!max-h-[calc(100svh-2rem)] sm:!w-[min(980px,calc(100vw-2rem))] sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:rounded-[2rem]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 bg-brand-gradient px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white sm:p-5">
              <DialogTitle className="text-xl font-black sm:text-2xl">Crear Gift Card</DialogTitle>
              <DialogDescription className="text-white/75">Paso {createStep} de 3</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-scroll overscroll-contain bg-muted/30 px-4 py-4 pb-28 [-webkit-overflow-scrolling:touch] sm:px-5">
              <GiftCardDesigner
                mode="seller"
                value={{ templateName: draft.name, storeName: activeStore.name, amount: draft.amount, message: draft.message, occasion: draft.occasion, designId: draft.designId }}
                onChange={(patch) => updateDraft({
                  name: patch.templateName ?? draft.name,
                  amount: patch.amount !== undefined ? String(patch.amount) : draft.amount,
                  message: patch.message ?? draft.message,
                  occasion: patch.occasion ?? draft.occasion,
                  designId: patch.designId ?? draft.designId,
                })}
                sections={createStep === 1 ? ['details'] : createStep === 2 ? ['occasion', 'suggestions'] : ['style']}
                maxAmount={maxAmountNumber}
              />
            </div>
            <DialogFooter className="shrink-0 border-t bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur sm:p-4">
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                <Button variant="ghost" className="h-12 rounded-2xl" onClick={() => { setCreateOpen(false); setCreateStep(1); }} disabled={savingTemplate}>Cancelar</Button>
                <Button variant="outline" className="h-12 rounded-2xl" disabled={createStep === 1 || savingTemplate} onClick={() => setCreateStep((step) => (step - 1) as 1 | 2 | 3)}>Atras</Button>
                {createStep < 3 ? (
                  <Button className="col-span-2 h-12 rounded-2xl" onClick={() => setCreateStep((step) => (step + 1) as 1 | 2 | 3)} disabled={createStep === 1 && createDisabled}>Siguiente</Button>
                ) : (
                  <>
                    <Button className="h-12 rounded-2xl" variant="outline" onClick={() => handleCreateTemplate(true)} disabled={createDisabled}>
                      {savingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      <span className="hidden sm:inline">Guardar y crear otra</span>
                      <span className="sm:hidden">Guardar otra</span>
                    </Button>
                    <Button className="h-12 rounded-2xl" onClick={() => handleCreateTemplate(false)} disabled={createDisabled}>
                      {savingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Guardar
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmingCard} onOpenChange={(open) => !open && setConfirmingCard(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Activar Gift Card</DialogTitle>
            <DialogDescription>Se asignara un codigo seguro, se generara la imagen y se guardara en Cloudflare R2.</DialogDescription>
          </DialogHeader>
          {confirmingCard && (
            <div className="rounded-2xl bg-muted p-4 text-sm">
              <div className="flex justify-between"><span>Monto</span><strong>Bs. {confirmingCard.amount.toFixed(2)}</strong></div>
              <div className="mt-2 flex justify-between"><span>Para</span><strong>{confirmingCard.recipientName || 'Sin nombre'}</strong></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingCard(null)}>Cancelar</Button>
            {confirmingCard && (
              <Button onClick={() => handleVerify(confirmingCard, 'approve')} disabled={processingId === confirmingCard.id}>
                {processingId === confirmingCard.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Confirmar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {selectedCard && (
            <>
              <DialogHeader className="p-5 pb-0">
                <DialogTitle>Detalle de Gift Card</DialogTitle>
                <DialogDescription>Saldo disponible: Bs. {selectedCard.balance.toFixed(2)}</DialogDescription>
              </DialogHeader>
              <div className="max-h-[75vh] overflow-y-auto p-5 space-y-4">
                {selectedCard.cardImageUrl ? (
                  <div className="relative aspect-[1.62/1] overflow-hidden rounded-[2rem] border bg-muted">
                    <Image src={selectedCard.cardImageUrl} alt="Gift Card" fill className="object-cover" />
                  </div>
                ) : (
                  <GiftCardPreview
                    value={{ storeName: activeStore.name, amount: selectedCard.amount, recipientName: selectedCard.recipientName || '', message: selectedCard.message || '', occasion: selectedCard.occasion || 'otros', designId: selectedCard.templateId || 1 }}
                    mode="buyer"
                    code={selectedCard.code || 'SIN IMAGEN'}
                  />
                )}
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Codigo:</span> <strong>{selectedCard.code || 'Pendiente'}</strong></p>
                  <p><span className="text-muted-foreground">Estado:</span> <strong>{selectedCard.status}</strong></p>
                  <p><span className="text-muted-foreground">Monto inicial:</span> <strong>Bs. {selectedCard.amount.toFixed(2)}</strong></p>
                  <p><span className="text-muted-foreground">Saldo:</span> <strong>Bs. {selectedCard.balance.toFixed(2)}</strong></p>
                </div>
                {editOpen && (
                  <div className="space-y-3 rounded-2xl border p-4">
                    <Input placeholder="Destinatario" value={editData.recipientName} onChange={(event) => setEditData((data) => ({ ...data, recipientName: event.target.value }))} />
                    <Input placeholder="Email" value={editData.recipientEmail} onChange={(event) => setEditData((data) => ({ ...data, recipientEmail: event.target.value }))} />
                    <Input placeholder="Telefono" value={editData.recipientPhone} onChange={(event) => setEditData((data) => ({ ...data, recipientPhone: event.target.value }))} />
                    <Textarea placeholder="Mensaje" value={editData.message} onChange={(event) => setEditData((data) => ({ ...data, message: event.target.value }))} />
                    <Button className="w-full" onClick={handleUpdateIssuedCard}>Guardar cambios</Button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setEditOpen((open) => !open)}>Editar datos</Button>
                  <Button variant="destructive" onClick={handleDeleteIssuedCard}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
