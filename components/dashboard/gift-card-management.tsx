'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { AlertCircle, BadgeCheck, Check, CheckCircle, Gift, Loader2, Plus, QrCode, Receipt, Settings, Trash2, Upload, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GiftCardDesigner, GiftCardPreview, GiftCardPreviewFromRecord, type CustomCardStyle } from '@/components/gift-cards/gift-card-designer';
import {
  deleteStoreIssuedGiftCard,
  updateStoreIssuedGiftCard,
  updateStoreGiftCardPaymentSettings,
  upsertStoreGiftCardTemplate,
  verifyStoreGiftCardPayment,
  deleteStoreGiftCardTemplate,
  sellStoreGiftCardDirectly,
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
  customStyle?: string | null;
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
  storeGiftCardTemplateId?: string | null;
  occasion: string | null;
  cardImageUrl: string | null;
  receiptUrl: string | null;
  paymentMethod: string | null;
  transactionNumber: string | null;
  customStyle?: string | null;
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
  customStyle: CustomCardStyle | null;
};

const defaultDraft = (): DraftCard => ({
  name: '',
  amount: '',
  message: '',
  occasion: 'otros',
  designId: 1,
  customStyle: {
    useCustom: false,
    colors: ['#ec4899', '#8b5cf6'],
    angle: 135,
    type: 'linear',
    iconId: 'gift',
    bgIconId: 'gift',
    centerX: 50,
    centerY: 50,
  },
});

// ── Receipt Preview with zoom/magnifier ──────────────────────────────────────
function ReceiptPreview({ url, isMobile }: { url: string; isMobile?: boolean }) {
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zoomScale, setZoomScale] = useState(300); // percentage for backgroundSize
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(300);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (!showZoom) setShowZoom(true);
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - left) / width) * 100,
      y: ((e.clientY - top) / height) * 100,
    });
    setZoomScale(300); // Default desktop zoom scale
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialDistanceRef.current = dist;
      initialScaleRef.current = zoomScale;
      setShowZoom(true);
    } else if (e.touches.length === 1) {
      // Single finger start: check if we should zoom in or just track position
      if (!showZoom) {
        setShowZoom(true);
        setZoomScale(250); // initial zoom level on single touch
      }
      const touch = e.touches[0];
      if (containerRef.current) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        setZoomPos({
          x: ((touch.clientX - left) / width) * 100,
          y: ((touch.clientY - top) / height) * 100,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      // Pinch zoom in action
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialDistanceRef.current;
      setZoomScale(Math.min(600, Math.max(150, initialScaleRef.current * factor)));
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      setZoomPos({
        x: ((touch.clientX - left) / width) * 100,
        y: ((touch.clientY - top) / height) * 100,
      });
    }
  };

  const handleTouchEnd = () => {
    initialDistanceRef.current = null;
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border bg-muted shadow-sm select-none cursor-zoom-in w-full"
      style={{ aspectRatio: '3/4' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showZoom ? (
        <div
          className="absolute inset-0 bg-no-repeat pointer-events-none transition-all duration-75"
          style={{
            backgroundImage: `url(${url})`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundSize: `${zoomScale}%`,
          }}
        />
      ) : (
        <Image
          src={url}
          alt="Comprobante de pago"
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 100vw, 400px"
          priority
        />
      )}
      <div className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm pointer-events-none">
        {showZoom ? 'Arrastra / Pincha' : 'Toca para Zoom'}
      </div>
    </div>
  );
}

function IssuedCardGrid({
  cards,
  storeName,
  templates,
  onOpen,
}: {
  cards: IssuedCard[];
  storeName: string;
  templates: Template[];
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
        {shown.map((card) => {
          const matchingTemplate = templates.find(t => String(t.id) === String(card.storeGiftCardTemplateId));
          return (
            <button key={card.id} type="button" onClick={() => onOpen(card)} className="group text-left w-full">
              <GiftCardPreviewFromRecord
                record={card}
                template={matchingTemplate}
                storeName={storeName}
                mode="buyer"
                code={card.code || 'ACTIVA'}
              />
              <div className="mt-2 flex items-center justify-between px-1 text-xs">
                <span className="truncate font-black">{card.recipientName || 'Sin destinatario'}</span>
                <span className="font-black text-muted-foreground">Bs. {card.balance.toFixed(2)}</span>
              </div>
            </button>
          );
        })}
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
  templates = [],
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
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [mobilePendingCard, setMobilePendingCard] = useState<Pending | null>(null);

  const [selectedTemplateForActions, setSelectedTemplateForActions] = useState<Template | null>(null);
  const [sellingTemplate, setSellingTemplate] = useState<Template | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [sellForm, setSellForm] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    message: '',
    recipientId: '',
    paymentMethod: 'efectivo',
    transactionNumber: '',
  });

  const selectedPendingCard = useMemo(() => {
    return pending.find(c => c.id === selectedPendingId) || pending[0] || null;
  }, [pending, selectedPendingId]);

  useEffect(() => {
    if (pending.length > 0 && !selectedPendingId) {
      setSelectedPendingId(pending[0].id);
    }
  }, [pending, selectedPendingId]);

  const activeStore = store as Store;
  const maxAmountNumber = Number(maxAmount || 5000);
  const createDisabled = savingTemplate || !draft.amount || Number(draft.amount) <= 0 || Number(draft.amount) > maxAmountNumber;

  const sortedActiveCards = useMemo(() => [...activeCards].sort((a, b) => b.balance - a.balance), [activeCards]);
  const templateCatalog = useMemo(() => {
    const map = new Map<string, Template>();
    for (const template of templates) map.set(template.id, template);
    for (const template of localAvailableTemplates) map.set(template.id, template);
    return Array.from(map.values());
  }, [templates, localAvailableTemplates]);

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
      id: editingTemplateId || undefined,
      storeId: activeStore.id,
      name: draft.name.trim() || 'Gift Card',
      amount,
      description: draft.message,
      designId: draft.designId,
      occasion: draft.occasion,
      customStyle: JSON.stringify(draft.customStyle || {}),
    });
    setSavingTemplate(false);
    if ('error' in result && result.error) return toast.error(result.error);

    if (editingTemplateId) {
      setLocalAvailableTemplates((current) =>
        current.map((t) =>
          t.id === editingTemplateId
            ? {
                ...t,
                name: draft.name.trim() || 'Gift Card',
                amount,
                description: draft.message || null,
                designId: draft.designId,
                occasion: draft.occasion,
                customStyle: JSON.stringify(draft.customStyle || {}),
              }
            : t
        )
      );
      toast.success('Boceto disponible actualizado');
    } else {
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
          customStyle: JSON.stringify(draft.customStyle || {}),
        },
        ...current,
      ]);
      toast.success('Boceto disponible guardado');
    }

    setDraft(defaultDraft());
    setEditingTemplateId(null);
    setCreateStep(1);
    if (!keepOpen) setCreateOpen(false);
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este boceto de Gift Card?')) return;
    setProcessingId(templateId);
    const result = await deleteStoreGiftCardTemplate(templateId);
    setProcessingId(null);
    if ('error' in result && result.error) return toast.error(result.error);
    setLocalAvailableTemplates((current) => current.filter((t) => t.id !== templateId));
    toast.success('Boceto eliminado correctamente');
    setSelectedTemplateForActions(null);
  }

  async function handleSellDirectly() {
    if (!sellingTemplate) return;
    if (!sellForm.recipientName.trim()) {
      return toast.error('El nombre del destinatario es obligatorio.');
    }
    if ((sellForm.paymentMethod === 'qr' || sellForm.paymentMethod === 'transferencia') && !sellForm.transactionNumber.trim()) {
      return toast.error('El número de transacción es obligatorio.');
    }

    setProcessingId(sellingTemplate.id);
    const result = await sellStoreGiftCardDirectly({
      templateId: sellingTemplate.id,
      recipientName: sellForm.recipientName,
      recipientEmail: sellForm.recipientEmail || undefined,
      recipientPhone: sellForm.recipientPhone || undefined,
      message: sellForm.message || undefined,
      recipientId: sellForm.recipientId || undefined,
      paymentMethod: sellForm.paymentMethod,
      transactionNumber: sellForm.transactionNumber || undefined,
    });
    setProcessingId(null);

    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('Gift Card vendida y activada directamente.');
    setSellingTemplate(null);
    setSellForm({
      recipientName: '',
      recipientEmail: '',
      recipientPhone: '',
      message: '',
      recipientId: '',
      paymentMethod: 'efectivo',
      transactionNumber: '',
    });
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
        <Button className="h-12 rounded-2xl gap-2 bg-brand-gradient text-white shadow-premium" onClick={() => { setDraft(defaultDraft()); setEditingTemplateId(null); setCreateStep(1); setCreateOpen(true); }}>
          <Plus className="h-4 w-4" />
          Crear Gift Card
        </Button>
      </div>

      <Tabs defaultValue="available" className="space-y-5">
        <TabsList className="flex h-12 w-full items-center justify-start gap-1 overflow-x-auto rounded-2xl bg-muted p-1 scrollbar-none select-none">
          <TabsTrigger value="available" className="rounded-xl shrink-0">Disponibles</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl shrink-0">Verificaciones</TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl shrink-0">Activas</TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-xl shrink-0">Inactivas</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl shrink-0">Datos de pago</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {localAvailableTemplates.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="py-14 text-center">
                  <Gift className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                  <h2 className="text-xl font-black">Sin bocetos disponibles</h2>
                  <p className="mb-5 text-sm text-muted-foreground">Crea una Gift Card para que los clientes puedan comprarla o personalizarla.</p>
                  <Button onClick={() => { setDraft(defaultDraft()); setEditingTemplateId(null); setCreateStep(1); setCreateOpen(true); }} className="rounded-2xl">Crear ahora</Button>
                </CardContent>
              </Card>
            ) : localAvailableTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateForActions(template)}
                className="group text-left w-full rounded-[2rem] transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <GiftCardPreviewFromRecord
                  record={{ ...template, designId: template.designId }}
                  storeName={activeStore.name}
                  mode="seller"
                  code="SIN CODIGO"
                />
                <p className="mt-2 text-center text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                  Bs. {template.amount.toFixed(2)} · {template.name} · Toca para gestionar
                </p>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verifications" className="mt-0">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h2 className="text-xl font-black">Sin verificaciones pendientes</h2>
                <p className="text-sm text-muted-foreground">Las compras pendientes aparecerán aquí.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Left: scrollable card list */}
              <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 max-h-[80vh] overflow-y-auto space-y-3 pr-1 pt-2">
                {pending.map((card) => {
                  const isSelected = selectedPendingId === card.id;
                  const matchingTemplate = templateCatalog.find(t => String(t.id) === String(card.storeGiftCardTemplateId));
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedPendingId(card.id)}
                      className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                          : 'border-border hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      {/* Gift Card preview */}
                      <div className="p-3 pb-0">
                        <GiftCardPreviewFromRecord
                          record={card}
                          template={matchingTemplate}
                          storeName={activeStore.name}
                          mode="buyer"
                          code="PENDIENTE"
                        />
                      </div>
                      <div className="mt-2 rounded-xl bg-amber-50 p-2 text-xs">
                        <p className="font-black text-amber-900">De {card.senderName}</p>
                        <p className="truncate text-muted-foreground">{card.senderEmail}</p>
                        <p className="mt-1 text-[10px]">Método: {card.paymentMethod || 'N/A'} · Txn: {card.transactionNumber || 'N/A'}</p>
                        
                        {/* Mobile display of receipt comparison button */}
                        {card.receiptUrl && (
                          <div className="md:hidden mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full rounded-xl text-xs gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobilePendingCard(card);
                              }}
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Ver Comprobante
                            </Button>
                          </div>
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

              {/* Right: receipt preview (desktop only) */}
              <div className="hidden md:flex flex-1 flex-col gap-3 sticky top-4 w-full">
                <div className="flex items-center gap-2 text-sm font-black text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  Comprobante de pago
                </div>
                {selectedPendingCard?.receiptUrl ? (
                  <ReceiptPreview url={selectedPendingCard.receiptUrl} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-muted/30 text-muted-foreground w-full h-[450px]">
                    <p className="text-xs">Selecciona una tarjeta para ver el comprobante</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {sortedActiveCards.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Aun no hay Gift Cards activas con saldo.</CardContent></Card>
          ) : (
            <IssuedCardGrid cards={sortedActiveCards} storeName={activeStore.name} templates={templateCatalog} onOpen={openIssuedCard} />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-0">
          {inactiveCards.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No hay Gift Cards inactivas.</CardContent></Card>
          ) : (
            <IssuedCardGrid cards={inactiveCards} storeName={activeStore.name} templates={templateCatalog} onOpen={openIssuedCard} />
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
                value={{
                  templateName: draft.name,
                  storeName: activeStore.name,
                  amount: draft.amount,
                  message: draft.message,
                  occasion: draft.occasion,
                  designId: draft.designId,
                  customStyle: draft.customStyle,
                }}
                onChange={(patch) => updateDraft({
                  name: patch.templateName ?? draft.name,
                  amount: patch.amount !== undefined ? String(patch.amount) : draft.amount,
                  message: patch.message ?? draft.message,
                  occasion: patch.occasion ?? draft.occasion,
                  designId: patch.designId ?? draft.designId,
                  customStyle: patch.customStyle !== undefined ? patch.customStyle : draft.customStyle,
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
                <GiftCardPreviewFromRecord
                  record={selectedCard}
                  template={templateCatalog.find(t => String(t.id) === String(selectedCard.storeGiftCardTemplateId))}
                  storeName={activeStore.name}
                  mode="buyer"
                  code={selectedCard.code || 'ACTIVA'}
                />
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

      <Dialog open={!!mobilePendingCard} onOpenChange={(open) => !open && setMobilePendingCard(null)}>
        <DialogContent className="!left-0 !bottom-0 !top-auto !translate-x-0 !translate-y-0 !max-w-none w-full max-h-[92vh] flex flex-col rounded-t-[2rem] border bg-background p-0 outline-none animate-in slide-in-from-bottom duration-300">
          {mobilePendingCard && (
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <DialogHeader className="p-5 border-b shrink-0">
                <DialogTitle className="text-lg font-black">Comprobación de Pago</DialogTitle>
                <DialogDescription>Compara los datos ingresados con la captura de pantalla.</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 pb-24">
                <div className="rounded-2xl bg-amber-50 p-3 text-xs space-y-1.5 border border-amber-200">
                  <p><span className="text-muted-foreground font-bold">Monto:</span> <strong className="text-sm text-amber-900">Bs. {mobilePendingCard.amount.toFixed(2)}</strong></p>
                  <p><span className="text-muted-foreground">De:</span> <strong>{mobilePendingCard.senderName} ({mobilePendingCard.senderEmail})</strong></p>
                  <p><span className="text-muted-foreground">Método:</span> <strong className="capitalize">{mobilePendingCard.paymentMethod || 'N/A'}</strong></p>
                  {mobilePendingCard.transactionNumber && (
                    <p><span className="text-muted-foreground">N° Transacción:</span> <strong className="font-mono text-amber-900">{mobilePendingCard.transactionNumber}</strong></p>
                  )}
                </div>
                {mobilePendingCard.receiptUrl && (
                  <div className="mt-2">
                    <ReceiptPreview url={mobilePendingCard.receiptUrl} isMobile={true} />
                  </div>
                )}
              </div>
              <DialogFooter className="shrink-0 border-t bg-background/95 p-4 shadow-[0_-12px_35px_rgba(0,0,0,0.08)]">
                <div className="grid w-full grid-cols-2 gap-2">
                  <Button variant="destructive" className="h-12 rounded-2xl" onClick={() => { handleVerify(mobilePendingCard, 'reject'); setMobilePendingCard(null); }}>
                    Rechazar
                  </Button>
                  <Button className="h-12 rounded-2xl" onClick={() => { setConfirmingCard(mobilePendingCard); setMobilePendingCard(null); }}>
                    Aprobar
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Acciones de boceto de Gift Card ── */}
      <Dialog open={!!selectedTemplateForActions} onOpenChange={(open) => !open && setSelectedTemplateForActions(null)}>
        <DialogContent className="max-w-md rounded-3xl overflow-hidden p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-black">Gestionar Boceto</DialogTitle>
            <DialogDescription>
              Elige una acción para el boceto: {selectedTemplateForActions?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplateForActions && (
            <div className="space-y-5">
              <div className="flex justify-center p-2 bg-muted/30 rounded-2xl">
                <GiftCardPreviewFromRecord
                  record={{ ...selectedTemplateForActions, designId: selectedTemplateForActions.designId }}
                  storeName={activeStore.name}
                  mode="buyer"
                  code="PREVIEW"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  className="rounded-xl h-11 bg-brand-gradient text-white font-bold"
                  onClick={() => {
                    setSellingTemplate(selectedTemplateForActions);
                    setSelectedTemplateForActions(null);
                  }}
                >
                  Vender
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-11 font-bold"
                  onClick={() => {
                    const t = selectedTemplateForActions;
                    setDraft({
                      name: t.name,
                      amount: String(t.amount),
                      message: t.description || '',
                      occasion: t.occasion || 'otros',
                      designId: t.designId,
                      customStyle: (() => { try { return t.customStyle ? JSON.parse(t.customStyle) : null; } catch { return null; } })()
                    });
                    setEditingTemplateId(t.id);
                    setCreateStep(1);
                    setCreateOpen(true);
                    setSelectedTemplateForActions(null);
                  }}
                >
                  Modificar
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl h-11 font-bold"
                  onClick={() => handleDeleteTemplate(selectedTemplateForActions.id)}
                  disabled={processingId === selectedTemplateForActions.id}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Vender Gift Card directamente ── */}
      <Dialog open={!!sellingTemplate} onOpenChange={(open) => !open && setSellingTemplate(null)}>
        <DialogContent className="max-w-md rounded-3xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-black">Vender Gift Card directamente</DialogTitle>
            <DialogDescription>
              Completa los datos del cliente para emitir y activar la Gift Card de forma inmediata.
            </DialogDescription>
          </DialogHeader>
          {sellingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs">Nombre del destinatario *</Label>
                <Input
                  required
                  placeholder="Ej. Juan Perez"
                  value={sellForm.recipientName}
                  onChange={(e) => setSellForm({ ...sellForm, recipientName: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Email (opcional)</Label>
                <Input
                  type="email"
                  placeholder="Ej. juan@example.com"
                  value={sellForm.recipientEmail}
                  onChange={(e) => setSellForm({ ...sellForm, recipientEmail: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Teléfono (opcional)</Label>
                <Input
                  placeholder="Ej. +59170000000"
                  value={sellForm.recipientPhone}
                  onChange={(e) => setSellForm({ ...sellForm, recipientPhone: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Mensaje personalizado (opcional)</Label>
                <Textarea
                  placeholder="Mensaje de felicitación..."
                  value={sellForm.message}
                  onChange={(e) => setSellForm({ ...sellForm, message: e.target.value })}
                  className="rounded-xl"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">Método de pago</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['efectivo', 'qr', 'transferencia'].map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={sellForm.paymentMethod === method ? 'default' : 'outline'}
                      className="capitalize rounded-xl h-11 font-bold"
                      onClick={() => setSellForm({ ...sellForm, paymentMethod: method })}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>
              {(sellForm.paymentMethod === 'qr' || sellForm.paymentMethod === 'transferencia') && (
                <div className="space-y-2">
                  <Label className="font-bold text-xs">Número de transacción *</Label>
                  <Input
                    required
                    placeholder="Ej. 9823412"
                    value={sellForm.transactionNumber}
                    onChange={(e) => setSellForm({ ...sellForm, transactionNumber: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              )}
              <div className="bg-brand-gradient/10 border border-brand-gradient/20 p-4 rounded-2xl flex justify-between items-center text-sm">
                <span className="font-bold text-muted-foreground">Total a cobrar:</span>
                <span className="font-black text-2xl text-primary">Bs. {sellingTemplate.amount.toFixed(2)}</span>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" className="rounded-xl h-11 font-bold" onClick={() => setSellingTemplate(null)} disabled={processingId === sellingTemplate.id}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSellDirectly}
                  disabled={processingId === sellingTemplate.id || !sellForm.recipientName.trim()}
                  className="bg-brand-gradient text-white rounded-xl h-11 font-bold flex items-center justify-center gap-1.5"
                >
                  {processingId === sellingTemplate.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  Activar y vender
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
