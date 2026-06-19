'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Gift,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  Plus,
  QrCode,
  Search,
  Send,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CheckBalanceDialog } from './check-balance-dialog';
import { GiftCardBottomNav } from './gift-card-bottom-nav';
import { GiftCardCard } from './gift-card-card';
import { GiftCardDesigner, GiftCardPreview, GiftCardPreviewFromRecord, type CustomCardStyle } from './gift-card-designer';
import {
  getGiftCardStoreProducts,
  getStoreGiftCardPaymentSettings,
  purchaseGiftCard,
  updateGiftCardRecipient,
} from '@/app/actions/gift-cards';

type StoreTemplate = {
  id: string;
  storeId: string;
  name: string;
  amount: number;
  description?: string | null;
  designId: number;
  occasion?: string | null;
  storeName: string;
  storeLogoUrl?: string | null;
  customStyle?: string | null;
};

type StoreWithGiftCards = {
  id: string;
  name: string;
  logoUrl: string | null;
  storeName?: string;
  storeLogoUrl?: string | null;
  templates: StoreTemplate[];
};

type PaymentMethod = 'qr' | 'bank_transfer' | 'tigo_money' | 'operator';
type PaymentSettings = {
  qrUrl: string | null;
  bankDetails: string | null;
  tigoMoney: string | null;
  operatorPhone: string | null;
  maxAmount?: number | null;
} | null;

const PAYMENT_METHODS: { id: PaymentMethod; icon: LucideIcon; label: string }[] = [
  { id: 'qr', icon: QrCode, label: 'QR' },
  { id: 'bank_transfer', icon: CreditCard, label: 'Banco' },
  { id: 'tigo_money', icon: Smartphone, label: 'Tigo' },
  { id: 'operator', icon: MessageCircle, label: 'Operador' },
];

interface GiftCardWalletProps {
  sent: any[];
  received: any[];
  mine?: any[];
  saved?: any[];
  stores?: StoreWithGiftCards[];
  totalBalance: number;
  stats: {
    totalCards: number;
    sentCount: number;
    receivedCount: number;
    activeCount: number;
    totalBalance: number;
    expiredCount: number;
    redeemedCount: number;
  } | null;
}

export function GiftCardWallet({ sent, received, mine = [], saved = [], stores = [] }: GiftCardWalletProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'stores';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [checkBalanceOpen, setCheckBalanceOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(stores[0]?.id || null);
  const [selectedTemplate, setSelectedTemplate] = useState<StoreTemplate | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados para creación de Gift Card Personalizada (Usuario)
  const [customCreateOpen, setCustomCreateOpen] = useState(false);
  const [customStep, setCustomStep] = useState<1 | 2 | 3 | 4>(1);
  const [customDraft, setCustomDraft] = useState<{
    amount: string;
    cardName: string;
    message: string;
    occasion: string;
    designId: number;
    customStyle: CustomCardStyle | null;
  }>({
    amount: '100',
    cardName: '',
    message: '',
    occasion: 'otros',
    designId: 1,
    customStyle: null,
  });

  const [customPaymentMethod, setCustomPaymentMethod] = useState<PaymentMethod>('qr');
  const [customTransactionNumber, setCustomTransactionNumber] = useState('');
  const [customReceiptFile, setCustomReceiptFile] = useState<File | null>(null);
  const [customReceiptPreview, setCustomReceiptPreview] = useState<string | null>(null);
  const [submittingCustomCard, setSubmittingCustomCard] = useState(false);

  function handleCustomReceipt(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('El comprobante no puede superar 5MB');
    setCustomReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => setCustomReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadCustomReceipt() {
    if (!customReceiptFile) return '';
    const fd = new FormData();
    fd.append('file', customReceiptFile);
    const response = await fetch('/api/upload/payment-proof', { method: 'POST', body: fd });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo subir el comprobante');
    return result.url as string;
  }

  async function handleSubmitCustomCard() {
    if (!selectedStoreId || !selectedStore) return toast.error('Tienda no seleccionada');
    const amt = Number(customDraft.amount);
    if (!amt || amt <= 0) return toast.error('Ingresa un monto válido');
    
    const maxLimit = paymentSettings?.maxAmount ?? 5000;
    if (amt > maxLimit) return toast.error(`El monto maximo por Gift Card es Bs. ${maxLimit.toLocaleString()}`);

    if (customPaymentMethod !== 'operator' && !customReceiptFile) {
      return toast.error('Sube el comprobante de pago');
    }
    if (customPaymentMethod !== 'operator' && !customTransactionNumber) {
      return toast.error('Ingresa el numero de transaccion');
    }

    setSubmittingCustomCard(true);
    try {
      const receiptUrl = customPaymentMethod === 'operator' ? '' : await uploadCustomReceipt();
      const result = await purchaseGiftCard({
        amount: amt,
        recipientName: customDraft.cardName || 'Mi Gift Card',
        saveToWallet: true,
        message: customDraft.message || '',
        templateId: customDraft.designId || 1,
        occasion: customDraft.occasion || 'otros',
        businessId: selectedStore.id,
        paymentMethod: customPaymentMethod,
        transactionNumber: customTransactionNumber,
        receiptUrl,
        customStyle: JSON.stringify(customDraft.customStyle || {}),
      });

      if ('error' in result && result.error) {
        return toast.error(result.error);
      }

      toast.success('Gift Card personalizada enviada a verificacion');
      setCustomCreateOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo crear la Gift Card');
    } finally {
      setSubmittingCustomCard(false);
    }
  }

  function resetCustomDraft() {
    const defaultName = session?.user?.name || '';
    setCustomDraft({
      amount: '100',
      cardName: defaultName,
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
    setCustomPaymentMethod('qr');
    setCustomTransactionNumber('');
    setCustomReceiptFile(null);
    setCustomReceiptPreview(null);
    setCustomStep(1);
  }

  const now = Date.now();
  const selectedStore = stores.find((store) => store.id === selectedStoreId) || stores[0] || null;
  const allUserCards = [...sent, ...received, ...saved, ...mine];
  const uniqueById = (cards: any[]) => cards.filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index);
  const isCardActive = (card: any) => {
    const exp = card.expiresAt instanceof Date ? card.expiresAt.getTime() : Number(card.expiresAt);
    return card.status === 'active' && exp > now && card.balance > 0;
  };

  const pendingVerification = uniqueById(allUserCards).filter((card) => card.status === 'pending_payment');
  // De acuerdo a la regla 3, todas las tarjetas activas de mi propiedad, recibidas, o enviadas deben aparecer en la pestaña "Mis Gift Cards"
  const activeMine = uniqueById([...mine, ...received, ...sent]).filter(isCardActive);
  const activeSent = uniqueById(sent).filter(isCardActive);
  const activeReceived = uniqueById(received).filter(isCardActive);
  const historyCards = uniqueById(allUserCards)
    .filter((card) => card.status !== 'pending_payment')
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const selectedStoreTemplates = useMemo(() => selectedStore?.templates || [], [selectedStore]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (!selectedStoreId && stores[0]) setSelectedStoreId(stores[0].id);
  }, [stores, selectedStoreId]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/gift-cards?${params.toString()}`, { scroll: false });
  }

  async function openTemplatePayment(template: StoreTemplate) {
    setSelectedTemplate(template);
    setPaymentMethod('qr');
    setTransactionNumber('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentSettings(await getStoreGiftCardPaymentSettings(template.storeId));
  }

  function handleReceipt(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('El comprobante no puede superar 5MB');
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadReceipt() {
    if (!receiptFile) return '';
    const formData = new FormData();
    formData.append('file', receiptFile);
    const response = await fetch('/api/upload/payment-proof', { method: 'POST', body: formData });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo subir el comprobante');
    return result.url as string;
  }

  async function submitTemplatePayment() {
    if (!selectedTemplate) return;
    if (paymentMethod !== 'operator' && !receiptFile) return toast.error('Sube el comprobante');
    if (paymentMethod !== 'operator' && !transactionNumber) return toast.error('Ingresa el numero de transaccion');

    setLoadingPayment(true);
    try {
      const receiptUrl = paymentMethod === 'operator' ? '' : await uploadReceipt();
      const result = await purchaseGiftCard({
        storeGiftCardTemplateId: selectedTemplate.id,
        recipientName: 'Mi Gift Card',
        saveToWallet: true,
        message: selectedTemplate.description || '',
        templateId: selectedTemplate.designId,
        occasion: selectedTemplate.occasion || 'otros',
        paymentMethod,
        transactionNumber,
        receiptUrl,
      });

      if ('error' in result && result.error) return toast.error(result.error);
      toast.success('Gift Card enviada a verificacion');
      setSelectedTemplate(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'No se pudo enviar a verificacion');
    } finally {
      setLoadingPayment(false);
    }
  }

  async function toggleProducts() {
    if (!selectedStore) return;
    const next = !showProducts;
    setShowProducts(next);
    if (!next || products.length > 0) return;
    setLoadingProducts(true);
    setProducts(await getGiftCardStoreProducts(selectedStore.id));
    setLoadingProducts(false);
  }

  return (
    <div className="gift-card-section min-h-screen bg-background">
      <div className="gift-card-hero bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="gift-card-hero-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-pink-500 shadow-lg">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Mis Gift Cards</h1>
              <p className="text-[11px] opacity-70">Billetera de regalos SIGE</p>
            </div>
          </div>

          <div className="mb-4 text-center">
            <p className="text-sm opacity-80">Gift Cards</p>
            <p className="text-4xl font-black tracking-tighter">Gift Cards</p>
            <p className="mt-1 text-xs opacity-60">{activeMine.length} activas para usar</p>
          </div>

          <div className="gift-card-tabs-nav flex w-full items-center gap-1 rounded-2xl border bg-card/80 p-1.5 shadow-sm backdrop-blur-xl overflow-x-auto scrollbar-none">
            {[
              { id: 'stores', label: 'Tiendas', value: stores.length, icon: Store },
              { id: 'mine', label: 'Mis Gift Cards', value: activeMine.length, icon: Wallet },
              { id: 'history', label: 'Historial', value: historyCards.length, icon: Clock },
              { id: 'check', label: 'Consultar', value: null, icon: Search },
            ].map(({ id, label, value, icon: Icon }) => (
              <button
                key={id}
                onClick={() => (id === 'check' ? setCheckBalanceOpen(true) : handleTabChange(id))}
                className={`gift-card-tabs-trigger relative flex shrink-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${
                  activeTab === id ? 'gift-card-tabs-trigger-active bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
                {value !== null && (
                  <span className={`gift-card-tabs-count absolute right-0 top-0 rounded-full px-2 py-0.5 text-[10px] font-bold leading-none md:static ${
                    activeTab === id ? 'bg-white/30 text-current' : 'bg-destructive text-white'
                  }`}>
                    {value}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-5xl px-4 pb-32">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsContent value="stores" className="mt-0 space-y-5">
            {pendingVerification.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <div>
                  <h2 className="font-black text-amber-900">En verificacion</h2>
                  <p className="text-xs text-amber-800">Estas Gift Cards esperan aprobacion de la tienda.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pendingVerification.map((card) => {
                    const matchingStore = stores.find((s) => s.id === card.businessId);
                    const matchingTemplate = matchingStore?.templates.find((t) => String(t.id) === String(card.storeGiftCardTemplateId));
                    return (
                      <div key={card.id} className="opacity-70">
                        <GiftCardPreviewFromRecord
                          record={card}
                          template={matchingTemplate}
                          storeName={matchingStore?.name || 'Tienda'}
                          mode="buyer"
                          code="EN VERIFICACION"
                        />
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white/80 p-2 text-xs font-black text-amber-900">
                        <span>En verificacion</span>
                        <Button asChild size="sm" className="h-8 rounded-xl">
                          <a href="https://wa.me/59173214036" target="_blank" rel="noreferrer">WhatsApp</a>
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="-mx-4 overflow-x-auto px-4 pb-2">
              <div className="flex min-w-max gap-2">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      setSelectedStoreId(store.id);
                      setShowProducts(false);
                      setProducts([]);
                    }}
                    className={`flex w-28 shrink-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                      selectedStoreId === store.id ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'bg-card hover:bg-muted/60'
                    }`}
                  >
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <Store className="h-6 w-6 text-muted-foreground" />
                      </span>
                    )}
                    <span className="line-clamp-2 min-h-8 text-xs font-black leading-tight">{store.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedStore ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
                  <div>
                    <h2 className="font-black">{selectedStore.name}</h2>
                    <button type="button" onClick={toggleProducts} className="text-xs font-black underline underline-offset-4">
                      listar productos disponibles en la tienda
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/tienda/${selectedStore.id}`)}>
                      <Store className="mr-2 h-4 w-4" />
                      Visitar tienda
                    </Button>
                    <Button
                      className="rounded-xl"
                      onClick={async () => {
                        setPaymentSettings(await getStoreGiftCardPaymentSettings(selectedStore.id));
                        resetCustomDraft();
                        setCustomCreateOpen(true);
                      }}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Crear tarjeta
                    </Button>
                  </div>
                </div>

                {showProducts && (
                  <div className="rounded-2xl border bg-card p-3">
                    {loadingProducts ? (
                      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cargando productos...
                      </div>
                    ) : products.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">No hay productos publicados.</p>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                          <Link key={product.id} href={`/productos/${product.id}`} className="flex items-center gap-3 rounded-xl border p-2 hover:bg-muted/60">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black">{product.name}</p>
                              <p className="text-xs text-muted-foreground">Bs. {Number(product.price || 0).toFixed(2)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedStoreTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {selectedStoreTemplates.map((template) => (
                      <button key={template.id} type="button" onClick={() => openTemplatePayment(template)} className="text-left">
                        <GiftCardPreviewFromRecord
                          record={{ ...template, recipientName: 'Mi Gift Card', designId: template.designId }}
                          storeName={selectedStore.name}
                          mode="seller"
                          code="SIN CODIGO"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed bg-muted/30 p-8 text-center w-full col-span-full">
                    <Gift className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-semibold text-muted-foreground">Esta tienda aún no tiene bocetos disponibles</p>
                    <p className="mt-1 text-xs text-muted-foreground">Puedes crear una Gift Card personalizada con diseño propio.</p>
                  </div>
                )}
              </section>
            ) : (
              <EmptyState icon={<Store className="h-10 w-10" />} title="No hay tiendas disponibles" description="Las tiendas con Gift Cards habilitadas apareceran aqui." />
            )}
          </TabsContent>

          <TabsContent value="mine" className="mt-0 space-y-4">
            {activeMine.length === 0 ? (
              <EmptyState icon={<Wallet className="h-10 w-10" />} title="Aun no tienes Gift Cards activas" description="Cuando una tienda active una Gift Card para ti, aparecera aqui." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeMine.map((card) => (
                  <OwnedGiftCardTile
                    key={card.id}
                    card={card}
                    storeName={stores.find((s) => s.id === card.businessId)?.name || 'Tienda'}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0 space-y-3">
            {historyCards.length === 0 ? (
              <EmptyState icon={<Clock className="h-10 w-10" />} title="Historial vacio" description="Aqui apareceran tus transacciones de Gift Cards." />
            ) : (
              historyCards.map((card) => (
                <div key={card.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{card.recipientName || 'Gift Card'}</p>
                    <p className="text-xs text-muted-foreground">Bs. {card.amount.toFixed(2)} - {card.code || card.status}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-black uppercase">{card.status}</span>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="flex max-h-[92svh] max-w-lg flex-col overflow-hidden rounded-2xl p-0">
          {selectedTemplate && (
            <>
              <DialogHeader className="shrink-0 border-b p-5">
                <DialogTitle>Enviar a verificacion</DialogTitle>
                <DialogDescription>La tienda revisara tu pago antes de activar el codigo.</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(({ id, icon: Icon, label }) => (
                    <Button key={id} type="button" variant={paymentMethod === id ? 'default' : 'outline'} className="h-12 flex-col gap-1 text-[10px]" onClick={() => setPaymentMethod(id)}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>

                {paymentMethod === 'qr' && paymentSettings?.qrUrl && (
                  <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-2xl border bg-white">
                    <Image src={paymentSettings.qrUrl} alt="QR de pago" fill className="object-contain p-2" />
                  </div>
                )}
                {paymentMethod === 'bank_transfer' && <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">{paymentSettings?.bankDetails || 'La tienda no configuro datos bancarios.'}</pre>}
                {paymentMethod === 'tigo_money' && <div className="rounded-xl bg-muted p-3 text-sm font-black">Tigo Money: {paymentSettings?.tigoMoney || 'No configurado'}</div>}
                {paymentMethod === 'operator' && <div className="rounded-xl bg-muted p-3 text-sm">Contacta a la tienda: {paymentSettings?.operatorPhone || 'telefono no configurado'}</div>}

                {paymentMethod !== 'operator' && (
                  <div className="space-y-3">
                    <Label>Comprobante</Label>
                    {receiptPreview ? (
                      <div className="relative overflow-hidden rounded-2xl border">
                        <div className="relative aspect-video">
                          <Image src={receiptPreview} alt="Comprobante" fill className="bg-muted object-contain" />
                        </div>
                        <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Subir comprobante</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleReceipt} />
                      </label>
                    )}
                    <Input placeholder="Numero de transaccion" value={transactionNumber} onChange={(event) => setTransactionNumber(event.target.value)} />
                  </div>
                )}
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background p-4">
                <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setSelectedTemplate(null)} disabled={loadingPayment}>Cancelar</Button>
                <Button className="h-12 rounded-2xl" onClick={submitTemplatePayment} disabled={loadingPayment}>
                  {loadingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CheckBalanceDialog open={checkBalanceOpen} onOpenChange={setCheckBalanceOpen} />
      <GiftCardBottomNav />

      {/* Modal de Creación de Gift Card Personalizada (Usuario) */}
      <Dialog open={customCreateOpen} onOpenChange={setCustomCreateOpen}>
        <DialogContent showCloseButton={false} className="!left-0 !top-0 !flex !h-[100svh] !max-h-[100svh] !w-[100vw] !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-none p-0 sm:!left-1/2 sm:!top-1/2 sm:!h-[calc(100svh-2rem)] sm:!max-h-[calc(100svh-2rem)] sm:!w-[min(980px,calc(100vw-2rem))] sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:rounded-[2rem]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 bg-brand-gradient px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white sm:p-5">
              <DialogTitle className="text-xl font-black sm:text-2xl">Crear Gift Card Personalizada</DialogTitle>
              <DialogDescription className="text-white/75">Paso {customStep} de 4</DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain bg-muted/30 px-4 py-4 pb-28 [-webkit-overflow-scrolling:touch] sm:px-5">
              {customStep < 4 ? (
                <GiftCardDesigner
                  mode="buyer"
                  value={{
                    templateName: 'Gift Card personalizada',
                    storeName: selectedStore?.name || 'Tienda',
                    cardName: customDraft.cardName,
                    amount: customDraft.amount,
                    message: customDraft.message,
                    occasion: customDraft.occasion,
                    designId: customDraft.designId,
                    customStyle: customDraft.customStyle,
                  }}
                  onChange={(patch) => {
                    setCustomDraft((current) => ({
                      ...current,
                      cardName: patch.cardName !== undefined ? patch.cardName : current.cardName,
                      amount: patch.amount !== undefined ? String(patch.amount) : current.amount,
                      message: patch.message !== undefined ? patch.message : current.message,
                      occasion: patch.occasion !== undefined ? patch.occasion : current.occasion,
                      designId: patch.designId !== undefined ? patch.designId : current.designId,
                      customStyle: patch.customStyle !== undefined ? patch.customStyle : current.customStyle,
                    }));
                  }}
                  sections={customStep === 1 ? ['details'] : customStep === 2 ? ['occasion', 'suggestions'] : ['style']}
                  maxAmount={paymentSettings?.maxAmount ?? 5000}
                />
              ) : (
                <div className="space-y-4 max-w-lg mx-auto">
                  <GiftCardPreview
                    value={{
                      storeName: selectedStore?.name || 'Tienda',
                      amount: customDraft.amount,
                      cardName: customDraft.cardName,
                      message: customDraft.message,
                      occasion: customDraft.occasion,
                      designId: customDraft.designId,
                      customStyle: customDraft.customStyle,
                    }}
                    mode="buyer"
                    code="PENDIENTE"
                  />

                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {PAYMENT_METHODS.map(({ id, icon: Icon, label }) => (
                      <Button key={id} type="button" variant={customPaymentMethod === id ? 'default' : 'outline'} className="h-12 flex-col gap-1 text-[10px]" onClick={() => setCustomPaymentMethod(id)}>
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                  </div>

                  {customPaymentMethod === 'qr' && paymentSettings?.qrUrl && (
                    <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-2xl border bg-white mt-4">
                      <Image src={paymentSettings.qrUrl} alt="QR de pago" fill className="object-contain p-2" />
                    </div>
                  )}
                  {customPaymentMethod === 'bank_transfer' && <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs mt-4">{paymentSettings?.bankDetails || 'La tienda no configuro datos bancarios.'}</pre>}
                  {customPaymentMethod === 'tigo_money' && <div className="rounded-xl bg-muted p-3 text-sm font-black mt-4">Tigo Money: {paymentSettings?.tigoMoney || 'No configurado'}</div>}
                  {customPaymentMethod === 'operator' && <div className="rounded-xl bg-muted p-3 text-sm mt-4">Contacta a la tienda: {paymentSettings?.operatorPhone || 'telefono no configurado'}</div>}

                  {customPaymentMethod !== 'operator' && (
                    <div className="space-y-3 mt-4">
                      <Label>Comprobante</Label>
                      {customReceiptPreview ? (
                        <div className="relative overflow-hidden rounded-2xl border">
                          <div className="relative aspect-video">
                            <Image src={customReceiptPreview} alt="Comprobante" fill className="bg-muted object-contain" />
                          </div>
                          <button type="button" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white" onClick={() => { setCustomReceiptFile(null); setCustomReceiptPreview(null); }}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Subir comprobante</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleCustomReceipt} />
                        </label>
                      )}
                      <Input placeholder="Numero de transaccion" value={customTransactionNumber} onChange={(event) => setCustomTransactionNumber(event.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="shrink-0 border-t bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur sm:p-4">
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                <Button variant="ghost" className="h-12 rounded-2xl" onClick={() => setCustomCreateOpen(false)} disabled={submittingCustomCard}>Cancelar</Button>
                <Button variant="outline" className="h-12 rounded-2xl" disabled={customStep === 1 || submittingCustomCard} onClick={() => setCustomStep((step) => (step - 1) as 1 | 2 | 3 | 4)}>Atras</Button>
                {customStep < 4 ? (
                  <Button className="col-span-2 h-12 rounded-2xl" onClick={() => {
                    if (customStep === 1) {
                      const amt = Number(customDraft.amount);
                      if (!amt || amt <= 0) return toast.error('Ingresa un monto válido');
                      const maxLimit = paymentSettings?.maxAmount ?? 5000;
                      if (amt > maxLimit) return toast.error(`El monto maximo por Gift Card es Bs. ${maxLimit.toLocaleString()}`);
                    }
                    setCustomStep((step) => (step + 1) as 1 | 2 | 3 | 4);
                  }}>Siguiente</Button>
                ) : (
                  <Button className="col-span-2 h-12 rounded-2xl" onClick={handleSubmitCustomCard} disabled={submittingCustomCard}>
                    {submittingCustomCard ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Enviar a verificacion
                  </Button>
                )}
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <CheckBalanceDialog open={checkBalanceOpen} onOpenChange={setCheckBalanceOpen} />
      <GiftCardBottomNav />
    </div>
  );
}

function OwnedGiftCardTile({ card, storeName }: { card: any; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [giftMode, setGiftMode] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);

  async function sendGift() {
    if (!recipientName.trim()) return toast.error('Ingresa el nombre del destinatario');
    setSending(true);
    const result = await updateGiftCardRecipient({
      giftCardId: card.id,
      recipientName: recipientName.trim(),
    });
    setSending(false);
    if ('error' in result && result.error) return toast.error(result.error);
    toast.success('Gift Card regalada');
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className="text-left w-full" onClick={() => setOpen(true)}>
        <GiftCardPreviewFromRecord
          record={{ ...card, recipientName: card.recipientName || 'Mi Gift Card' }}
          storeName={storeName}
          mode="buyer"
          code={card.code || 'ACTIVA'}
        />
      </button>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setGiftMode(false); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Gift Card</DialogTitle>
            <DialogDescription>Saldo disponible: Bs. {Number(card.balance || 0).toFixed(2)}</DialogDescription>
          </DialogHeader>

          <GiftCardPreviewFromRecord
            record={{ ...card, recipientName: card.recipientName || 'Mi Gift Card' }}
            storeName={storeName}
            mode="buyer"
            code={card.code || 'ACTIVA'}
          />

          {giftMode && (
            <div className="space-y-2 rounded-2xl border p-3">
              <Label>Nombre del destinatario</Label>
              <Input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Para quien es" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setOpen(false)}>Cerrar</Button>
            {giftMode ? (
              <Button className="h-12 rounded-2xl" onClick={sendGift} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
              </Button>
            ) : (
              <Button className="h-12 rounded-2xl" onClick={() => setGiftMode(true)}>Regalar</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="gift-card-empty-icon mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="mx-auto mb-6 max-w-xs text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button asChild className="gift-card-primary-action h-12 rounded-2xl px-6 font-bold">
          <Link href={action.href}>
            {action.label}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
