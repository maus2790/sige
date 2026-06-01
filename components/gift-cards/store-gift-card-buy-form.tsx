'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { toPng } from 'html-to-image';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  Gift,
  Loader2,
  Mail,
  MessageCircle,
  QrCode,
  Send,
  Smartphone,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { purchaseGiftCard, getSIGEUsers, getStoreGiftCardPaymentSettings, uploadGiftCardImage } from '@/app/actions/gift-cards';
import { getGiftCardTemplate } from './gift-card-templates';
import { GIFT_CARD_MAX_MESSAGE_LENGTH, getGiftCardMessages, getGiftCardOccasion } from './gift-card-customization';
import { GiftCardDesigner, GiftCardPreview } from './gift-card-designer';

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
  customStyle?: string | null;
};

type PaymentSettings = {
  qrUrl: string | null;
  bankDetails: string | null;
  tigoMoney: string | null;
  operatorPhone: string | null;
  maxAmount?: number | null;
} | null;

type DeliveryMethod = 'whatsapp' | 'email' | 'sige';
type DeliveryOption = 'send' | 'schedule';
type PaymentMethod = 'qr' | 'bank_transfer' | 'tigo_money' | 'operator';
const PAYMENT_METHODS: { id: PaymentMethod; icon: LucideIcon }[] = [
  { id: 'qr', icon: QrCode },
  { id: 'bank_transfer', icon: CreditCard },
  { id: 'tigo_money', icon: Smartphone },
  { id: 'operator', icon: MessageCircle },
];

export function StoreGiftCardBuyForm({
  templates,
  initialStoreId,
  initialPaymentSettings,
}: {
  templates: StoreGiftCardTemplate[];
  initialStoreId?: string;
  initialPaymentSettings?: PaymentSettings;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0); // step 0 is selection screen
  const [isCustomDesign, setIsCustomDesign] = useState<boolean | null>(null);
  
  // Custom design step fields
  const [customAmount, setCustomAmount] = useState('100');
  const [customStyle, setCustomStyle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const selectedTemplate = templates.find((item) => item.id === selectedTemplateId) || null;
  
  const [selectedDesignId, setSelectedDesignId] = useState(selectedTemplate?.designId || 1);
  const [selectedOccasion, setSelectedOccasion] = useState(selectedTemplate?.occasion || 'otros');
  const [message, setMessage] = useState(selectedTemplate?.description || '');
  
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('whatsapp');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('send');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sigeUsers, setSigeUsers] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(initialPaymentSettings || null);

  const filteredTemplates = useMemo(() => {
    return initialStoreId ? templates.filter((item) => item.storeId === initialStoreId) : templates;
  }, [templates, initialStoreId]);

  const activeStoreId = initialStoreId || templates[0]?.storeId;
  const activeStoreName = templates[0]?.storeName || 'Tienda';
  const activeMaxAmount = paymentSettings?.maxAmount ?? 5000;

  useEffect(() => {
    if (!selectedTemplate) return;
    if (!isCustomDesign) {
      setSelectedDesignId(selectedTemplate.designId);
      setSelectedOccasion(selectedTemplate.occasion || 'otros');
      setMessage(selectedTemplate.description || getGiftCardMessages(selectedTemplate.occasion || 'otros')[0]);
    }

    getStoreGiftCardPaymentSettings(selectedTemplate.storeId)
      .then((settings) => {
        setPaymentSettings(settings);
      })
      .catch((err) => {
        console.error('Error fetching store payment settings:', err);
      });
  }, [selectedTemplateId, isCustomDesign]);

  // Load store settings when entering custom flow as well
  useEffect(() => {
    if (activeStoreId) {
      getStoreGiftCardPaymentSettings(activeStoreId)
        .then((settings) => {
          setPaymentSettings(settings);
        })
        .catch((err) => {
          console.error('Error fetching store payment settings:', err);
        });
    }
  }, [activeStoreId]);

  async function loadSigeUsers() {
    if (sigeUsers.length === 0) {
      setSigeUsers(await getSIGEUsers());
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El comprobante no puede superar 5MB');
      return;
    }
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
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'No se pudo subir el comprobante');
    }
    return result.url as string;
  }

  async function handleSubmit() {
    if (!isCustomDesign && !selectedTemplate) return toast.error('Selecciona una Gift Card');
    if (paymentMethod !== 'operator' && !receiptFile) return toast.error('Sube comprobante de pago');
    if (paymentMethod !== 'operator' && !transactionNumber) return toast.error('Ingresa numero de transaccion');

    setLoading(true);
    try {
      const receiptUrl = paymentMethod === 'operator' ? '' : await uploadReceipt();
      
      let cardImageUrl: string | undefined = undefined;
      if (cardRef.current) {
        toast.loading('Generando diseño de tarjeta...', { id: 'card-image' });
        try {
          const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            style: { margin: '0' },
            fontEmbedCSS: '',
            filter: (node: any) => {
              if (node.tagName === 'STYLE' || node.tagName === 'LINK') {
                try {
                  const sheet = (node as any).sheet;
                  if (sheet && !sheet.cssRules) return false;
                } catch {
                  return false;
                }
              }
              return true;
            }
          });
          const imgResult = await uploadGiftCardImage(dataUrl);
          if (imgResult.success) {
            cardImageUrl = imgResult.url;
            toast.success('Diseño guardado', { id: 'card-image' });
          } else {
            toast.error('Error al guardar diseño en Cloudflare', { id: 'card-image' });
          }
        } catch (e) {
          console.error("Error generating card image:", e);
        }
      }

      const buyerName = session?.user?.name || 'Mi Inventario';
      const payload: any = {
        recipientName: buyerName,
        message,
        templateId: selectedDesignId,
        occasion: selectedOccasion,
        paymentMethod,
        transactionNumber,
        receiptUrl,
        cardImageUrl,
        customStyle: selectedDesignId === 99 ? customStyle : undefined,
        saveToWallet: true,
        recipientId: (session?.user as any)?.id,
      };

      if (isCustomDesign) {
        payload.amount = Number(customAmount);
        payload.businessId = activeStoreId;
      } else {
        payload.storeGiftCardTemplateId = selectedTemplate?.id;
      }

      const result = await purchaseGiftCard(payload);

      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Gift Card enviada a verificación de la tienda');
      router.push('/gift-cards?tab=mine');
    } catch (error: any) {
      toast.error(error.message || 'No se pudo procesar la Gift Card');
    } finally {
      setLoading(false);
    }
  }

  const displayAmount = isCustomDesign ? Number(customAmount || 0) : (selectedTemplate?.amount || 0);

  if (filteredTemplates.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Gift className="h-14 w-14 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-black mb-2">No hay Gift Cards activas</h1>
        <p className="text-sm text-muted-foreground mb-6">Las tiendas aun no habilitaron tarjetas para regalar.</p>
        <Button asChild variant="outline"><Link href="/gift-cards">Volver</Link></Button>
      </div>
    );
  }

  return (
    <div className="gift-card-buy-section min-h-screen pb-24 bg-background">
      {step > 0 && (
        <div className="sticky top-16 z-40 bg-background/85 backdrop-blur-xl border-b">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2 justify-center">
            {isCustomDesign ? (
              [1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex flex-1 items-center gap-2 max-w-[120px]">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${step >= item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > item ? <Check className="h-4 w-4" /> : item}
                  </div>
                  {item < 5 && <div className={`h-1 flex-1 rounded-full ${step > item ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))
            ) : (
              [1, 5].map((item, idx) => (
                <div key={item} className="flex flex-1 items-center gap-2 max-w-[120px]">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${step >= item ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > item ? <Check className="h-4 w-4" /> : (idx + 1)}
                  </div>
                  {item === 1 && <div className={`h-1 flex-1 rounded-full ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 grid gap-6 lg:grid-cols-[minmax(300px,430px)_1fr] items-start">
        <div className="sticky top-[136px] z-20 self-start bg-background/95 pb-4 pt-1 backdrop-blur-md lg:sticky lg:top-32 lg:bg-transparent lg:backdrop-blur-none w-full">
          {step > 0 ? (
            <div ref={cardRef} className="w-full">
              <GiftCardPreview
                value={{
                  templateName: isCustomDesign ? 'Mi Gift Card' : (selectedTemplate?.name || 'Gift Card'),
                  storeName: isCustomDesign ? activeStoreName : (selectedTemplate?.storeName || 'Tienda'),
                  amount: displayAmount,
                  recipientName,
                  message,
                  occasion: selectedOccasion,
                  designId: selectedDesignId,
                  customStyle: isCustomDesign ? customStyle : (selectedTemplate?.customStyle || undefined),
                }}
                isBuyer={true}
              />
            </div>
          ) : (
            <div className="aspect-[1.62/1] w-full bg-muted/30 rounded-[2rem] border-2 border-dashed flex flex-col justify-center items-center p-8 text-center text-muted-foreground">
              <Gift className="h-10 w-10 mb-2 text-muted-foreground/60 animate-pulse" />
              <p className="font-bold text-sm">Previsualización de la Gift Card</p>
              <p className="text-xs">Se actualizará en tiempo real a medida que diseñes tu tarjeta.</p>
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Adquirir Gift Card</CardTitle>
                <CardDescription>Elige entre comprar un diseño preestablecido o elaborar tu propio estilo personalizado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setIsCustomDesign(false);
                      setStep(1);
                    }}
                    className="flex flex-col items-center justify-between border rounded-2xl p-6 text-center hover:border-primary hover:bg-muted/30 transition group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition duration-300">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-black text-sm block">Comprar diseño listo</span>
                    <span className="text-xs text-muted-foreground block mt-1">Elige una tarjeta creada por la tienda y ve directo al pago.</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCustomDesign(true);
                      setStep(1);
                    }}
                    className="flex flex-col items-center justify-between border rounded-2xl p-6 text-center hover:border-primary hover:bg-muted/30 transition group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-105 transition duration-300">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-black text-sm block">Diseñar propia tarjeta</span>
                    <span className="text-xs text-muted-foreground block mt-1">Personaliza el monto, mensajes sugeridos, y estilos a tu gusto.</span>
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && !isCustomDesign && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Elige un diseño del vendedor</CardTitle>
                <CardDescription>Tarjetas diseñadas y publicadas por la tienda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {filteredTemplates.map((template) => {
                    const visual = getGiftCardTemplate(template.designId);
                    const selected = selectedTemplateId === template.id;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(template.id);
                        }}
                        className={`card-shine relative overflow-hidden rounded-2xl p-3 text-left text-white ring-offset-background transition aspect-[1.62/1] ${visual.className} ${selected ? 'scale-[1.03] ring-2 ring-primary ring-offset-2 shadow-lg' : 'opacity-90 hover:opacity-100 hover:scale-[1.01]'}`}
                      >
                        <p className="text-[7px] uppercase font-black opacity-75 truncate">{template.storeName}</p>
                        <p className="text-[9px] font-black leading-tight truncate mt-0.5">{template.name}</p>
                        <p className="text-xs font-black mt-2">Bs. {template.amount.toFixed(2)}</p>
                        {selected && <Check className="absolute bottom-1 right-1 h-3.5 w-3.5 drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4 mr-2" /> Atrás</Button>
                  <Button className="flex-1" onClick={() => { loadSigeUsers(); setStep(5); }}>Comprar ahora <ChevronRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && isCustomDesign && (
            <>
              <CardHeader>
                <CardTitle>Monto de la Gift Card</CardTitle>
                <CardDescription>Elige o escribe el monto (Máx: Bs. {activeMaxAmount.toLocaleString()})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto personalizado Bs.</Label>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (Number(val) >= 0 && Number(val) <= activeMaxAmount)) {
                        setCustomAmount(val);
                      }
                    }}
                    placeholder="100"
                    className="h-12 rounded-2xl text-lg font-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-black">Montos sugeridos</Label>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const presets = [100, 300, 500, 1000, 5000].filter(p => p < activeMaxAmount);
                      if (!presets.includes(activeMaxAmount)) presets.push(activeMaxAmount);
                      presets.sort((a, b) => a - b);
                      return presets.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant={Number(customAmount) === p ? 'default' : 'outline'}
                          className="h-10 rounded-xl px-4 text-xs font-black"
                          onClick={() => setCustomAmount(String(p))}
                        >
                          Bs. {p} {p === activeMaxAmount ? '(Max)' : ''}
                        </Button>
                      ));
                    })()}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4 mr-2" /> Atrás</Button>
                  <Button className="flex-1" onClick={() => setStep(2)}>Siguiente <ChevronRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && isCustomDesign && (
            <>
              <CardHeader>
                <CardTitle>Ocasión y Mensaje</CardTitle>
                <CardDescription>Selecciona la ocasión y escoge una sugerencia o escribe un mensaje personalizado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GiftCardDesigner
                  value={{
                    storeName: activeStoreName,
                    amount: customAmount,
                    message,
                    occasion: selectedOccasion,
                    designId: selectedDesignId,
                  }}
                  onChange={(patch) => {
                    if (patch.message !== undefined) setMessage(patch.message);
                    if (patch.occasion !== undefined) setSelectedOccasion(patch.occasion);
                  }}
                  sections={['occasion', 'suggestions', 'message']}
                  hidePreview={true}
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Atrás</Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>Siguiente <ChevronRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && isCustomDesign && (
            <>
              <CardHeader>
                <CardTitle>Estilo de tarjeta</CardTitle>
                <CardDescription>Escoge el estilo visual para la Gift Card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GiftCardDesigner
                  value={{
                    storeName: activeStoreName,
                    amount: customAmount,
                    message,
                    occasion: selectedOccasion,
                    designId: selectedDesignId,
                    customStyle,
                  }}
                  onChange={(patch) => {
                    if (patch.designId !== undefined) setSelectedDesignId(patch.designId);
                    if (patch.customStyle !== undefined) setCustomStyle(patch.customStyle);
                  }}
                  sections={['style']}
                  hidePreview={true}
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" /> Atrás</Button>
                  <Button className="flex-1" onClick={() => setStep(5)}>Siguiente <ChevronRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </>
          )}



          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pago a tienda y verificación</CardTitle>
                <CardDescription>Realiza el pago y registra el comprobante. El comercio verificará el pago para activar la tarjeta.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">


                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(({ id, icon: Icon }) => (
                    <Button key={id} variant={paymentMethod === id ? 'default' : 'outline'} className="rounded-xl h-11" onClick={() => setPaymentMethod(id)}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>

                {paymentMethod === 'qr' && paymentSettings?.qrUrl && (
                  <div className="relative mx-auto h-44 w-44 rounded-2xl overflow-hidden border bg-white shadow-sm">
                    <Image src={paymentSettings.qrUrl} alt="QR de pago" fill className="object-contain p-2" />
                  </div>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <pre className="rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap font-mono border">
                    {paymentSettings?.bankDetails || 'La tienda no configuró datos bancarios.'}
                  </pre>
                )}
                {paymentMethod === 'tigo_money' && (
                  <div className="rounded-xl bg-muted p-3 font-black text-center border">
                    Tigo Money: {paymentSettings?.tigoMoney || 'La tienda no configuró Tigo Money.'}
                  </div>
                )}
                {paymentMethod === 'operator' && (
                  <div className="rounded-xl bg-muted p-3 text-sm text-center border">
                    Contacta a la tienda por Whatsapp/Llamada: <br />
                    <strong>{paymentSettings?.operatorPhone || 'Teléfono no configurado'}</strong>
                  </div>
                )}

                {paymentMethod !== 'operator' && (
                  <>
                    <Label className="font-bold">Comprobante de pago</Label>
                    {receiptPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border">
                        <div className="relative aspect-video">
                          <Image src={receiptPreview} alt="Comprobante" fill className="object-contain bg-muted" />
                        </div>
                        <button
                          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition"
                          onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed gap-2 hover:bg-muted/50 transition">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Subir comprobante</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      </label>
                    )}
                    <Input placeholder="Número de transacción" value={transactionNumber} onChange={(e) => setTransactionNumber(e.target.value)} className="h-11" />
                  </>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(isCustomDesign ? 3 : 1)} disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Atrás
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="font-black">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Finalizar y enviar'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
