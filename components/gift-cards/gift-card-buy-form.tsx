'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Search, User, Mail, MessageCircle, Check, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';
import { purchaseGiftCard, searchGiftingProducts } from '@/app/actions/gift-cards';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';

const TEMPLATES = [
  { id: 1, name: 'Clásico Azul', className: 'bg-linear-to-r from-blue-600 to-blue-700' },
  { id: 2, name: 'Elegante Negro', className: 'bg-linear-to-r from-gray-800 to-black' },
  { id: 3, name: 'Fiesta Dorado', className: 'bg-linear-to-r from-yellow-500 to-orange-600' },
  { id: 4, name: 'Amor Rosa', className: 'bg-linear-to-r from-pink-500 to-rose-600' },
];

const PREDEFINED_AMOUNTS = [50, 100, 200, 500];

export function GiftCardBuyForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [templateId, setTemplateId] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handlePurchase = async () => {
    if (!recipientEmail || !recipientName) {
      toast.error('Por favor completa los datos del destinatario');
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseGiftCard({
        amount,
        recipientEmail,
        recipientName,
        message,
        templateId,
        businessId: selectedProduct?.storeId || 'SIGE-GLOBAL',
        productId: selectedProduct?.id
      });

      if (result.success) {
        toast.success('Gift Card comprada exitosamente');
        router.push(`/gift-cards/${result.id}`);
      } else {
        toast.error('Error al procesar la compra');
      }
    } catch (error) {
      toast.error('Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const selectedTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center mb-8 overflow-x-auto pb-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 md:w-24 mx-2 rounded ${
                step > s ? 'bg-blue-600' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <Card className="border-2 border-blue-500/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Gift className="text-blue-600" />
                  ¿Qué quieres regalar?
                </CardTitle>
                <CardDescription>
                  Puedes regalar un monto específico o un producto del mercado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Buscar un producto para regalar (Opcional)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Busca por nombre de producto..."
                      className="pl-10 h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {isSearching && <p className="text-sm text-muted-foreground animate-pulse">Buscando productos...</p>}
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-xl divide-y overflow-hidden bg-card">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                          onClick={() => handleProductSelect(p)}
                        >
                          <div className="w-10 h-10 rounded bg-muted shrink-0 overflow-hidden">
                            {p.imageUrls?.[0] && <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.storeName}</p>
                          </div>
                          <p className="font-bold text-blue-600">Bs. {p.price}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-bold">Producto seleccionado</p>
                          <p className="text-xs text-muted-foreground">{selectedProduct.name}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>Cambiar</Button>
                    </div>
                  )}
                </div>

                {!selectedProduct && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label>O elige un monto</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PREDEFINED_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          variant={amount === amt ? 'default' : 'outline'}
                          className={`h-12 text-lg font-bold ${amount === amt ? 'bg-blue-600' : ''}`}
                          onClick={() => {
                            setAmount(amt);
                            setCustomAmount('');
                          }}
                        >
                          Bs. {amt}
                        </Button>
                      ))}
                    </div>
                    <div className="relative pt-2">
                      <Input
                        placeholder="Otro monto personalizado..."
                        type="number"
                        className="h-12 text-center text-lg font-bold"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setAmount(Number(e.target.value));
                        }}
                      />
                      <span className="absolute left-4 top-[60%] -translate-y-1/2 text-muted-foreground font-bold">Bs.</span>
                    </div>
                  </div>
                )}

                <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700" onClick={nextStep}>
                  Continuar
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-2 border-blue-500/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="text-blue-600" />
                  ¿Para quién es?
                </CardTitle>
                <CardDescription>
                  Ingresa los datos de la persona que recibirá este regalo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recName">Nombre del destinatario</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="recName"
                          placeholder="Ej. Juan Perez"
                          className="pl-10"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recEmail">Email del destinatario</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="recEmail"
                          type="email"
                          placeholder="juan@ejemplo.com"
                          className="pl-10"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="msg">Mensaje personal (Opcional)</Label>
                    <Textarea
                      id="msg"
                      placeholder="Escribe algo bonito aquí..."
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Elige un diseño</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          className={`h-16 rounded-xl transition-all ${tpl.className} ${
                            templateId === tpl.id ? 'ring-4 ring-blue-400 ring-offset-2 scale-105' : 'opacity-80 hover:opacity-100'
                          }`}
                          onClick={() => setTemplateId(tpl.id)}
                        >
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12" onClick={prevStep}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Atrás
                  </Button>
                  <Button className="flex-2 h-12 text-lg bg-blue-600 hover:bg-blue-700" onClick={nextStep}>
                    Revisar Pedido
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-2 border-blue-500/10 shadow-xl overflow-hidden">
              <div className="bg-blue-600 p-8 text-white text-center">
                <p className="text-blue-100 text-sm uppercase tracking-widest font-bold mb-2">Total a Pagar</p>
                <p className="text-5xl font-black">Bs. {amount.toFixed(2)}</p>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg border-b pb-2">Resumen del Regalo</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Destinatario:</span>
                    <span className="font-medium">{recipientName} ({recipientEmail})</span>
                  </div>
                  {selectedProduct && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Producto:</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Válido hasta:</span>
                    <span className="font-medium">{new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    Método de Pago
                  </div>
                  <p className="text-xs text-muted-foreground">Se debitará de tu saldo SIGE o procesador de pagos configurado.</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1 h-12" onClick={prevStep} disabled={loading}>
                    <ChevronLeft className="mr-2 h-5 w-5" />
                    Atrás
                  </Button>
                  <Button 
                    className="flex-2 h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" 
                    onClick={handlePurchase}
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : 'Confirmar y Pagar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Area (Sticky) */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <h3 className="font-bold text-lg px-2 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Vista Previa
            </h3>
            <div className={`aspect-[1.6/1] w-full rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${selectedTemplate.className}`}>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Gift size={120} />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Gift className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold tracking-tighter opacity-80 uppercase">SIGE GIFT CARD</p>
                  </div>
                  <p className="mt-8 text-sm opacity-90 font-medium">Para: {recipientName || '________'}</p>
                  {message && <p className="mt-2 text-xs italic opacity-80 line-clamp-2">"{message}"</p>}
                </div>
                <div>
                  <p className="text-xs opacity-80">Saldo disponible</p>
                  <p className="text-3xl font-black">Bs. {amount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 border border-dashed text-xs text-muted-foreground">
              Esta es una representación visual de cómo se verá la Gift Card en el correo electrónico y la app del destinatario.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
