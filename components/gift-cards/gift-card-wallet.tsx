'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  QrCode,
  Search,
  Send,
  ShoppingBag,
  Smartphone,
  Store,
  Upload,
  User,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CheckBalanceDialog } from './check-balance-dialog';
import { GiftCardBottomNav } from './gift-card-bottom-nav';
import { GiftCardCard } from './gift-card-card';
import { GiftCardPreview } from './gift-card-designer';
import { Drawer } from 'vaul';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  getGiftCardStoreProducts,
  getStoreGiftCardPaymentSettings,
  purchaseGiftCard,
  updateGiftCardRecipient,
  getSIGEUsers,
} from '@/app/actions/gift-cards';
import { sendGiftCardEmail } from '@/lib/send-giftcard-email';
import { Textarea } from '@/components/ui/textarea';

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

  const now = Date.now();
  const selectedStore = stores.find((store) => store.id === selectedStoreId) || stores[0] || null;
  const allUserCards = [...sent, ...received, ...saved, ...mine];
  const uniqueById = (cards: any[]) => cards.filter((card, index, self) => self.findIndex((item) => item.id === card.id) === index);
  const isCardActive = (card: any) => {
    const exp = card.expiresAt instanceof Date ? card.expiresAt.getTime() : Number(card.expiresAt);
    return card.status === 'active' && exp > now && card.balance > 0;
  };

  const pendingVerification = uniqueById(allUserCards).filter((card) => card.status === 'pending_payment');
  const activeMine = uniqueById(mine).filter(isCardActive);
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

          <div className="gift-card-tabs-nav flex w-full items-center gap-1 rounded-2xl border bg-card/80 p-1.5 shadow-sm backdrop-blur-xl">
            {[
              { id: 'stores', label: 'Tiendas', value: stores.length, icon: Store },
              { id: 'mine', label: 'Mis Gift Cards', value: activeMine.length, icon: Wallet },
              { id: 'sent', label: 'Enviadas', value: activeSent.length, icon: Send },
              { id: 'received', label: 'Recibidas', value: activeReceived.length, icon: Inbox },
              { id: 'history', label: 'Historial', value: historyCards.length, icon: Clock },
              { id: 'check', label: 'Consultar', value: null, icon: Search },
            ].map(({ id, label, value, icon: Icon }) => (
              <button
                key={id}
                onClick={() => (id === 'check' ? setCheckBalanceOpen(true) : handleTabChange(id))}
                className={`gift-card-tabs-trigger relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold transition-all ${
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
                  {pendingVerification.map((card) => (
                    <div key={card.id} className="opacity-70">
                      <GiftCardPreview
                        value={{
                          storeName: 'Tienda',
                          amount: card.amount,
                          recipientName: card.recipientName || 'Mi Gift Card',
                          message: card.message || '',
                          occasion: card.occasion || 'otros',
                          designId: card.templateId || 1,
                        }}
                        code="EN VERIFICACION"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-white/80 p-2 text-xs font-black text-amber-900">
                        <span>En verificacion</span>
                        <Button asChild size="sm" className="h-8 rounded-xl">
                          <a href="https://wa.me/59173214036" target="_blank" rel="noreferrer">WhatsApp</a>
                        </Button>
                      </div>
                    </div>
                  ))}
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
                    <Button className="rounded-xl" onClick={() => router.push(`/tienda/${selectedStore.id}/gift-cards?customDesign=true`)}>
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selectedStoreTemplates.map((template) => (
                    <button key={template.id} type="button" onClick={() => openTemplatePayment(template)} className="text-left">
                      <GiftCardPreview
                        value={{
                          templateName: template.name,
                          storeName: selectedStore.name,
                          amount: template.amount,
                          recipientName: 'Mi Gift Card',
                          message: template.description || '',
                          occasion: template.occasion || 'otros',
                          designId: template.designId,
                        }}
                        mode="seller"
                        code="SIN CODIGO"
                      />
                    </button>
                  ))}
                </div>
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
                {activeMine.map((card) => <OwnedGiftCardTile key={card.id} card={card} storeName="Tienda" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-0 space-y-4">
            {activeSent.length === 0 ? (
              <EmptyState icon={<Send className="h-10 w-10" />} title="No tienes regalos enviados activos" description="Cuando regales una Gift Card, aparecera aqui." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeSent.map((card) => <GiftCardCard key={card.id} giftCard={card} type="sent" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-0 space-y-4">
            {activeReceived.length === 0 ? (
              <EmptyState icon={<Inbox className="h-10 w-10" />} title="Aun no recibiste ningun regalo activo" description="Cuando alguien te envie una Gift Card, aparecera aqui." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeReceived.map((card) => <OwnedGiftCardTile key={card.id} card={card} storeName="Tienda" />)}
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

      <StorePaymentModal
        selectedTemplate={selectedTemplate}
        paymentSettings={paymentSettings}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        transactionNumber={transactionNumber}
        setTransactionNumber={setTransactionNumber}
        receiptPreview={receiptPreview}
        setReceiptFile={setReceiptFile}
        setReceiptPreview={setReceiptPreview}
        loadingPayment={loadingPayment}
        handleReceipt={handleReceipt}
        submitTemplatePayment={submitTemplatePayment}
        onClose={() => setSelectedTemplate(null)}
      />

      <CheckBalanceDialog open={checkBalanceOpen} onOpenChange={setCheckBalanceOpen} />
      <GiftCardBottomNav />
    </div>
  );
}

function StorePaymentModal({
  selectedTemplate,
  paymentSettings,
  paymentMethod,
  setPaymentMethod,
  transactionNumber,
  setTransactionNumber,
  receiptPreview,
  setReceiptFile,
  setReceiptPreview,
  loadingPayment,
  handleReceipt,
  submitTemplatePayment,
  onClose,
}: {
  selectedTemplate: StoreTemplate | null;
  paymentSettings: PaymentSettings;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  transactionNumber: string;
  setTransactionNumber: (v: string) => void;
  receiptPreview: string | null;
  setReceiptFile: (f: File | null) => void;
  setReceiptPreview: (v: string | null) => void;
  loadingPayment: boolean;
  handleReceipt: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitTemplatePayment: () => void;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const open = !!selectedTemplate;

  const renderBody = () => (
    <>
      {selectedTemplate && (
        <GiftCardPreview
          value={{
            templateName: selectedTemplate.name,
            storeName: selectedTemplate.storeName,
            amount: selectedTemplate.amount,
            recipientName: 'Mi Gift Card',
            message: selectedTemplate.description || '',
            occasion: selectedTemplate.occasion || 'otros',
            designId: selectedTemplate.designId,
          }}
          mode="buyer"
          code="PENDIENTE"
        />
      )}

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
              <button
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white"
                onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
              >
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
          <Input placeholder="Numero de transaccion" value={transactionNumber} onChange={(e) => setTransactionNumber(e.target.value)} />
        </div>
      )}
    </>
  );

  const renderFooter = () => (
    <div className="grid grid-cols-2 gap-2 border-t bg-background p-4 shrink-0">
      <Button variant="outline" className="h-12 rounded-2xl" onClick={onClose} disabled={loadingPayment}>Cancelar</Button>
      <Button className="h-12 rounded-2xl" onClick={submitTemplatePayment} disabled={loadingPayment}>
        {loadingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="flex max-h-[92svh] max-w-lg flex-col overflow-hidden rounded-2xl p-0">
          <DialogHeader className="shrink-0 border-b p-5">
            <DialogTitle>Enviar a verificacion</DialogTitle>
            <DialogDescription>La tienda revisara tu pago antes de activar el codigo.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">{renderBody()}</div>
          {renderFooter()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[2.5rem] max-h-[92vh] fixed bottom-0 left-0 right-0 z-50 border-t shadow-xl outline-none">
          <VisuallyHidden.Root>
            <DialogTitle>Enviar a verificacion</DialogTitle>
          </VisuallyHidden.Root>
          <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-4 border-b">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted absolute top-3 left-1/2 -translate-x-1/2" />
            <h2 className="text-base font-black mt-2">Enviar a verificacion</h2>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors mt-2">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">{renderBody()}</div>
          {renderFooter()}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function OwnedGiftCardTile({ card, storeName }: { card: any; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [giftMode, setGiftMode] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+591');
  const [message, setMessage] = useState(card.message || '¡Disfruta tu regalo!');
  const [recipientId, setRecipientId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp' | 'sige'>('email');
  const [sigeUsers, setSigeUsers] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (giftMode && sigeUsers.length === 0) {
      getSIGEUsers().then(setSigeUsers);
    }
  }, [giftMode, sigeUsers.length]);

  const resetForm = () => {
    setGiftMode(false);
    setRecipientName('');
    setRecipientEmail('');
    setWhatsappNumber('');
    setCountryCode('+591');
    setMessage(card.message || '¡Disfruta tu regalo!');
    setRecipientId('');
    setDeliveryMethod('email');
  };

  const handleClose = () => {
    resetForm();
    setOpen(false);
  };

  async function sendGift() {
    setSending(true);
    try {
      const finalRecipientName = recipientName.trim() || 'Mi Gift Card';
      const targetEmail = deliveryMethod === 'sige' 
        ? (sigeUsers.find(u => u.id === recipientId)?.email || '') 
        : recipientEmail;
      
      const cleanPhone = deliveryMethod === 'whatsapp' 
        ? `${countryCode.replace('+', '')}${whatsappNumber.replace(/\D/g, '')}` 
        : undefined;

      const result = await updateGiftCardRecipient({
        giftCardId: card.id,
        recipientName: finalRecipientName,
        recipientEmail: targetEmail || undefined,
        recipientId: deliveryMethod === 'sige' ? recipientId : undefined,
        recipientPhone: cleanPhone,
      });

      if ('success' in result && result.success) {
        const imageUrl = (result as any).cardImageUrl || card.cardImageUrl;

        if (deliveryMethod === 'email' && targetEmail) {
          // Obtener nombre del remitente actual (o su sesión/user)
          await sendGiftCardEmail({
            to: targetEmail,
            recipientName: finalRecipientName,
            senderName: card.senderName || 'Un amigo',
            message: message,
            cardImageUrl: imageUrl || '',
            amount: card.amount,
            code: card.code || '',
            storeId: card.businessId,
          });
        } else if (deliveryMethod === 'whatsapp' && cleanPhone) {
          let shareText = `¡Hola ${finalRecipientName}! Te he enviado una Gift Card de SIGE por Bs. ${card.amount.toFixed(2)}.`;
          if (message) shareText += `\nMensaje: "${message}"`;
          shareText += `\nCódigo de Canje: ${card.code || ''}`;
          shareText += `\nCanjéalo en: https://sige.click/gift-cards/check`;

          const absoluteUrl = imageUrl
            ? (imageUrl.startsWith('http') ? imageUrl : `https://sige.click${imageUrl}`)
            : null;
          const shareImageUrl = absoluteUrl
            ? absoluteUrl.replace('/api/images/gift-cards/', '/api/images/miniaturasGiftWhatsapp/')
            : `https://sige.click/gift-cards/check`;

          if (typeof navigator !== 'undefined' && navigator.share) {
            try {
              await navigator.share({ title: '🎁 Gift Card SIGE', text: shareText, url: shareImageUrl });
            } catch (err) {
              if ((err as Error).name !== 'AbortError') {
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText + '\n' + shareImageUrl)}`, '_blank');
              }
            }
          } else {
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText + '\n' + shareImageUrl)}`, '_blank');
          }
        }
        
        toast.success('¡Gift Card regalada con éxito!');
        handleClose();
        router.refresh();
      } else {
        toast.error((result as any).error || 'Error al regalar la Gift Card');
      }
    } catch (error) {
      toast.error('Algo salió mal');
    } finally {
      setSending(false);
    }
  }

  const renderContent = () => {
    if (!giftMode) {
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-xl font-black tracking-tight text-foreground">Detalles de Gift Card</h3>
              <p className="text-xs text-muted-foreground">Información general y opciones de uso.</p>
            </div>
            <span className="text-sm font-black text-primary bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 shrink-0">
              Saldo: Bs. {Number(card.balance || 0).toFixed(2)}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border bg-muted shadow-sm transition-all duration-300">
            {card.cardImageUrl ? (
              <div className="relative aspect-[1.62/1] w-full overflow-hidden">
                <Image src={card.cardImageUrl} alt="Gift Card" fill className="object-cover" />
              </div>
            ) : (
              <GiftCardPreview
                value={{
                  storeName,
                  amount: card.amount,
                  recipientName: card.recipientName || 'Mi Gift Card',
                  message: card.message || '',
                  occasion: card.occasion || 'otros',
                  designId: card.templateId || 1,
                }}
                mode="buyer"
                code={card.code || 'ACTIVA'}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" className="h-12 rounded-2xl font-bold border-2 hover:bg-muted" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              className="h-12 rounded-2xl font-black text-white bg-primary hover:bg-primary/90 shadow-md gap-2" 
              style={{ background: 'var(--premium-accent, #2563EB)' }}
              onClick={() => setGiftMode(true)}
            >
              Regalar
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">Regalar Gift Card</h3>
          <p className="text-xs text-muted-foreground">Configura los datos del destinatario para transferir tu tarjeta.</p>
        </div>


        <div className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-muted-foreground">Nombre del destinatario (opcional)</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Nombre del destinatario (Mi Gift Card por defecto)"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="pl-10 h-12 rounded-xl border-2 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground">Medio de envío</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                className={`h-12 flex flex-col gap-0.5 rounded-xl px-1 transition-all ${
                  deliveryMethod === 'email' 
                    ? 'bg-[#EA4335] hover:bg-[#D93025] text-white border-[#EA4335] shadow-sm' 
                    : 'border-2 hover:bg-muted'
                }`}
                onClick={() => setDeliveryMethod('email')}
              >
                <Mail className="h-4 w-4" />
                <span className="text-[9px] font-bold">Gmail</span>
              </Button>
              <Button
                type="button"
                variant={deliveryMethod === 'whatsapp' ? 'default' : 'outline'}
                className={`h-12 flex flex-col gap-0.5 rounded-xl px-1 transition-all ${
                  deliveryMethod === 'whatsapp' 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-sm' 
                    : 'border-2 hover:bg-muted'
                }`}
                onClick={() => setDeliveryMethod('whatsapp')}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-[9px] font-bold">WhatsApp</span>
              </Button>
              <Button
                type="button"
                variant={deliveryMethod === 'sige' ? 'default' : 'outline'}
                className={`h-12 flex flex-col gap-0.5 rounded-xl px-1 transition-all ${
                  deliveryMethod === 'sige' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-sm' 
                    : 'border-2 hover:bg-muted'
                }`}
                onClick={() => setDeliveryMethod('sige')}
              >
                <User className="h-4 w-4" />
                <span className="text-[9px] font-bold">Usuario SIGE</span>
              </Button>
            </div>
          </div>

          {deliveryMethod === 'email' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-250">
              <Label className="text-xs font-bold text-muted-foreground">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          )}

          {deliveryMethod === 'whatsapp' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-250">
              <Label className="text-xs font-bold text-muted-foreground">Número de WhatsApp</Label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-12 w-28 rounded-xl border-2 border-input bg-background px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer font-bold shrink-0"
                >
                  <option value="+591">🇧🇴 +591</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+593">🇪🇨 +593</option>
                  <option value="+595">🇵🇾 +595</option>
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+598">🇺🇾 +598</option>
                  <option value="+58">🇻🇪 +58</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+49">🇩🇪 +49</option>
                </select>
                <div className="relative flex-1">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="tel"
                    placeholder="7XXXXXXX"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-2 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {deliveryMethod !== 'sige' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-250">
              <Label className="text-xs font-bold text-muted-foreground">Mensaje de envío</Label>
              <Textarea
                placeholder="Escribe un mensaje para el destinatario..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] rounded-xl border-2 resize-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}

          {deliveryMethod === 'sige' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-250">
              <Label className="text-xs font-bold text-muted-foreground">Seleccionar Usuario SIGE</Label>
              <select
                className="w-full h-12 rounded-xl border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer font-bold"
                value={recipientId}
                onChange={(e) => {
                  const uid = e.target.value;
                  setRecipientId(uid);
                  const selectedUser = sigeUsers.find(u => u.id === uid);
                  if (selectedUser) {
                    setRecipientName(selectedUser.name);
                    setRecipientEmail(selectedUser.email);
                  }
                }}
              >
                <option value="">Selecciona un usuario...</option>
                {sigeUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" className="h-12 rounded-2xl font-bold border-2 hover:bg-muted" onClick={() => setGiftMode(false)} disabled={sending}>
            Atrás
          </Button>
          <Button 
            className={`h-12 rounded-2xl text-white font-black shadow-md ${
              deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 
              deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700' : 
              'bg-[#EA4335] hover:bg-[#D93025]'
            }`}
            onClick={sendGift} 
            disabled={
              sending || 
              (deliveryMethod === 'email' && !recipientEmail) || 
              (deliveryMethod === 'whatsapp' && !whatsappNumber) ||
              (deliveryMethod === 'sige' && !recipientId)
            }
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Regalar'}
          </Button>
        </div>
      </div>
    );
  };

  const cardThumbnail = (
    <button type="button" className="text-left w-full" onClick={() => setOpen(true)}>
      {card.cardImageUrl ? (
        <div className="relative aspect-[1.62/1] overflow-hidden rounded-[2rem] border bg-muted shadow-sm">
          <Image src={card.cardImageUrl} alt="Gift Card" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      ) : (
        <GiftCardPreview
          value={{
            storeName,
            amount: card.amount,
            recipientName: card.recipientName || 'Mi Gift Card',
            message: card.message || '',
            occasion: card.occasion || 'otros',
            designId: card.templateId || 1,
          }}
          mode="buyer"
          code={card.code || 'ACTIVA'}
        />
      )}
    </button>
  );

  if (isDesktop) {
    return (
      <>
        {cardThumbnail}
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md p-6 rounded-3xl overflow-hidden border-none shadow-2xl bg-background">
            <VisuallyHidden.Root>
              <DialogTitle>Gift Card</DialogTitle>
              <DialogDescription>Detalles y envío de la tarjeta de regalo</DialogDescription>
            </VisuallyHidden.Root>
            {renderContent()}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {cardThumbnail}
      <Drawer.Root open={open} onOpenChange={handleClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Drawer.Content className="bg-background flex flex-col rounded-t-[2.5rem] max-h-[92vh] fixed bottom-0 left-0 right-0 z-50 border-t shadow-xl outline-none">
            <VisuallyHidden.Root>
              <DialogTitle>Gift Card</DialogTitle>
            </VisuallyHidden.Root>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-muted mb-6" />
              <div className="max-w-md mx-auto">
                {renderContent()}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
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
