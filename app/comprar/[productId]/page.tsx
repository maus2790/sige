"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingCart } from "lucide-react";
import { getProductById } from "@/app/actions/products";
import { createOrder } from "@/app/actions/orders";

export default function ComprarPage() {
  const params = useParams();
  const router = useRouter();
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
    loadProduct();
  }, [productId]);

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
    }
    // Si no hay error, redirige a checkout
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Producto no encontrado</p>
            <Link href="/">
              <Button className="mt-4">Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = product.price * quantity;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href={`/productos/${productId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Volver al producto
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Información del producto */}
          <Card>
            <CardHeader>
              <CardTitle>Tu compra</CardTitle>
              <CardDescription>Revisa los detalles del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                  {product.imageUrls?.[0] ? (
                    <Image
                      src={product.imageUrls[0]}
                      alt={product.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-xl font-bold text-primary mt-2">
                    Bs. {product.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Cantidad</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.inventory?.stockActual || 0, quantity + 1))}
                    disabled={quantity >= (product.inventory?.stockActual || 0)}
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Stock: {product.inventory?.stockActual || 0} unidades
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary text-xl">Bs. {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario de datos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos de envío</CardTitle>
              <CardDescription>Completa tu información para recibir el pedido</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buyerName">Nombre completo *</Label>
                  <Input
                    id="buyerName"
                    name="buyerName"
                    placeholder="Juan Pérez"
                    value={formData.buyerName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="buyerPhone">Teléfono *</Label>
                    <Input
                      id="buyerPhone"
                      name="buyerPhone"
                      placeholder="71234567"
                      value={formData.buyerPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerCi">CI / NIT</Label>
                    <Input
                      id="buyerCi"
                      name="buyerCi"
                      placeholder="1234567"
                      value={formData.buyerCi}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerEmail">Email</Label>
                  <Input
                    id="buyerEmail"
                    name="buyerEmail"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.buyerEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Dirección de envío *</Label>
                  <Textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    placeholder="Calle, número, zona, ciudad"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Método de pago *</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value: string) => setFormData({ ...formData, paymentMethod: value })}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="qr" id="qr" />
                      <Label htmlFor="qr" className="cursor-pointer">QR / Transferencia bancaria</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="cursor-pointer">Pago contra entrega (efectivo)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting || (product.inventory?.stockActual || 0) === 0}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {(product.inventory?.stockActual || 0) === 0 ? "Producto agotado" : "Realizar pedido"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Al realizar el pedido, aceptas nuestros términos y condiciones.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}