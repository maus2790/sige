'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Search, User, Mail, MessageCircle, Check, CreditCard, ChevronRight, ChevronLeft, Cake, Heart, GraduationCap, CalendarDays, Baby, Handshake, TreePine, Sparkles, Home, PartyPopper, Send, Wallet, Clock, Upload, Plus } from 'lucide-react';
import { purchaseGiftCard, searchGiftingProducts, saveGiftCardToWallet, getSIGEUsers, uploadGiftCardImage, uploadGiftCardReceipt } from '@/app/actions/gift-cards';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useDebounce } from 'use-debounce';

const TEMPLATES = [
  { id: 1, name: 'BLUE CARD', className: 'bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900' },
  { id: 2, name: 'BLACK CARD', className: 'bg-linear-to-br from-zinc-800 via-zinc-900 to-black' },
  { id: 3, name: 'GOLD CARD', className: 'bg-linear-to-br from-yellow-400 via-amber-500 to-orange-600' },
  { id: 4, name: 'ROSE CARD', className: 'bg-linear-to-br from-rose-500 via-pink-600 to-fuchsia-700' },
  { id: 5, name: 'EMERALD CARD', className: 'bg-linear-to-br from-emerald-500 via-green-600 to-teal-800' },
  { id: 6, name: 'PURPLE CARD', className: 'bg-linear-to-br from-purple-600 via-violet-700 to-indigo-950' },
  { id: 7, name: 'ORANGE CARD', className: 'bg-linear-to-br from-orange-400 via-red-500 to-rose-600' },
  { id: 8, name: 'NEON CARD', className: 'bg-zinc-950 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' },
];

const EVENT_MESSAGES: Record<string, string[]> = {
  cumpleaños: [
    "¡Feliz cumpleaños! Que tengas un día increíble.",
    "Un pequeño regalo para una gran persona. ¡Felicidades!",
    "Espero que este regalo te haga tan feliz como tú nos haces.",
    "¡Muchas felicidades en tu día! Disfruta al máximo.",
    "¡Un año más de aventuras! Feliz cumple."
  ],
  boda: [
    "¡Felicidades por su unión! Les deseamos lo mejor.",
    "Que este sea el comienzo de una vida llena de amor.",
    "Un pequeño detalle para su nuevo hogar. ¡Felicidades!",
    "Que su amor siga creciendo cada día más. ¡Enhorabuena!",
    "¡Vivan los novios! Les deseamos una vida plena y feliz."
  ],
  graduación: [
    "¡Felicidades graduado! Todo tu esfuerzo valió la pena.",
    "El comienzo de una gran carrera profesional. ¡Éxitos!",
    "Estamos muy orgullosos de tus logros. ¡Felicidades!",
    "Que este sea solo el primero de muchos éxitos.",
    "¡Lo lograste! Ahora a conquistar el mundo."
  ],
  aniversario: [
    "¡Feliz aniversario! Por muchos años más juntos.",
    "Celebrando un año más de amor y felicidad.",
    "Gracias por ser mi compañero/a de vida. Te amo.",
    "Un detalle especial para un día inolvidable.",
    "Que su amor siga brillando como el primer día."
  ],
  nacimiento: [
    "¡Bienvenido al mundo! Felicidades a los nuevos papás.",
    "Un pequeño detalle para el nuevo integrante de la familia.",
    "Deseamos mucha salud y felicidad para el bebé.",
    "¡Enhorabuena por el milagro de la vida!",
    "Que este regalo sea de mucha utilidad para el peque."
  ],
  agradecimiento: [
    "¡Muchas gracias por todo! Eres increíble.",
    "Un pequeño gesto de mi parte por todo tu apoyo.",
    "Gracias por estar ahí cuando más te necesité.",
    "Aprecio mucho tu ayuda y amistad. ¡Gracias!",
    "No tengo palabras para agradecerte. Espero te guste."
  ],
  navidad: [
    "¡Feliz Navidad! Que la paz y el amor reinen en tu hogar.",
    "Deseándote unas fiestas llenas de alegría y magia.",
    "Un regalo especial para cerrar el año con broche de oro.",
    "¡Felices fiestas! Disfruta con tus seres queridos.",
    "Que el próximo año venga cargado de éxitos y salud."
  ],
  "san valentín": [
    "¡Feliz San Valentín! Te quiero muchísimo.",
    "Un detalle lleno de amor para mi persona favorita.",
    "Gracias por hacer cada día especial. Te amo.",
    "Celebrando el amor y la amistad en este día.",
    "Para mi media naranja, con todo mi cariño."
  ],
  hogar: [
    "¡Felicidades por tu nueva casa! Que esté llena de alegría.",
    "Un detalle para que tu nuevo hogar sea aún más acogedor.",
    "Deseándote lo mejor en esta nueva etapa de tu vida.",
    "¡Bienvenido a tu nuevo hogar! A disfrutarlo mucho.",
    "Que cada rincón de tu casa se llene de hermosos recuerdos."
  ],
  otros: [
    "Un detalle especial para ti.",
    "Espero que disfrutes mucho de este regalo.",
    "Pensando en ti. ¡Que lo disfrutes!",
    "Para alguien muy especial.",
    "¡Sorpresa! Espero que te guste mucho."
  ]
};

const PREDEFINED_AMOUNTS = [10, 20, 50, 100, 150, 200, 300, 500, 1000];
const MAX_CHARS = 60;

export function GiftCardBuyForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'whatsapp' | 'sige'>('whatsapp');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [recipientId, setRecipientId] = useState<string>('');
  const [sigeUsers, setSigeUsers] = useState<any[]>([]);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [purchasedId, setPurchasedId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'transfer' | 'tigo' | null>(null);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generar código cuando se llega al paso 3
  useEffect(() => {
    if (step === 3 && !giftCardCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 4 === 0) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGiftCardCode(code);
    }
    
    if (step === 3 && sigeUsers.length === 0) {
      getSIGEUsers().then(setSigeUsers);
    }
  }, [step, giftCardCode, sigeUsers.length]);
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Refs for sliders and capture
  const occasionsRef = useRef<HTMLDivElement>(null);
  const designsRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.6;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchGiftingProducts(debouncedQuery);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setAmount(product.price);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleMessageChange = (val: string) => {
    if (val.length <= MAX_CHARS) {
      setMessage(val);
    } else {
      toast.error(`Máximo ${MAX_CHARS} caracteres para evitar deformar la tarjeta`);
    }
  };

  const charCount = message.length;

  const getOccasionIcon = (occ: string | null) => {
    switch (occ) {
      case 'cumpleaños': return <Cake className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'boda': return <Heart className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'graduación': return <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'aniversario': return <CalendarDays className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'nacimiento': return <Baby className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'agradecimiento': return <Handshake className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'navidad': return <TreePine className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'san valentín': return <Sparkles className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'hogar': return <Home className="h-4 w-4 lg:h-5 lg:w-5" />;
      case 'otros': return <PartyPopper className="h-4 w-4 lg:h-5 lg:w-5" />;
      default: return <Gift className="h-4 w-4 lg:h-5 lg:w-5" />;
    }
  };

  const handlePurchase = async () => {
    const isFormValid = () => {
      if (!recipientName) return false;
      if (deliveryMethod === 'email') return !!recipientEmail;
      if (deliveryMethod === 'whatsapp') return !!whatsappNumber;
      if (deliveryMethod === 'sige') return !!recipientId;
      return false;
    };

    if (!isFormValid()) {
      toast.error('Por favor completa los datos del destinatario');
      return;
    }

    setLoading(true);
    try {
      let finalReceiptUrl = undefined;
      let finalCardImageUrl = undefined;

      // 1. Si hay comprobante de pago, subirlo a R2
      if (receiptPreview && paymentMethod !== 'qr') {
        toast.loading('Subiendo comprobante...', { id: 'upload-receipt' });
        const receiptResult = await uploadGiftCardReceipt(receiptPreview);
        if (receiptResult.success) {
          finalReceiptUrl = receiptResult.url;
          toast.success('Comprobante subido', { id: 'upload-receipt' });
        } else {
          toast.error('Error al subir comprobante', { id: 'upload-receipt' });
        }
      }

      // 2. Generar imagen de la tarjeta SIEMPRE para guardarla
      if (cardRef.current) {
        toast.loading('Generando diseño final...', { id: 'card-image' });
        try {
          const dataUrl = await toPng(cardRef.current, { 
            cacheBust: true,
            pixelRatio: 2, 
            style: { margin: '0' },
            fontEmbedCSS: '', // Avoid CSS rules access errors for fonts
            filter: (node: any) => {
              // Skip style/link tags that might have CORS issues
              if (node.tagName === 'STYLE' || node.tagName === 'LINK') {
                try {
                  const sheet = (node as any).sheet;
                  if (sheet && !sheet.cssRules) return false;
                } catch (e) {
                  return false;
                }
              }
              return true;
            }
          });
          const imgResult = await uploadGiftCardImage(dataUrl);
          if (imgResult.success) {
            finalCardImageUrl = imgResult.url;
            toast.success('Diseño generado', { id: 'card-image' });
          } else {
            toast.error('Error al subir diseño', { id: 'card-image' });
          }
        } catch (e) {
          console.error("Error generating card image", e);
          toast.error('Error generando vista previa', { id: 'card-image' });
        }
      }

      // 3. Procesar la compra en DB
      toast.loading('Procesando compra...', { id: 'purchase' });
      const result = await purchaseGiftCard({
        amount,
        recipientEmail: deliveryMethod === 'sige' ? (sigeUsers.find(u => u.id === recipientId)?.email || '') : recipientEmail,
        recipientName: deliveryMethod === 'sige' ? (sigeUsers.find(u => u.id === recipientId)?.name || recipientName) : recipientName,
        message,
        templateId,
        occasion: selectedEvent || undefined,
        businessId: selectedProduct?.storeId || 'SIGE-GLOBAL',
        productId: selectedProduct?.id,
        recipientId: deliveryMethod === 'sige' ? recipientId : undefined,
        cardImageUrl: finalCardImageUrl,
        receiptUrl: finalReceiptUrl
      });

      if (result.success) {
        toast.success('¡Compra exitosa!', { id: 'purchase' });
        
        // Si es WhatsApp, preparar el mensaje
        if (deliveryMethod === 'whatsapp' && finalCardImageUrl) {
          const senderName = session?.user?.name || "Un amigo/a"; 
          const occasionEmoji = selectedEvent === 'cumpleaños' ? '🎂' : selectedEvent === 'boda' ? '❤️' : '🎁';
          const text = `¡Hola ${recipientName}! ${senderName} te está regalando una Gift Card de Bs. ${amount.toFixed(2)} por ${selectedEvent || 'una ocasión especial'} ${occasionEmoji}\n\nMírala aquí: ${finalCardImageUrl}\n\n¡Disfrútalo!`;
          
          const waUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
          
          // Usar un elemento a para mejor compatibilidad con bloqueadores de popups
          const link = document.createElement('a');
          link.href = waUrl;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Redirigir a la sección de enviados después de un breve tiempo
        // para dar tiempo a que se abra la pestaña de WhatsApp
        setTimeout(() => {
          router.push('/gift-cards?tab=sent');
        }, 800);
      } else {
        toast.error('Error al procesar la compra', { id: 'purchase' });
      }
    } catch (error) {
      toast.error('Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToWallet = async () => {
    setLoading(true);
    try {
      const result = await purchaseGiftCard({
        amount,
        recipientName: 'Mi Inventario',
        recipientEmail: 'me@sige.com', // Placeholder for "myself"
        message,
        templateId,
        occasion: selectedEvent || undefined,
        businessId: selectedProduct?.storeId || 'SIGE-GLOBAL',
        productId: selectedProduct?.id,
        recipientId: 'SELF' // Indicator for the action
      });

      if (result.success) {
        toast.success('¡Guardada en tu billetera!');
        setPurchasedId(result.id);
        setDeliveryMethod('sige'); // Default for self
        setRecipientName('Mi Inventario');
        setStep(6);
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFinalSend = () => {
    if (deliveryMethod === 'whatsapp') {
      const text = `¡Hola ${recipientName}! Te he enviado una Gift Card de SIGE por Bs. ${amount.toFixed(2)}. \n\nCódigo de Canje: ${giftCardCode}\n\nMensaje: "${message || '¡Disfruta tu regalo!'}"\n\nPuedes canjearlo en: ${window.location.origin}/gift-cards/check`;
      const cleanNumber = whatsappNumber.replace(/\D/g, '');
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      toast.success('Abriendo WhatsApp...');
    } else {
      toast.success(`Re-enviando Gift Card a ${recipientEmail}...`);
    }
  };

  const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

  return (
    <div className="w-full pb-20">
      {/* Indicador de Pasos Sticky Full Width */}
      {/* Indicador de Pasos Sticky Full Width */}
      <div className="sticky top-[64px] z-50 bg-[#f2f4ff]/80 dark:bg-[#081623]/80 backdrop-blur-xl py-4 mb-8 border-b border-muted/10 shadow-sm w-full">
        <div className="max-w-4xl mx-auto px-4 md:px-6 flex justify-between items-center">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex items-center ${s < 5 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-700 shadow-md ${
                step >= s ? `${selectedTemplate.className} text-white scale-105` : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 5 && (
                <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-1000 ${
                  step > s ? `${selectedTemplate.className}` : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-start relative">
          {/* Preview Area (Sticky below the steps on mobile) */}
          {/* Preview Area (Sticky below the steps on mobile) */}
          <div className="w-full lg:order-2 sticky top-[130px] lg:top-32 z-40 bg-[#f2f4ff] dark:bg-[#081623] lg:bg-transparent! lg:backdrop-blur-none! py-1 lg:py-0 border-b lg:border-none! shadow-sm lg:shadow-none!">
          <div className="space-y-4">
            <div className="hidden lg:flex items-center justify-between px-2 max-w-[420px] mx-auto">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Vista Previa
              </h3>
              <Badge variant="outline" className="bg-transparent border-blue-200/50 text-blue-700 dark:text-blue-300">
                Premium
              </Badge>
            </div>

            <div 
              ref={cardRef}
              className={`aspect-[1.9/1] lg:aspect-[1.8/1] w-full max-w-[420px] mx-auto rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white shadow-2xl relative overflow-hidden transition-all duration-700 ring-1 ring-white/20 card-shine ${selectedTemplate.className}`}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-10">
                <Gift size={140} />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 lg:space-y-4 flex-1">
                    <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg lg:rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/40">
                      {getOccasionIcon(selectedEvent)}
                    </div>
                    
                    <div className="space-y-0.5 lg:space-y-1">
                      <p className="text-[8px] lg:text-[9px] opacity-70 uppercase tracking-widest font-black">Beneficiario</p>
                      <p className="text-sm lg:text-lg font-bold truncate leading-none">{recipientName || '________'}</p>
                    </div>


                  </div>

                  <div className="text-right">
                    <p className="text-[8px] lg:text-[10px] font-black tracking-widest opacity-90 uppercase">SIGE DIGITAL</p>
                    <p className="text-[6px] lg:text-[7px] font-bold opacity-60 tracking-wider">{selectedTemplate.name}</p>
                  </div>
                </div>

                {/* Código de Canje Centrado Superior */}
                {giftCardCode && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                    <p className="text-[6px] lg:text-[7px] opacity-60 uppercase tracking-[0.2em] font-bold mb-0.5">Código de Canje</p>
                    <p className="text-[9px] lg:text-[11px] font-mono font-black tracking-widest bg-white/15 px-3 py-0.5 lg:py-1 rounded-full backdrop-blur-md border border-white/20 shadow-lg ring-1 ring-white/10">
                      {giftCardCode}
                    </p>
                  </div>
                )}

                {/* Mensaje centrado */}
                {message && (
                  <div className="bg-black/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 w-full my-2">
                    <p className="text-[10px] lg:text-xs italic opacity-90 leading-none text-center whitespace-nowrap overflow-hidden">
                      "{message.slice(0, MAX_CHARS)}"
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-end border-t border-white/10 pt-2 lg:pt-3 mt-auto">
                  <div className="space-y-0.5">
                    <p className="text-[8px] lg:text-[9px] opacity-80 uppercase tracking-widest font-black">Saldo de Regalo</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs lg:text-sm font-bold opacity-90">Bs.</span>
                      <span className="text-2xl lg:text-4xl font-black tracking-tighter">{amount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="h-8 w-8 lg:h-10 lg:w-10 bg-white/90 rounded-lg p-0.5 shadow-xl">
                    <div className="w-full h-full bg-slate-50 rounded flex items-center justify-center border border-slate-200">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="w-0.5 h-0.5 lg:w-1 lg:h-1 bg-slate-900 rounded-full opacity-80" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-1 gap-3 p-2">
              <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                <Check className="h-3 w-3 text-green-500" />
                Entrega instantánea por email y app.
              </p>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="w-full lg:order-1 space-y-6">
          {/* NUEVO PASO 1: PERSONALIZACIÓN */}
          {step === 1 && (
            <Card className="border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className={`px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white ${selectedTemplate.className}`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Personaliza tu Regalo
                </CardTitle>
                <CardDescription className="text-white/80">
                  Elige una ocasión, escribe un mensaje y selecciona un diseño.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-4 md:px-6 pt-6">
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-end">
                    <Label>¿Cuál es la ocasión? (Opcional)</Label>
                    <span className="text-[10px] text-muted-foreground">Desliza para explorar</span>
                  </div>
                  
                  <div className="relative group">
                    <Button 
                      type="button"
                      variant="secondary" 
                      size="icon" 
                      className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex border border-muted"
                      onClick={() => scroll(occasionsRef, 'left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div 
                      ref={occasionsRef}
                      className="flex overflow-x-auto gap-3 pb-2 -mx-1 px-1 scrollbar-hide snap-x scroll-smooth"
                    >
                      {Object.keys(EVENT_MESSAGES).map((event) => (
                        <Button 
                          key={event}
                          type="button"
                          variant={selectedEvent === event ? 'default' : 'outline'} 
                          className={`flex flex-col h-auto py-3 px-6 gap-1 shrink-0 snap-start min-w-[100px] ${selectedEvent === event ? 'bg-blue-600' : ''}`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          {event === 'cumpleaños' && <Cake className="h-5 w-5" />}
                          {event === 'boda' && <Heart className="h-5 w-5" />}
                          {event === 'graduación' && <GraduationCap className="h-5 w-5" />}
                          {event === 'aniversario' && <CalendarDays className="h-5 w-5" />}
                          {event === 'nacimiento' && <Baby className="h-5 w-5" />}
                          {event === 'agradecimiento' && <Handshake className="h-5 w-5" />}
                          {event === 'navidad' && <TreePine className="h-5 w-5" />}
                          {event === 'san valentín' && <Sparkles className="h-5 w-5" />}
                          {event === 'hogar' && <Home className="h-5 w-5" />}
                          {event === 'otros' && <PartyPopper className="h-5 w-5" />}
                          <span className="text-xs font-bold capitalize">{event}</span>
                        </Button>
                      ))}
                    </div>

                    <Button 
                      type="button"
                      variant="secondary" 
                      size="icon" 
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex border border-muted"
                      onClick={() => scroll(occasionsRef, 'right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedEvent && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mensajes sugeridos para {selectedEvent}</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {EVENT_MESSAGES[selectedEvent].map((msg, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`text-left text-xs p-3 rounded-xl border transition-all ${
                              message === msg 
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                                : 'bg-muted/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-transparent text-muted-foreground hover:text-blue-700 hover:border-blue-200'
                            }`}
                            onClick={() => setMessage(msg)}
                          >
                            "{msg}"
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="msg">Mensaje personal (Opcional)</Label>
                      <span className={`text-[10px] font-bold ${charCount >= MAX_CHARS ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {MAX_CHARS - charCount} caracteres restantes
                      </span>
                    </div>
                    <Textarea
                      id="msg"
                      placeholder="Escribe algo bonito aquí..."
                      rows={3}
                      value={message}
                      maxLength={MAX_CHARS}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      className={charCount >= MAX_CHARS ? 'border-red-200 focus-visible:ring-red-500' : ''}
                    />
                  </div>
                </div>

                <Button 
                  className={`w-full h-12 text-lg rounded-xl transition-all duration-300 hover:brightness-110 border-none shadow-lg text-white ${selectedTemplate.className}`} 
                  onClick={nextStep}
                >
                  Elegir Diseño
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* PASO 2: DISEÑO */}
          {step === 2 && (
            <Card className="border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className={`px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white ${selectedTemplate.className}`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Elige un Diseño
                </CardTitle>
                <CardDescription className="text-white/80">
                  Selecciona el estilo visual que más te guste.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-4 md:px-6 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <Label>Estilos exclusivos</Label>
                    <span className="text-[10px] text-muted-foreground">Desliza para explorar</span>
                  </div>

                  <div className="relative group">
                    <Button 
                      type="button"
                      variant="secondary" 
                      size="icon" 
                      className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex border border-muted"
                      onClick={() => scroll(designsRef, 'left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div 
                      ref={designsRef}
                      className="flex overflow-x-auto gap-4 pb-4 -mx-1 px-1 scrollbar-hide snap-x scroll-smooth"
                    >
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          className={`h-24 min-w-[160px] rounded-2xl transition-all shrink-0 snap-start relative overflow-hidden flex flex-col items-center justify-center border-2 ${
                            templateId === tpl.id ? 'border-blue-500 scale-105 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                          } ${tpl.className}`}
                          onClick={() => setTemplateId(tpl.id)}
                        >
                          <span className="text-[10px] text-white font-black uppercase tracking-widest px-2 text-center bg-black/20 backdrop-blur-sm py-1 rounded-lg">
                            {tpl.name}
                          </span>
                          {templateId === tpl.id && (
                            <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5 shadow-md">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <Button 
                      type="button"
                      variant="secondary" 
                      size="icon" 
                      className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex border border-muted"
                      onClick={() => scroll(designsRef, 'right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Atrás
                  </Button>
                  <Button 
                    className={`flex-2 h-12 text-lg rounded-xl transition-all duration-300 hover:brightness-110 border-none shadow-lg text-white ${selectedTemplate.className}`} 
                    onClick={nextStep}
                  >
                    Siguiente: Monto
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO 3: MONTO */}
          {step === 3 && (
            <Card className="border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className={`px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white ${selectedTemplate.className}`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Monto del Regalo
                </CardTitle>
                <CardDescription className="text-white/80">
                  Elige el valor que tendrá tu tarjeta.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6 pt-6">
                <div className="space-y-4">
                  <Label className="text-base font-bold">Elige un monto</Label>
                  <div className="relative group">
                    <div className="flex overflow-x-auto gap-3 pb-4 -mx-1 px-1 scrollbar-hide snap-x scroll-smooth">
                      {PREDEFINED_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={amount === amt ? 'default' : 'outline'}
                          className={`h-14 min-w-[100px] text-lg font-bold rounded-2xl shrink-0 snap-start transition-all duration-300 ${
                            amount === amt 
                              ? `${selectedTemplate.className} text-white shadow-lg border-none scale-105 ring-2 ring-white/20` 
                              : 'bg-muted/30 hover:bg-muted/50 border-muted'
                          }`}
                          onClick={() => {
                            setAmount(amt);
                            setCustomAmount('');
                          }}
                        >
                          Bs. {amt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="relative pt-2">
                    <Input
                      placeholder="Monto personalizado..."
                      type="number"
                      className="h-14 text-center text-base md:text-xl font-black rounded-2xl border-2 focus:border-blue-500 bg-background"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(Number(e.target.value));
                      }}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">Bs.</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Atrás
                  </Button>
                  <Button 
                    className={`flex-2 h-12 text-lg rounded-xl shadow-lg transition-all duration-300 hover:brightness-110 border-none text-white ${selectedTemplate.className}`} 
                    onClick={nextStep}
                    disabled={!amount}
                  >
                    Siguiente: Pago
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO 4: PAGO */}
          {step === 4 && (
            <Card className="border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className={`px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white ${selectedTemplate.className}`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Realiza tu Pago
                </CardTitle>
                <CardDescription className="text-white/80">
                  Transfiere y sube tu comprobante para activar la tarjeta.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6 pt-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center block">Selecciona Método de Pago</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button 
                        type="button"
                        variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                        className={`h-16 flex flex-col gap-1 rounded-2xl transition-all ${paymentMethod === 'qr' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-blue-500/20' : ''}`}
                        onClick={() => setPaymentMethod('qr')}
                      >
                        <Search className="h-5 w-5" />
                        <span className="text-[10px] font-bold">QR Simple</span>
                      </Button>
                      <Button 
                        type="button"
                        variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                        className={`h-16 flex flex-col gap-1 rounded-2xl transition-all ${paymentMethod === 'transfer' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-blue-500/20' : ''}`}
                        onClick={() => setPaymentMethod('transfer')}
                      >
                        <Wallet className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Transf.</span>
                      </Button>
                      <Button 
                        type="button"
                        variant={paymentMethod === 'tigo' ? 'default' : 'outline'}
                        className={`h-16 flex flex-col gap-1 rounded-2xl transition-all ${paymentMethod === 'tigo' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-4 ring-blue-500/20' : ''}`}
                        onClick={() => setPaymentMethod('tigo')}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Tigo Money</span>
                      </Button>
                    </div>

                  {paymentMethod === 'qr' && (
                    <div className="text-center space-y-3 animate-in zoom-in duration-300">
                      <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center">
                        <img 
                          src={`/payment_qr_placeholder_1778424633832.png`} 
                          alt="QR de Pago" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">Escanea para pagar Bs. {amount.toFixed(2)}</p>
                    </div>
                  )}

                  {paymentMethod === 'transfer' && (
                    <div className="bg-card p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                      <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Datos de Transferencia</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Banco</span>
                          <span className="text-xs font-black uppercase">Banco Unión</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cuenta</span>
                          <span className="text-xs font-black uppercase">123456789</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Titular</span>
                          <span className="text-xs font-black uppercase">SIGE DIGITAL S.R.L.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">NIT/CI</span>
                          <span className="text-xs font-black uppercase">987654321</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'tigo' && (
                    <div className="bg-blue-600 dark:bg-blue-700 p-5 rounded-2xl text-white space-y-3 animate-in slide-in-from-bottom-2 duration-300 shadow-lg shadow-blue-500/20">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <MessageCircle className="h-6 w-6" />
                         </div>
                         <div>
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-80 leading-none mb-1">Tigo Money</h4>
                            <p className="text-sm font-bold">Transferencia Directa</p>
                         </div>
                      </div>
                      <div className="pt-2 bg-black/10 p-4 rounded-xl">
                        <p className="text-[10px] opacity-80 uppercase font-black tracking-widest mb-1">Número de destino</p>
                        <p className="text-3xl font-black tabular-nums tracking-tight">76543210</p>
                        <p className="text-[9px] opacity-70 mt-2 font-medium">Asegúrate de transferir el monto exacto: Bs. {amount.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      Sube tu comprobante
                    </Label>
                    <div 
                      className={`relative h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
                        receiptFile ? 'border-green-500 bg-green-50/10 dark:bg-green-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                      }`}
                      onClick={() => document.getElementById('receipt-upload')?.click()}
                    >
                      {receiptPreview ? (
                        <div className="flex items-center gap-3 p-2 w-full">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border shrink-0">
                            <img src={receiptPreview} alt="Comprobante" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{receiptFile?.name}</p>
                            <p className="text-[10px] text-green-600 flex items-center gap-1 font-bold">
                              <Check className="h-3 w-3" /> LISTO
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Plus className="h-6 w-6 text-slate-400 mb-1" />
                          <p className="text-xs font-medium text-slate-500">Click para subir foto o PDF</p>
                        </>
                      )}
                      <input 
                        id="receipt-upload"
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Atrás
                  </Button>
                  <Button 
                    className={`flex-2 h-12 text-lg rounded-xl shadow-lg transition-all duration-300 hover:brightness-110 border-none text-white ${selectedTemplate.className}`} 
                    onClick={nextStep}
                    disabled={!amount || !receiptFile || !paymentMethod}
                  >
                    Siguiente: Envío
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO 5: DESTINATARIO Y ENVÍO */}
          {step === 5 && (
            <Card className="border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className={`px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white ${selectedTemplate.className}`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Destinatario y Envío
                </CardTitle>
                <CardDescription className="text-white/80">
                  Configura los detalles de entrega de tu regalo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recNameFinal">Nombre del destinatario</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="recNameFinal"
                        placeholder="Nombre completo..."
                        className="pl-10 h-12 rounded-xl"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>¿Cómo quieres enviarlo?</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={deliveryMethod === 'whatsapp' ? 'default' : 'outline'}
                        className={`h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        onClick={() => setDeliveryMethod('whatsapp')}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                      </Button>
                      <Button
                        type="button"
                        variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                        className={`h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'email' ? 'bg-[#EA4335] hover:bg-[#D93025]' : ''}`}
                        onClick={() => setDeliveryMethod('email')}
                      >
                        <Mail className="h-4 w-4" />
                        <span className="text-[10px] font-bold">Por Email</span>
                      </Button>
                      <Button
                        type="button"
                        variant={deliveryMethod === 'sige' ? 'default' : 'outline'}
                        className={`h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        onClick={() => setDeliveryMethod('sige')}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-[10px] font-bold">Usuario SIGE</span>
                      </Button>
                    </div>
                  </div>

                  {deliveryMethod === 'email' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="recEmailFinal">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="recEmailFinal"
                          type="email"
                          placeholder="correo@ejemplo.com"
                          className="pl-10 h-12 rounded-xl"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {deliveryMethod === 'whatsapp' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="recWa">Número de WhatsApp</Label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="recWa"
                          type="tel"
                          placeholder="+591 7XXXXXXX"
                          className="pl-10 h-12 rounded-xl"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {deliveryMethod === 'sige' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="sigeUser">Seleccionar Usuario SIGE</Label>
                      <select
                        id="sigeUser"
                        className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={recipientId}
                        onChange={(e) => {
                          const uid = e.target.value;
                          setRecipientId(uid);
                          const user = sigeUsers.find(u => u.id === uid);
                          if (user) {
                            setRecipientName(user.name);
                            setRecipientEmail(user.email);
                          }
                        }}
                      >
                        <option value="">Selecciona un usuario...</option>
                        {sigeUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      className={`h-14 text-lg font-bold gap-2 rounded-2xl shadow-lg transition-all ${
                        deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 
                        deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 
                        'bg-[#EA4335] hover:bg-[#D93025] shadow-red-500/20'
                      }`}
                      onClick={handlePurchase}
                      disabled={
                        loading || 
                        !recipientName || 
                        (deliveryMethod === 'email' && !recipientEmail) || 
                        (deliveryMethod === 'whatsapp' && !whatsappNumber) ||
                        (deliveryMethod === 'sige' && !recipientId)
                      }
                    >
                      {loading ? (
                        'Procesando...'
                      ) : (
                        <>
                          <Check className="h-5 w-5" />
                          Finalizar y Enviar
                        </>
                      )}
                    </Button>

                    <Button 
                      type="button"
                      variant="secondary"
                      className="h-12 rounded-2xl font-bold gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border-none"
                      onClick={handleSaveToWallet}
                      disabled={loading}
                    >
                      <Wallet className="h-4 w-4" />
                      Solo guardar en mi Billetera
                    </Button>
                  </div>
                  
                  <Button variant="ghost" className="w-full h-10 rounded-xl text-muted-foreground" onClick={prevStep} disabled={loading}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Regresar al pago
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PASO FINAL: ÉXITO */}
          {step === 6 && (
            <Card className={`border-2 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 ${
              deliveryMethod === 'whatsapp' ? 'border-green-500/20' : 
              deliveryMethod === 'sige' ? 'border-purple-500/20' : 'border-red-500/20'
            }`}>
              <div className={`${
                deliveryMethod === 'whatsapp' ? 'bg-green-600' : 
                deliveryMethod === 'sige' ? 'bg-purple-600' : 'bg-[#EA4335]'
              } p-8 text-white text-center transition-colors duration-500`}>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/40">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-1">¡Compra Exitosa!</h2>
                <p className="opacity-90 text-sm">Tu Gift Card ya está lista para ser enviada por {
                  deliveryMethod === 'whatsapp' ? 'WhatsApp' : 
                  deliveryMethod === 'sige' ? 'SIGE' : 'Email'
                }.</p>
              </div>
              
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="bg-muted/30 p-4 rounded-2xl border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Código de tu tarjeta</p>
                    <p className="text-xl font-mono font-black tracking-widest">{giftCardCode}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activada</Badge>
                </div>

                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground font-medium">¿Qué quieres hacer ahora?</p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      className={`h-14 text-lg font-bold gap-2 shadow-lg transition-all ${
                        deliveryMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 
                        deliveryMethod === 'sige' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 
                        'bg-[#EA4335] hover:bg-[#D93025] shadow-red-500/20'
                      }`}
                      onClick={handleFinalSend}
                    >
                      {deliveryMethod === 'whatsapp' && <MessageCircle className="h-5 w-5" />}
                      {deliveryMethod === 'email' && <Mail className="h-5 w-5" />}
                      {deliveryMethod === 'sige' && <User className="h-5 w-5" />}
                      {deliveryMethod === 'email' ? 'Enviar por Email' : 
                       deliveryMethod === 'whatsapp' ? 'Enviar por WhatsApp' : 'Enviar a Usuario SIGE'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-14 text-lg font-bold gap-2 border-2"
                      onClick={async () => {
                        if (purchasedId) {
                          await saveGiftCardToWallet(purchasedId);
                          toast.success('Guardado en tu billetera');
                          router.push('/gift-cards');
                        }
                      }}
                    >
                      <Wallet className="h-5 w-5" />
                      Guardar en mi Billetera
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      className={`w-full h-12 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${isScheduled ? 'bg-blue-50' : ''}`}
                      onClick={() => setIsScheduled(!isScheduled)}
                    >
                      <Clock className="h-5 w-5" />
                      {isScheduled ? 'Cancelar programación' : 'Programar envío para después'}
                    </Button>

                    {isScheduled && (
                      <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="schedDate">Fecha y Hora de envío</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="schedDate"
                            type="datetime-local" 
                            className="h-12"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                          />
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={!scheduledDate}
                            onClick={() => {
                              toast.success(`Envío programado para el ${new Date(scheduledDate).toLocaleString()}`);
                              router.push('/gift-cards');
                            }}
                          >
                            Programar
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">La tarjeta se enviará automáticamente al destinatario en la fecha seleccionada.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
