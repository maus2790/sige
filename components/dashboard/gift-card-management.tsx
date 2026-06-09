'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle,
  Download,
  Gift,
  Loader2,
  Mail,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Settings,
  Trash2,
  Upload,
  User,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
      const newScale = Math.min(Math.max(initialScaleRef.current * factor, 150), 500);
      setZoomScale(newScale);

      // Also update position to midpoint of two fingers
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setZoomPos({
        x: ((midX - left) / width) * 100,
        y: ((midY - top) / height) * 100,
      });
    } else if (e.touches.length === 1) {
      // Single touch drag to pan
      const touch = e.touches[0];
      setZoomPos({
        x: ((touch.clientX - left) / width) * 100,
        y: ((touch.clientY - top) / height) * 100,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      setShowZoom(false);
      initialDistanceRef.current = null;
      setZoomScale(300);
    } else if (e.touches.length === 1) {
      // Reset pinch distance tracking if we go back to 1 finger
      initialDistanceRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border bg-muted cursor-crosshair group touch-none",
        isMobile ? "h-full" : "aspect-[3/4]"
      )}
      onMouseEnter={() => !isMobile && setShowZoom(true)}
      onMouseLeave={() => !isMobile && setShowZoom(false)}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Base image */}
      <Image
        src={url}
        alt="Comprobante de pago"
        fill
        className={cn(
          'object-contain p-3 transition-opacity duration-200 z-10',
          showZoom ? 'opacity-0' : 'opacity-100',
        )}
        sizes="(min-width: 768px) 40vw, 100vw"
      />

      {/* Zoom magnifier layer */}
      {showZoom && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            backgroundImage: `url(${url})`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundSize: `${zoomScale}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}

      {/* Zoom indicator badge */}
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 text-[10px] font-black text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-opacity pointer-events-none">
        <ZoomIn className="h-3 w-3" />
        Zoom
      </div>
    </div>
  );
}

// ── Issued card grid (active / inactive tabs) ────────────────────────────────

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

// ── Main component ───────────────────────────────────────────────────────────

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
  // Track which pending card is selected to preview its receipt
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  // States for template actions dialog/flow
  const [selectedTemplateForActions, setSelectedTemplateForActions] = useState<Template | null>(null);
  const [sellingTemplate, setSellingTemplate] = useState<Template | null>(null);
  const [sellForm, setSellForm] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    message: '',
    recipientId: '',
    paymentMethod: 'efectivo',
    transactionNumber: '',
  });

  const activeStore = store as Store;
  const maxAmountNumber = Number(maxAmount || 5000);
  const createDisabled = savingTemplate || !draft.amount || Number(draft.amount) <= 0 || Number(draft.amount) > maxAmountNumber;

  const sortedActiveCards = useMemo(() => [...activeCards].sort((a, b) => b.balance - a.balance), [activeCards]);
  const selectedPendingCard = useMemo(() => pending.find((c) => c.id === selectedPendingId) || null, [pending, selectedPendingId]);

  // Auto-select first pending card with a receipt on mount / when pending changes
  useEffect(() => {
    if (!selectedPendingId && pending.length > 0) {
      const first = pending.find((c) => c.receiptUrl) || pending[0];
      setSelectedPendingId(first.id);
    }
  }, [pending, selectedPendingId]);

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
    const editingId = (window as any).__editingTemplateId;
    const result = await upsertStoreGiftCardTemplate({
      id: editingId || undefined,
      storeId: activeStore.id,
      name: draft.name.trim() || 'Gift Card',
      amount,
      description: draft.message,
      designId: draft.designId,
      occasion: draft.occasion,
    });
    setSavingTemplate(false);
    if ('error' in result && result.error) return toast.error(result.error);

    delete (window as any).__editingTemplateId;

    if (editingId) {
      toast.success('Boceto de Gift Card actualizado exitosamente.');
      window.location.reload();
      return;
    }

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

  // ── Template Actions handlers ──
  async function handleDeleteTemplate(templateId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este boceto de Gift Card?')) return;
    
    setProcessingId(templateId);
    const result = await deleteStoreGiftCardTemplate(templateId);
    setProcessingId(null);
    
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('Boceto de Gift Card eliminado exitosamente.');
    setSelectedTemplateForActions(null);
    window.location.reload();
  }

  function handleEditTemplate(template: Template) {
    setDraft({
      name: template.name,
      amount: String(template.amount),
      message: template.description || '',
      occasion: template.occasion || 'otros',
      designId: template.designId,
    });
    // Set step to 1, open dialog, and set a special state or reuse createOpen
    // Let's modify handleCreateTemplate or we can just upsert. If we want to edit, we need to track if we are editing.
    // Let's declare an editingTemplateId state or similar.
    (window as any).__editingTemplateId = template.id;
    setCreateStep(1);
    setCreateOpen(true);
    setSelectedTemplateForActions(null);
  }

  async function handleSellDirectly() {
    if (!sellingTemplate) return;
    if (!sellForm.recipientName.trim()) {
      return toast.error('El nombre del destinatario es obligatorio.');
    }
    if (sellForm.paymentMethod === 'qr' && !sellForm.transactionNumber.trim()) {
      return toast.error('El número de transacción es obligatorio para pagos por QR.');
    }

    setProcessingId(sellingTemplate.id);
    const result = await sellStoreGiftCardDirectly({
      templateId: sellingTemplate.id,
      recipientName: sellForm.recipientName,
      recipientEmail: sellForm.recipientEmail,
      recipientPhone: sellForm.recipientPhone,
      message: sellForm.message,
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

  // ── Render ─────────────────────────────────────────────────────────────────

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
        <TabsList className="flex h-12 w-full items-center justify-start gap-1 overflow-x-auto rounded-2xl bg-muted p-1 no-scrollbar shrink-0">
          <TabsTrigger value="available" className="rounded-xl px-4 shrink-0">Disponibles</TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-xl px-4 shrink-0">
            Verificaciones
            {pending.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-xl px-4 shrink-0">Activas</TabsTrigger>
          <TabsTrigger value="inactive" className="rounded-xl px-4 shrink-0">Inactivas</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl px-4 shrink-0">Datos de pago</TabsTrigger>
        </TabsList>

        {/* ── Disponibles ── */}
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
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateForActions(template)}
                className="group text-left w-full rounded-[2rem] ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:-translate-y-1 hover:shadow-xl duration-200"
              >
                <GiftCardPreview
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
                <p className="mt-2 text-center text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                  Bs. {template.amount.toFixed(2)} · {template.name} · Toca para gestionar
                </p>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* ── Verificaciones ── */}
        <TabsContent value="verifications" className="mt-0">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <h2 className="text-xl font-black">Sin verificaciones pendientes</h2>
                <p className="text-sm text-muted-foreground">Las compras pendientes apareceran aqui.</p>
              </CardContent>
            </Card>
          ) : (
            /* ── Desktop split layout ── */
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Mobile sticky receipt preview */}
              {selectedPendingCard?.receiptUrl && (
                <div className="block md:hidden w-full sticky top-[64px] z-40 bg-background/95 backdrop-blur-md py-2 border-b shrink-0 h-[35svh] shadow-md px-1">
                  <div className="flex items-center justify-between mb-1 px-3">
                    <span className="flex items-center gap-1.5 text-xs font-black text-muted-foreground">
                      <Receipt className="h-3.5 w-3.5" />
                      Comprobante
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">Usa dos dedos para hacer zoom</span>
                  </div>
                  <ReceiptPreview url={selectedPendingCard.receiptUrl} isMobile={true} />
                </div>
              )}

              {/* Left: scrollable card list */}
              <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 max-h-[80vh] overflow-y-auto space-y-3 pr-1 pt-2">
                {pending.map((card) => {
                  const isSelected = selectedPendingId === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setSelectedPendingId(card.id)}
                      className={cn(
                        'w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                          : 'border-border hover:border-primary/40 hover:shadow-md',
                      )}
                    >
                      {/* Gift Card boceto */}
                      <div className="p-3 pb-0">
                        <GiftCardPreview
                          value={{
                            storeName: activeStore.name,
                            amount: card.amount,
                            recipientName: card.recipientName || '',
                            message: card.message || '',
                            occasion: card.occasion || 'otros',
                            designId: card.templateId || 1,
                          }}
                          mode="buyer"
                          code="PENDIENTE"
                        />
                      </div>

                      {/* Details */}
                      <div className="p-3 space-y-2.5">
                        {/* Amount + status */}
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-black">Bs. {card.amount.toFixed(2)}</p>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                            Pendiente
                          </span>
                        </div>

                        {/* Sender */}
                        <div className="rounded-xl bg-muted/60 px-3 py-2 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Comprador</p>
                          <div className="flex items-center gap-1.5 text-sm">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="font-bold truncate">{card.senderName}</span>
                          </div>
                          {card.senderEmail && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{card.senderEmail}</span>
                            </div>
                          )}
                        </div>

                        {/* Recipient */}
                        {(card.recipientName || card.recipientEmail || card.recipientPhone) && (
                          <div className="rounded-xl bg-muted/60 px-3 py-2 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Para</p>
                            {card.recipientName && (
                              <div className="flex items-center gap-1.5 text-sm">
                                <Gift className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="font-bold truncate">{card.recipientName}</span>
                              </div>
                            )}
                            {card.recipientEmail && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{card.recipientEmail}</span>
                              </div>
                            )}
                            {card.recipientPhone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{card.recipientPhone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment info */}
                        <div className="rounded-xl bg-muted/60 px-3 py-2 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pago</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Método</span>
                            <span className="font-bold capitalize">{card.paymentMethod || 'N/A'}</span>
                          </div>
                          {card.transactionNumber && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">N° Transacción</span>
                              <span className="font-mono font-bold">{card.transactionNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Receipt indicator */}
                        {card.receiptUrl && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                            <Receipt className="h-3.5 w-3.5" />
                            Comprobante adjunto — click para visualizar
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl h-9"
                            onClick={(e) => { e.stopPropagation(); handleVerify(card, 'reject'); }}
                            disabled={processingId === card.id}
                          >
                            {processingId === card.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1 h-3.5 w-3.5" />}
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-xl h-9"
                            onClick={(e) => { e.stopPropagation(); setConfirmingCard(card); }}
                            disabled={processingId === card.id}
                          >
                            {processingId === card.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="mr-1 h-3.5 w-3.5" />}
                            Aprobar
                          </Button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right: receipt preview (desktop only) */}
              <div className="hidden md:flex flex-1 flex-col gap-3 sticky top-4">
                <div className="flex items-center gap-2 text-sm font-black text-muted-foreground">
                  <Receipt className="h-4 w-4" />
                  Comprobante de pago
                </div>

                {selectedPendingCard?.receiptUrl ? (
                  <ReceiptPreview url={selectedPendingCard.receiptUrl} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-muted/30 text-muted-foreground"
                    style={{ aspectRatio: '3/4' }}>
                    <Receipt className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-bold text-center px-6">
                      {selectedPendingCard
                        ? 'Esta solicitud no tiene comprobante adjunto'
                        : 'Selecciona una tarjeta para ver el comprobante'}
                    </p>
                  </div>
                )}

                {selectedPendingCard && (
                  <p className="text-center text-xs text-muted-foreground font-bold">
                    Pasa el cursor sobre la imagen para hacer zoom
                  </p>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Activas ── */}
        <TabsContent value="active" className="mt-0">
          {sortedActiveCards.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Aun no hay Gift Cards activas con saldo.</CardContent></Card>
          ) : (
            <IssuedCardGrid cards={sortedActiveCards} storeName={activeStore.name} onOpen={openIssuedCard} />
          )}
        </TabsContent>

        {/* ── Inactivas ── */}
        <TabsContent value="inactive" className="mt-0">
          {inactiveCards.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No hay Gift Cards inactivas.</CardContent></Card>
          ) : (
            <IssuedCardGrid cards={inactiveCards} storeName={activeStore.name} onOpen={openIssuedCard} />
          )}
        </TabsContent>

        {/* ── Datos de pago ── */}
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

      {/* ── Modal: Crear Gift Card ── */}
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

      {/* ── Modal: Activar Gift Card ── */}
      <Dialog open={!!confirmingCard} onOpenChange={(open) => !open && setConfirmingCard(null)}>
        <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0">
          {/* Header gradient */}
          <div className="bg-brand-gradient px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black">Activar Gift Card</h2>
                <p className="text-xs text-white/75">Se generará un código único y se notificará al destinatario</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {confirmingCard && (
              <>
                {/* Amount highlight */}
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Monto a activar</p>
                  <p className="text-4xl font-black text-emerald-700">Bs. {confirmingCard.amount.toFixed(2)}</p>
                </div>

                {/* Buyer info */}
                <div className="rounded-2xl bg-muted/60 border px-4 py-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Comprador</p>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-bold">{confirmingCard.senderName}</span>
                  </div>
                  {confirmingCard.senderEmail && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span>{confirmingCard.senderEmail}</span>
                    </div>
                  )}
                </div>

                {/* Recipient info */}
                <div className="rounded-2xl bg-muted/60 border px-4 py-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Para</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-bold">{confirmingCard.recipientName || 'Sin nombre especificado'}</span>
                  </div>
                  {confirmingCard.recipientEmail && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span>{confirmingCard.recipientEmail}</span>
                    </div>
                  )}
                  {confirmingCard.recipientPhone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{confirmingCard.recipientPhone}</span>
                    </div>
                  )}
                </div>

                {/* Payment details */}
                <div className="rounded-2xl bg-muted/60 border px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pago</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Método</span>
                    <span className="font-bold capitalize">{confirmingCard.paymentMethod || 'N/A'}</span>
                  </div>
                  {confirmingCard.transactionNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">N° Transacción</span>
                      <span className="font-mono font-bold">{confirmingCard.transactionNumber}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="outline"
                className="h-12 rounded-2xl"
                onClick={() => setConfirmingCard(null)}
              >
                Cancelar
              </Button>
              {confirmingCard && (
                <Button
                  className="h-12 rounded-2xl bg-brand-gradient text-white"
                  onClick={() => handleVerify(confirmingCard, 'approve')}
                  disabled={processingId === confirmingCard.id}
                >
                  {processingId === confirmingCard.id
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <BadgeCheck className="mr-2 h-4 w-4" />}
                  Activar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Detalle de Gift Card emitida ── */}
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
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="col-span-2" onClick={() => setEditOpen((open) => !open)}>Editar datos</Button>
                  <Button variant="destructive" onClick={handleDeleteIssuedCard}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                  {selectedCard?.cardImageUrl && (
                    <Button
                      variant="outline"
                      className="col-span-3 gap-2"
                      onClick={async () => {
                        try {
                          const res = await fetch(selectedCard.cardImageUrl!);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `gift-card-${selectedCard.code || selectedCard.id}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          toast.error('No se pudo descargar la imagen.');
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Descargar Gift Card
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Acciones de boceto de Gift Card ── */}
      <Dialog open={!!selectedTemplateForActions} onOpenChange={(open) => !open && setSelectedTemplateForActions(null)}>
        <DialogContent className="max-w-sm rounded-3xl overflow-hidden p-0">
          {selectedTemplateForActions && (
            <>
              {/* Header */}
              <div className="bg-brand-gradient px-6 py-5 text-white">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black leading-tight">{selectedTemplateForActions.name}</h2>
                    <p className="text-sm text-white/75">Bs. {selectedTemplateForActions.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="px-5 pt-4 pb-2">
                <GiftCardPreview
                  mode="seller"
                  code="SIN CODIGO"
                  value={{
                    templateName: selectedTemplateForActions.name,
                    storeName: activeStore.name,
                    amount: selectedTemplateForActions.amount,
                    message: selectedTemplateForActions.description || '',
                    occasion: selectedTemplateForActions.occasion || 'otros',
                    designId: selectedTemplateForActions.designId,
                  }}
                />
              </div>

              {/* Actions */}
              <div className="px-5 pb-6 space-y-2.5 pt-2">
                <Button
                  className="w-full h-12 rounded-2xl gap-2 bg-brand-gradient text-white shadow-premium text-sm font-black"
                  onClick={() => {
                    setSellingTemplate(selectedTemplateForActions);
                    setSellForm(f => ({ ...f, message: selectedTemplateForActions.description || '' }));
                    setSelectedTemplateForActions(null);
                  }}
                >
                  <BadgeCheck className="h-4 w-4" />
                  Vender directamente
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl gap-2 text-sm font-black"
                  onClick={() => handleEditTemplate(selectedTemplateForActions)}
                >
                  <Settings className="h-4 w-4" />
                  Editar boceto
                </Button>
                <Button
                  variant="destructive"
                  className="w-full h-12 rounded-2xl gap-2 text-sm font-black"
                  disabled={processingId === selectedTemplateForActions.id}
                  onClick={() => handleDeleteTemplate(selectedTemplateForActions.id)}
                >
                  {processingId === selectedTemplateForActions.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />
                  }
                  Eliminar boceto
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Vender Gift Card directamente ── */}
      <Dialog open={!!sellingTemplate} onOpenChange={(open) => !open && setSellingTemplate(null)}>
        <DialogContent className="max-w-lg rounded-3xl overflow-hidden p-0">
          {sellingTemplate && (
            <>
              {/* Header */}
              <div className="bg-brand-gradient px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Vender Gift Card</h2>
                    <p className="text-sm text-white/75">{sellingTemplate.name} · Bs. {sellingTemplate.amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4">
                {/* Gift Card preview mini */}
                <div className="scale-90 origin-top">
                  <GiftCardPreview
                    mode="buyer"
                    code="XXXXXXXX"
                    value={{
                      templateName: sellingTemplate.name,
                      storeName: activeStore.name,
                      amount: sellingTemplate.amount,
                      recipientName: sellForm.recipientName || '(destinatario)',
                      message: sellForm.message || sellingTemplate.description || '',
                      occasion: sellingTemplate.occasion || 'otros',
                      designId: sellingTemplate.designId,
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground font-bold text-center -mt-3">La tarjeta se activará inmediatamente al guardar.</p>

                {/* Recipient info */}
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Destinatario</p>
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre *</Label>
                      <Input
                        placeholder="Nombre completo"
                        value={sellForm.recipientName}
                        onChange={(e) => setSellForm(f => ({ ...f, recipientName: e.target.value }))}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Email (opcional)</Label>
                        <Input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={sellForm.recipientEmail}
                          onChange={(e) => setSellForm(f => ({ ...f, recipientEmail: e.target.value }))}
                          className="rounded-xl h-11"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Teléfono (opcional)</Label>
                        <Input
                          placeholder="+591 7XXXXXXX"
                          value={sellForm.recipientPhone}
                          onChange={(e) => setSellForm(f => ({ ...f, recipientPhone: e.target.value }))}
                          className="rounded-xl h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mensaje (opcional)</Label>
                      <Textarea
                        placeholder="Mensaje personalizado para la Gift Card..."
                        value={sellForm.message}
                        onChange={(e) => setSellForm(f => ({ ...f, message: e.target.value }))}
                        rows={2}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment info */}
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Método de pago</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['efectivo', 'qr', 'tigo money', 'transferencia'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSellForm(f => ({ ...f, paymentMethod: method }))}
                        className={cn(
                          'h-10 rounded-xl border text-xs font-bold capitalize transition-all',
                          sellForm.paymentMethod === method
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                  {sellForm.paymentMethod !== 'efectivo' && (
                    <div className="space-y-1">
                      <Label className="text-xs">N° Transacción / Referencia</Label>
                      <Input
                        placeholder="Número de comprobante"
                        value={sellForm.transactionNumber}
                        onChange={(e) => setSellForm(f => ({ ...f, transactionNumber: e.target.value }))}
                        className="rounded-xl h-11 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-muted/60 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-bold">Total a cobrar</span>
                  <span className="text-2xl font-black text-primary">Bs. {sellingTemplate.amount.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="px-6 pb-6 pt-2 gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 rounded-2xl"
                  onClick={() => setSellingTemplate(null)}
                  disabled={!!processingId}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl gap-2 bg-brand-gradient text-white shadow-premium"
                  onClick={handleSellDirectly}
                  disabled={!!processingId || !sellForm.recipientName.trim()}
                >
                  {processingId === sellingTemplate.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <BadgeCheck className="h-4 w-4" />
                  }
                  Activar y vender
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
