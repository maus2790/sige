'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Check, ChevronRight, CreditCard, Gift, Loader2, Mail, MessageCircle, QrCode, Send, Smartphone, Sparkles, Upload, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { purchaseGiftCard, getSIGEUsers, getStoreGiftCardPaymentSettings } from '@/app/actions/gift-cards';
import { GiftCardDesigner, GiftCardPreview } from './gift-card-designer';
import { getGiftCardMessages } from './gift-card-customization';

type StoreGiftCardTemplate = {
  id: string;
  storeId: string;
  name: string;
  amount: number;
  description: string | null;
  designId: number;
  occasion: string | null;
  storeName: string;
  storeLogoUrl: string | null;
};

type PaymentSettings = {
  qrUrl: string | null;
  bankDetails: string | null;
  tigoMoney: string | null;
  operatorPhone: string | null;
  maxAmount?: number | null;
} | null;

type DeliveryMethod = 'whatsapp' | 'email' | 'sige';
type PaymentMethod = 'qr' | 'bank_transfer' | 'tigo_money' | 'operator';

const PAYMENT_METHODS: { id: PaymentMethod; icon: LucideIcon; label: string }[] = [
  { id: 'qr', icon: QrCode, label: 'QR' },
  { id: 'bank_transfer', icon: CreditCard, label: 'Banco' },
  { id: 'tigo_money', icon: Smartphone, label: 'Tigo' },
  { id: 'operator', icon: MessageCircle, label: 'Operador' },
];

export function StoreGiftCardBuyForm({
  templates,
  initialStoreId,
  initialPaymentSettings,
  initialTemplateId,
  initialStep,
  initialCustomDesign,
}: {
  templates: StoreGiftCardTemplate[];
  initialStoreId?: string;
  initialPaymentSettings?: PaymentSettings;
  initialTemplateId?: string;
  initialStep?: number;
  skipSelectionStep?: boolean;
  initialCustomDesign?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep || 1);
  const [isCustomDesign, setIsCustomDesign] = useState(initialCustomDesign || false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId || templates[0]?.id || '');
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) || null;
  const filteredTemplates = useMemo(() => initialStoreId ? templates.filter((item) => item.storeId === initialStoreId) : templates, [templates, initialStoreId]);
  const activeStoreId = initialStoreId || selectedTemplate?.storeId || filteredTemplates[0]?.storeId || '';
  const activeStoreName = selectedTemplate?.storeName || filteredTemplates[0]?.storeName || 'Tienda';

  const [amount, setAmount] = useState(String(selectedTemplate?.amount || 100));
  const [selectedDesignId, setSelectedDesignId] = useState(selectedTemplate?.designId || 1);
  const [selectedOccasion, setSelectedOccasion] = useState(selectedTemplate?.occasion || 'otros');
  const [message, setMessage] = useState(selectedTemplate?.description || getGiftCardMessages(selectedTemplate?.occasion || 'otros')[0]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('whatsapp');
  const [sigeUsers, setSigeUsers] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(initialPaymentSettings || null);
  const [loading, setLoading] = useState(false);

  const maxAmount = paymentSettings?.maxAmount ?? 5000;
  const displayAmount = isCustomDesign ? Number(amount || 0) : selectedTemplate?.amount || 0;

  useEffect(() => {
    if (!selectedTemplate || isCustomDesign) return;
    setAmount(String(selectedTemplate.amount));
    setSelectedDesignId(selectedTemplate.designId);
    setSelectedOccasion(selectedTemplate.occasion || 'otros');
    setMessage(selectedTemplate.description || getGiftCardMessages(selectedTemplate.occasion || 'otros')[0]);
  }, [selectedTemplate?.id, isCustomDesign]);

  useEffect(() => {
    if (!activeStoreId) return;
    getStoreGiftCardPaymentSettings(activeStoreId).then(setPaymentSettings).catch(() => {});
  }, [activeStoreId]);

  async function loadSigeUsers() {
    if (sigeUsers.length === 0) setSigeUsers(await getSIGEUsers());
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleSubmit() {
    if (!activeStoreId) return toast.error('Tienda no encontrada');
    if (!isCustomDesign && !selectedTemplate) return toast.error('Selecciona una Gift Card');
    if (isCustomDesign && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) return toast.error('Ingresa un monto valido');
    if (paymentMethod !== 'operator' && !receiptFile) return toast.error('Sube comprobante de pago');
    if (paymentMethod !== 'operator' && !transactionNumber) return toast.error('Ingresa numero de transaccion');

    setLoading(true);
    try {
      const receiptUrl = paymentMethod === 'operator' ? '' : await uploadReceipt();
      const result = await purchaseGiftCard({
        amount: isCustomDesign ? Number(amount) : undefined,
        businessId: activeStoreId,
        storeGiftCardTemplateId: isCustomDesign ? undefined : selectedTemplate?.id,
        recipientName: 'Mi Gift Card',
        saveToWallet: true,
        message,
        templateId: selectedDesignId,
        occasion: selectedOccasion,
        paymentMethod,
        transactionNumber,
        receiptUrl,
      });

      if ('error' in result && result.error) return toast.error(result.error);
      toast.success('Gift Card enviada a verificacion de la tienda');
      router.push('/gift-cards?tab=sent');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo procesar la Gift Card');
    } finally {
      setLoading(false);
    }
  }

  if (filteredTemplates.length === 0 && !initialStoreId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Gift className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-black">No hay Gift Cards disponibles</h1>
        <p className="mb-6 text-sm text-muted-foreground">Las tiendas aun no habilitaron tarjetas para regalar.</p>
        <Button asChild variant="outline"><Link href="/gift-cards">Volver</Link></Button>
      </div>
    );
  }

  const previewValue = {
    templateName: isCustomDesign ? 'Gift Card personalizada' : selectedTemplate?.name || 'Gift Card',
    storeName: activeStoreName,
    amount: displayAmount,
    recipientName,
    message,
    occasion: selectedOccasion,
    designId: selectedDesignId,
  };

  return (
    <div className="gift-card-buy-section min-h-screen bg-background pb-24">
      <div className="sticky top-16 z-40 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${step >= item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {step > item ? <Check className="h-4 w-4" /> : item}
              </div>
              {item < 6 && <div className={`h-1 flex-1 rounded-full ${step > item ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(300px,430px)_1fr]">
        <div className="lg:sticky lg:top-32">
          <GiftCardPreview value={previewValue} mode="buyer" />
        </div>

        <Card className="overflow-hidden">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Elegir inicio</CardTitle>
                <CardDescription>Compra una disponible o disena desde cero para esta tienda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant={!isCustomDesign ? 'default' : 'outline'} className="h-16 rounded-2xl" onClick={() => setIsCustomDesign(false)}>Usar disponible</Button>
                  <Button variant={isCustomDesign ? 'default' : 'outline'} className="h-16 rounded-2xl" onClick={() => setIsCustomDesign(true)}>Disenar desde cero</Button>
                </div>
                {!isCustomDesign && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(template.id)}
                        className={`rounded-2xl border p-3 text-left transition ${selectedTemplateId === template.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-muted/50'}`}
                      >
                        <p className="font-black">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.storeName}</p>
                        <p className="mt-2 font-black">Bs. {template.amount.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                )}
                <Button className="h-12 w-full rounded-2xl" onClick={() => setStep(2)}>
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader><CardTitle>Ocasion</CardTitle><CardDescription>Elige la ocasion e icono de la tarjeta.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <GiftCardDesigner value={previewValue} onChange={(patch) => {
                  if (patch.occasion) setSelectedOccasion(patch.occasion);
                  if (patch.message !== undefined) setMessage(patch.message);
                }} sections={['occasion']} hidePreview />
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Atras</Button><Button className="flex-1" onClick={() => setStep(3)}>Siguiente</Button></div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader><CardTitle>Sugerencias y mensaje</CardTitle><CardDescription>Escoge una sugerencia o escribe un mensaje corto.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <GiftCardDesigner value={previewValue} onChange={(patch) => patch.message !== undefined && setMessage(patch.message)} sections={['suggestions']} hidePreview />
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Atras</Button><Button className="flex-1" onClick={() => setStep(4)}>Siguiente</Button></div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader><CardTitle>Estilo de tarjeta</CardTitle><CardDescription>Todos los tonos disponibles para personalizar.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <GiftCardDesigner value={previewValue} onChange={(patch) => patch.designId && setSelectedDesignId(patch.designId)} sections={['style']} hidePreview />
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Atras</Button><Button className="flex-1" onClick={() => setStep(5)}>Pago</Button></div>
              </CardContent>
            </>
          )}

          {step === 5 && (
            <>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pago a tienda</CardTitle><CardDescription>El dueno verificara tu comprobante.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {isCustomDesign && (
                  <div className="space-y-2">
                    <Label>Monto Bs.</Label>
                    <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-12 rounded-2xl" max={maxAmount} />
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(({ id, icon: Icon, label }) => <Button key={id} variant={paymentMethod === id ? 'default' : 'outline'} className="h-12 flex-col gap-1 text-[10px]" onClick={() => setPaymentMethod(id)}><Icon className="h-4 w-4" />{label}</Button>)}
                </div>
                {paymentMethod === 'qr' && paymentSettings?.qrUrl && <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-2xl border bg-white"><Image src={paymentSettings.qrUrl} alt="QR de pago" fill className="object-contain p-2" /></div>}
                {paymentMethod === 'bank_transfer' && <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">{paymentSettings?.bankDetails || 'La tienda no configuro datos bancarios.'}</pre>}
                {paymentMethod === 'tigo_money' && <div className="rounded-xl bg-muted p-3 font-black">Tigo Money: {paymentSettings?.tigoMoney || 'No configurado'}</div>}
                {paymentMethod === 'operator' && <div className="rounded-xl bg-muted p-3 text-sm">Contacta a la tienda: {paymentSettings?.operatorPhone || 'telefono no configurado'}</div>}
                {paymentMethod !== 'operator' && (
                  <>
                    <Label>Comprobante</Label>
                    {receiptPreview ? (
                      <div className="relative overflow-hidden rounded-2xl border">
                        <div className="relative aspect-video"><Image src={receiptPreview} alt="Comprobante" fill className="object-contain bg-muted" /></div>
                        <button className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Subir comprobante</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      </label>
                    )}
                    <Input placeholder="Numero de transaccion" value={transactionNumber} onChange={(event) => setTransactionNumber(event.target.value)} />
                  </>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" onClick={() => setStep(4)} disabled={loading}>Atras</Button>
                  <Button variant="ghost" asChild disabled={loading}><Link href="/gift-cards">Cancelar</Link></Button>
                  <Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}</Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
