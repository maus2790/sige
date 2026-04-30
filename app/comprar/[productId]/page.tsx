"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingCart, ShieldCheck, User, Phone, Mail, CreditCard, Wallet, Package } from "lucide-react";
import { getProductById } from "@/app/actions/products";
import { createOrder } from "@/app/actions/orders";

export default function ComprarPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const productId = params.productId as string;

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    buyerCi: "",
    shippingAddress: "",
    paymentMethod: "qr",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=/comprar/${productId}`);
    }
  }, [status, productId, router]);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        buyerName: prev.buyerName || session.user?.name || "",
        buyerEmail: prev.buyerEmail || session.user?.email || "",
        buyerPhone: prev.buyerPhone || (session.user as any).phone || "",
      }));
    }
  }, [session]);

  async function loadProduct() {
    setIsLoading(true);
    const data = await getProductById(productId);
    setProduct(data);
    setIsLoading(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitFormData = new FormData();
    submitFormData.append("productId", productId);
    submitFormData.append("buyerName", formData.buyerName);
    submitFormData.append("buyerPhone", formData.buyerPhone);
    submitFormData.append("buyerEmail", formData.buyerEmail);
    submitFormData.append("buyerCi", formData.buyerCi);
    submitFormData.append("quantity", quantity.toString());
    submitFormData.append("shippingAddress", formData.shippingAddress);
    submitFormData.append("paymentMethod", formData.paymentMethod);

    const result = await createOrder(submitFormData);

    if (result?.error) {
      toast.error(result.error);
      setIsSubmitting(false);
    } else if (result && 'id' in result) {
       toast.success("Pedido creado correctamente");
       router.push(`/checkout/${result.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Producto no encontrado</p>
            <Link href="/">
              <Button className="mt-4 rounded-full">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unitPrice = product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0;
  const maxAllowed = product.comercialConfig?.limiteCompra 
    ? Math.min(product.inventory?.stockActual || 0, product.comercialConfig.limiteCompra)
    : (product.inventory?.stockActual || 0);

  const total = unitPrice * quantity;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navbar simplificada */}
      <div className="sticky top-0 z-30 glass border-b shadow-sm">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href={`/productos/${productId}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Finalizar Compra</h1>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-4xl border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User className="w-5 h-5" />
                 </div>
                 <h2 className="text-2xl font-bold tracking-tight">Datos de Envío</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="buyerName" className="text-sm font-semibold ml-1">Nombre completo *</Label>
                  <div className="relative">
                    <Input
                      id="buyerName"
                      name="buyerName"
                      placeholder="Ej: Juan Pérez"
                      value={formData.buyerName}
                      onChange={handleChange}
                      required
                      className="h-12 rounded-xl pl-11 bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="buyerPhone" className="text-sm font-semibold ml-1">Teléfono / WhatsApp *</Label>
                    <div className="relative">
                      <Input
                        id="buyerPhone"
                        name="buyerPhone"
                        placeholder="71234567"
                        value={formData.buyerPhone}
                        onChange={handleChange}
                        required
                        className="h-12 rounded-xl pl-11 bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerCi" className="text-sm font-semibold ml-1">CI / NIT (Opcional)</Label>
                    <Input
                      id="buyerCi"
                      name="buyerCi"
                      placeholder="1234567 LP"
                      value={formData.buyerCi}
                      onChange={handleChange}
                      className="h-12 rounded-xl bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerEmail" className="text-sm font-semibold ml-1">Correo electrónico (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="buyerEmail"
                      name="buyerEmail"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.buyerEmail}
                      onChange={handleChange}
                      className="h-12 rounded-xl pl-11 bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress" className="text-sm font-semibold ml-1">Dirección exacta de entrega *</Label>
                  <Textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    placeholder="Calle, número de casa, zona y ciudad (Ej: Calle 5, Casa 12, Zona Sur, La Paz)"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="rounded-xl bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 p-4"
                  />
                </div>

                <div className="pt-4">
                  <Label className="text-base font-bold mb-4 block">Método de Pago</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value: string) => setFormData({ ...formData, paymentMethod: value })}
                    className="grid grid-cols-1 gap-3"
                  >
                    <Label
                      htmlFor="qr"
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.paymentMethod === "qr" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="qr" id="qr" className="sr-only" />
                        <div className={`p-2 rounded-full ${formData.paymentMethod === "qr" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                           <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">QR / Transferencia</p>
                          <p className="text-xs text-muted-foreground">Pago rápido y seguro</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "qr" ? "border-primary" : "border-muted-foreground/30"}`}>
                         {formData.paymentMethod === "qr" && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                      </div>
                    </Label>

                    <Label
                      htmlFor="cash"
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.paymentMethod === "cash" ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="cash" id="cash" className="sr-only" />
                        <div className={`p-2 rounded-full ${formData.paymentMethod === "cash" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                           <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">Efectivo</p>
                          <p className="text-xs text-muted-foreground">Paga al recibir el producto</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "cash" ? "border-primary" : "border-muted-foreground/30"}`}>
                         {formData.paymentMethod === "cash" && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="pt-6 hidden lg:block">
                   <Button type="submit" className="w-full h-14 text-lg font-bold gap-2 rounded-2xl bg-brand-gradient text-white border-0 shadow-premium transition-transform hover:-translate-y-1" disabled={isSubmitting || (product.inventory?.stockActual || 0) === 0}>
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-5 h-5" />
                    )}
                    {(product.inventory?.stockActual || 0) === 0 ? "Producto agotado" : "Confirmar Pedido"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Columna Derecha: Resumen (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
             <div className="glass-card p-6 rounded-4xl border shadow-sm sticky top-24">
                <h3 className="text-xl font-bold mb-6 tracking-tight">Resumen de tu orden</h3>
                
                <div className="flex gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border/50">
                    {product.imageUrls?.[0] ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <Package className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground line-clamp-1">{product.name}</h4>
                    {product.comercialConfig?.precioOferta ? (
                      <div className="flex flex-col mt-1">
                        <span className="text-xs text-muted-foreground line-through">Bs. {product.comercialConfig.precioVenta.toFixed(2)}</span>
                        <span className="text-sm font-bold text-primary">Bs. {product.comercialConfig.precioOferta.toFixed(2)}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">Precio unitario: Bs. {product.comercialConfig?.precioVenta?.toFixed(2) || "0.00"}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 py-4 border-t border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Cantidad</Label>
                    <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-xl border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-background shadow-sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold">{quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-background shadow-sm"
                        onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                        disabled={quantity >= maxAllowed}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {product.comercialConfig?.limiteCompra && quantity >= product.comercialConfig.limiteCompra && (
                    <div className="text-xs text-amber-600 font-medium text-right mt-1">
                      Has alcanzado el límite promocional por cliente.
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-muted-foreground mt-4">
                    <span>Subtotal</span>
                    <span>Bs. {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Envío</span>
                    <span>¡Gratis!</span>
                  </div>
                </div>

                <div className="pt-6 flex justify-between items-baseline">
                   <span className="text-lg font-bold">Total a pagar</span>
                   <span className="text-3xl font-black text-brand-gradient">Bs. {total.toFixed(2)}</span>
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-2xl border border-dashed flex items-center gap-3">
                   <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
                   <p className="text-xs text-muted-foreground leading-snug">
                     Tu compra está protegida. Al hacer clic en confirmar, inicias el proceso de pedido seguro en SIGE Marketplace.
                   </p>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Botón flotante móvil */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t shadow-glass z-40 lg:hidden pb-safe">
         <Button 
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            className="w-full h-14 text-lg font-bold gap-2 rounded-2xl shadow-premium bg-brand-gradient text-white border-0 active:scale-95 transition-transform" 
            disabled={isSubmitting || (product.inventory?.stockActual || 0) === 0}
         >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShoppingCart className="w-5 h-5" />
            )}
            {(product.inventory?.stockActual || 0) === 0 ? "Agotado" : `Pagar Bs. ${total.toFixed(2)}`}
         </Button>
      </div>
    </div>
  );
}