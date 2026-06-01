'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Gift, Search, User, Mail, MessageCircle, Check, CreditCard, ChevronRight, ChevronLeft, Cake, Heart, GraduationCap, CalendarDays, Baby, Handshake, TreePine, Sparkles, Home, PartyPopper, Send, Wallet, Calendar } from 'lucide-react';
import { purchaseGiftCard, searchGiftingProducts, getSIGEUsers, uploadGiftCardImage } from '@/app/actions/gift-cards';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useDebounce } from 'use-debounce';
import { GIFT_CARD_TEMPLATES, getGiftCardTemplate } from './gift-card-templates';

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

const PREDEFINED_AMOUNTS = [10, 20, 50, 100, 150, 200, 300, 500, 1000, 3000, 5000, 10000];
const MAX_GIFT_CARD_AMOUNT = 10000;
const MAX_CHARS = 60;

export function GiftCardBuyForm({ availableBalance }: { availableBalance: number }) {
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
  
  // Delivery option: 'send' (Enviar ahora), 'save' (Guardar para después), 'schedule' (Programar envío)
  const [deliveryOption, setDeliveryOption] = useState<'send' | 'save' | 'schedule'>('send');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // El codigo real se genera en servidor al crear la Gift Card.
  useEffect(() => {
    if (step === 3 && !giftCardCode) {
      setGiftCardCode('XXXX-XXXX-XXXX');
    }
    
    if (step === 4 && sigeUsers.length === 0) {
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

  const remainingBalance = Number((availableBalance - amount).toFixed(2));
  const amountError = amount > MAX_GIFT_CARD_AMOUNT
    ? `El monto maximo por Gift Card es Bs. ${MAX_GIFT_CARD_AMOUNT.toLocaleString('es-BO')}`
    : amount > availableBalance
      ? 'No tienes saldo global suficiente para este monto'
      : '';
  const canContinueFromAmount = amount > 0 && !amountError;

  const generateFinalCardImage = async () => {
    if (!cardRef.current) return undefined;

    toast.loading('Generando diseÃ±o final...', { id: 'card-image' });
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
        toast.success('DiseÃ±o generado', { id: 'card-image' });
        return imgResult.url;
      }
      toast.error('Error al subir diseÃ±o', { id: 'card-image' });
    } catch (e) {
      console.error("Error generating card image", e);
      toast.error('Error generando vista previa', { id: 'card-image' });
    }

    return undefined;
  };

  const handlePurchaseFlow = async () => {
    if (!canContinueFromAmount) {
      toast.error(amountError || 'Por favor ingresa un monto válido');
      return;
    }
    if (!recipientName) {
      toast.error('Por favor escribe el nombre del destinatario');
      return;
    }

    if (deliveryOption === 'send') {
      if (deliveryMethod === 'email' && !recipientEmail) {
        toast.error('Por favor ingresa el correo del destinatario');
        return;
      }
      if (deliveryMethod === 'whatsapp' && !whatsappNumber) {
        toast.error('Por favor ingresa el número de WhatsApp');
        return;
      }
      if (deliveryMethod === 'sige' && !recipientId) {
        toast.error('Por favor selecciona un usuario SIGE');
        return;
      }
    } else if (deliveryOption === 'schedule') {
      if (!scheduleDate || !scheduleTime) {
        toast.error('Por favor selecciona la fecha y hora programada');
        return;
      }
      const combined = new Date(`${scheduleDate}T${scheduleTime}`);
      if (combined <= new Date()) {
        toast.error('La fecha y hora programada debe ser en el futuro');
        return;
      }
    }

    setLoading(true);
    try {
      const finalCardImageUrl = await generateFinalCardImage();
      toast.loading(
        deliveryOption === 'send' ? 'Procesando Gift Card...' : 
        deliveryOption === 'schedule' ? 'Programando Gift Card...' : 'Guardando Gift Card...',
        { id: 'purchase' }
      );

      const isSave = deliveryOption === 'save' || deliveryOption === 'schedule';
      const scheduledAt = deliveryOption === 'schedule' ? new Date(`${scheduleDate}T${scheduleTime}`) : undefined;

      const result = await purchaseGiftCard({
        amount,
        recipientEmail: deliveryMethod === 'sige' ? (sigeUsers.find(u => u.id === recipientId)?.email || '') : recipientEmail,
        recipientPhone: (isSave && deliveryOption === 'save') ? undefined : (deliveryMethod === 'whatsapp' ? whatsappNumber : undefined),
        recipientName: deliveryMethod === 'sige' ? (sigeUsers.find(u => u.id === recipientId)?.name || recipientName) : recipientName,
        message,
        templateId,
        occasion: selectedEvent || undefined,
        businessId: selectedProduct?.storeId || 'SIGE-GLOBAL',
        productId: selectedProduct?.id,
        recipientId: isSave ? undefined : (deliveryMethod === 'sige' ? recipientId : undefined),
        cardImageUrl: finalCardImageUrl,
        saveToWallet: isSave,
        scheduledAt,
      });

      if (result.success) {
        toast.success(
          deliveryOption === 'send' ? 'Gift Card enviada' : 
          deliveryOption === 'schedule' ? 'Gift Card programada' : 'Gift Card guardada',
          { id: 'purchase' }
        );

        if (deliveryOption === 'send' && deliveryMethod === 'whatsapp' && finalCardImageUrl) {
          const senderName = session?.user?.name || 'Un amigo/a';
          const text = 'Hola ' + recipientName + ', ' + senderName + ' te esta regalando una Gift Card de SIGE por Bs. ' + amount.toFixed(2) + '. Mirala aqui: ' + finalCardImageUrl;
          const waUrl = 'https://wa.me/' + whatsappNumber.replace(/\D/g, '') + '?text=' + encodeURIComponent(text);
          const link = document.createElement('a');
          link.href = waUrl;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        if (isSave) {
          router.push('/gift-cards?tab=saved');
        } else {
          router.push('/gift-cards?tab=sent');
        }
      } else {
        toast.error(result.error || 'Error al procesar la Gift Card', { id: 'purchase' });
      }
    } catch (error) {
      toast.error('Algo salio mal', { id: 'purchase' });
    } finally {
      setLoading(false);
    }
  };
  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const selectedTemplate = getGiftCardTemplate(templateId);

  return (
    <div className="gift-card-buy-section w-full pb-20">
      {/* Indicador de Pasos Sticky Full Width */}
      {/* Indicador de Pasos Sticky Full Width */}
          <div className="gift-card-steps sticky top-16 z-50 bg-[#f2f4ff]/80 dark:bg-[#081623]/80 backdrop-blur-xl py-4 mb-8 border-b border-muted/10 shadow-sm w-full">
        <div className="max-w-4xl mx-auto px-4 md:px-6 flex justify-between items-center">
              {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex items-center ${s < 4 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all duration-700 shadow-md ${
                step >= s ? 'gift-card-step-active text-white scale-105 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-1000 ${
                  step > s ? 'gift-card-step-connector-active bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800' : 'bg-muted'
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
          <div className="gift-card-preview-shell w-full lg:order-2 sticky top-32.5 lg:top-32 z-40 bg-[#f2f4ff] dark:bg-[#081623] lg:bg-transparent! lg:backdrop-blur-none! py-1 lg:py-0 border-b lg:border-none! shadow-sm lg:shadow-none!">
          <div className="space-y-4">
            <div className="hidden lg:flex items-center justify-between px-2 max-w-105 mx-auto">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Vista Previa
              </h3>
              <Badge variant="outline" className="gift-card-themed-badge bg-transparent border-blue-200/50 text-blue-700 dark:text-blue-300">
                Premium
              </Badge>
            </div>

            <div 
              ref={cardRef}
              className={`aspect-[1.9/1] lg:aspect-[1.8/1] w-full max-w-105 mx-auto rounded-2xl lg:rounded-3xl p-4 lg:p-5 text-white shadow-2xl relative overflow-hidden transition-all duration-700 ring-1 ring-white/20 card-shine ${selectedTemplate.className}`}
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
            <Card className="gift-card-form-card border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className="gift-card-form-header px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800">
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
                          className={`gift-card-selectable flex flex-col h-auto py-3 px-6 gap-1 shrink-0 snap-start min-w-25 ${selectedEvent === event ? 'gift-card-option-selected bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md border-transparent' : ''}`}
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
                                ? 'gift-card-option-selected text-white shadow-md bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 border-transparent' 
                                : 'gift-card-suggestion bg-muted/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-transparent text-muted-foreground hover:text-blue-700 hover:border-blue-200'
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
                  className="gift-card-primary-action w-full h-12 text-lg rounded-xl transition-all duration-300 hover:brightness-110 border-none shadow-lg text-white" 
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
            <Card className="gift-card-form-card border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className="gift-card-form-header px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800">
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
                      {GIFT_CARD_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          className={`h-24 min-w-40 rounded-2xl transition-all shrink-0 snap-start relative overflow-hidden flex flex-col items-center justify-center ${
                            templateId === tpl.id ? 'scale-105 shadow-xl' : 'opacity-80 hover:opacity-100'
                          } ${tpl.className}`}
                          onClick={() => setTemplateId(tpl.id)}
                        >
                          <span className="text-[10px] text-white font-black uppercase tracking-widest px-2 text-center bg-black/20 backdrop-blur-sm py-1 rounded-lg">
                            {tpl.name}
                          </span>
                          {templateId === tpl.id && (
                            <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-2xl border-4" style={{ borderColor: 'var(--primary)' }}>
                              <Check className="h-5 w-5" style={{ color: 'var(--primary)' }} />
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
                    className="gift-card-primary-action flex-2 h-12 text-lg rounded-xl transition-all duration-300 hover:brightness-110 border-none shadow-lg text-white" 
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
            <Card className="gift-card-form-card border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className="gift-card-form-header px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800">
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
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-base font-bold">Elige un monto</Label>
                    <div className="text-right">
                      <span className="text-xs font-bold text-muted-foreground">
                        Saldo global: Bs. {availableBalance.toFixed(2)}
                      </span>
                      {amount > 0 && (
                        <div className="text-xs font-bold text-green-600 dark:text-green-400">
                          Restante: Bs. {remainingBalance.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="flex overflow-x-auto gap-3 pb-4 -mx-1 px-1 scrollbar-hide snap-x scroll-smooth">
                      {PREDEFINED_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={amount === amt ? 'default' : 'outline'}
                          className={`h-14 min-w-25 text-lg font-bold rounded-2xl shrink-0 snap-start transition-all duration-300 ${
                            amount === amt 
                              ? 'gift-card-option-selected text-white shadow-lg border-none scale-105 ring-2 ring-white/20 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800' 
                              : amt > availableBalance ? 'bg-muted/20 border-muted opacity-45' : 'bg-muted/30 hover:bg-muted/50 border-muted'
                          }`}
                          disabled={amt > availableBalance}
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
                      className="gift-card-themed-input h-14 text-center text-base md:text-xl font-black rounded-2xl border-2 focus:border-blue-500 bg-background"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(Number(e.target.value));
                      }}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">Bs.</span>
                  </div>
                  {amountError && (
                    <p className="text-xs font-bold text-red-500">{amountError}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Atrás
                  </Button>
                  <Button 
                    className="gift-card-primary-action flex-2 h-12 text-lg rounded-xl shadow-lg transition-all duration-300 hover:brightness-110 border-none text-white" 
                    onClick={nextStep}
                    disabled={!canContinueFromAmount}
                  >
                    Siguiente: Envio
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="gift-card-form-card border-2 border-blue-500/10 shadow-xl overflow-hidden pt-0">
              <CardHeader className="gift-card-form-header px-4 md:px-6 pt-7 pb-5 transition-all duration-700 text-white bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Destinatario y Envío
                </CardTitle>
                <CardDescription className="text-white/80">
                  Elige cómo quieres procesar tu regalo digital.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-6 pt-6">
                
                {/* ── SELECCIÓN DE ACCIÓN CON EL REGALO ── */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground">¿Qué deseas hacer con tu regalo?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={deliveryOption === 'send' ? 'default' : 'outline'}
                      className={`h-16 flex flex-col gap-1 rounded-xl px-1 border transition-all ${
                        deliveryOption === 'send' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20' 
                          : 'border-muted hover:bg-muted/50'
                      }`}
                      onClick={() => setDeliveryOption('send')}
                    >
                      <Send className="h-4 w-4" />
                      <span className="text-[10px] font-bold">Enviar ahora</span>
                    </Button>

                    <Button
                      type="button"
                      variant={deliveryOption === 'save' ? 'default' : 'outline'}
                      className={`h-16 flex flex-col gap-1 rounded-xl px-1 border transition-all ${
                        deliveryOption === 'save' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20' 
                          : 'border-muted hover:bg-muted/50'
                      }`}
                      onClick={() => setDeliveryOption('save')}
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="text-[10px] font-bold">Guardar</span>
                    </Button>

                    <Button
                      type="button"
                      variant={deliveryOption === 'schedule' ? 'default' : 'outline'}
                      className={`h-16 flex flex-col gap-1 rounded-xl px-1 border transition-all ${
                        deliveryOption === 'schedule' 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20' 
                          : 'border-muted hover:bg-muted/50'
                      }`}
                      onClick={() => setDeliveryOption('schedule')}
                    >
                      <Calendar className="h-4 w-4" />
                      <span className="text-[10px] font-bold">Programar</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Nombre del destinatario */}
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

                  {/* Programar envío (Date y Time) */}
                  {deliveryOption === 'schedule' && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        <Label htmlFor="schedDate" className="text-xs font-bold">Fecha de envío</Label>
                        <Input
                          id="schedDate"
                          type="date"
                          className="h-10 rounded-xl bg-background"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="schedTime" className="text-xs font-bold">Hora de envío</Label>
                        <Input
                          id="schedTime"
                          type="time"
                          className="h-10 rounded-xl bg-background"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Métodos de envío (si es Enviar o Programar) */}
                  {(deliveryOption === 'send' || deliveryOption === 'schedule') && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-3">
                        <Label>¿Cómo quieres enviarlo?</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={deliveryMethod === 'whatsapp' ? 'default' : 'outline'}
                            className={`gift-card-selectable h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'whatsapp' ? 'gift-card-option-selected bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md border-transparent' : ''}`}
                            onClick={() => setDeliveryMethod('whatsapp')}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-[10px] font-bold">WhatsApp</span>
                          </Button>
                          <Button
                            type="button"
                            variant={deliveryMethod === 'email' ? 'default' : 'outline'}
                            className={`gift-card-selectable h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'email' ? 'gift-card-option-selected bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md border-transparent' : ''}`}
                            onClick={() => setDeliveryMethod('email')}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="text-[10px] font-bold">Por Email</span>
                          </Button>
                          <Button
                            type="button"
                            variant={deliveryMethod === 'sige' ? 'default' : 'outline'}
                            className={`gift-card-selectable h-14 flex flex-col gap-1 rounded-xl px-1 ${deliveryMethod === 'sige' ? 'gift-card-option-selected bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md border-transparent' : ''}`}
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
                  )}
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      className="gift-card-primary-action h-14 text-lg font-bold gap-2 rounded-2xl shadow-lg transition-all"
                      onClick={handlePurchaseFlow}
                      disabled={
                        loading || 
                        !recipientName || 
                        (deliveryOption === 'send' && deliveryMethod === 'email' && !recipientEmail) || 
                        (deliveryOption === 'send' && deliveryMethod === 'whatsapp' && !whatsappNumber) ||
                        (deliveryOption === 'send' && deliveryMethod === 'sige' && !recipientId) ||
                        (deliveryOption === 'schedule' && (!scheduleDate || !scheduleTime))
                      }
                    >
                      {loading ? (
                        'Procesando...'
                      ) : deliveryOption === 'send' ? (
                        <>
                          <Check className="h-5 w-5" />
                          Finalizar y Enviar
                        </>
                      ) : (
                        <>
                          <Wallet className="h-5 w-5" />
                          Finalizar y Guardar
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Button variant="ghost" className="w-full h-10 rounded-xl text-muted-foreground" onClick={prevStep} disabled={loading}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Regresar al monto
                  </Button>
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
