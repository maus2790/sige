"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle, AlertCircle, CreditCard, Truck, Eye, Upload } from "lucide-react";
import { getOrderForCheckout, uploadPaymentProof } from "@/app/actions/orders";
import QRCode from "qrcode";

interface OrderData {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string | null;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  productName: string;
  productImage: string;
  storeName: string;
  storePhone: string;
  createdAt: Date;
}

export default function CheckoutPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setIsLoading(true);
    const data = await getOrderForCheckout(orderId);
    if (data) {
      setOrder(data as OrderData);
      
      // Generar QR de pago
      const paymentInfo = `SIGE Marketplace\nOrden: ${data.id}\nMonto: Bs. ${data.totalAmount}\nTienda: ${data.storeName}`;
      const qr = await QRCode.toDataURL(paymentInfo);
      setQrCodeUrl(qr);
    }
    setIsLoading(false);
  }

  async function handleProofUpload() {
    if (!proofFile) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    setIsUploading(true);

    try {
      // Subir el archivo al servidor (evita el problema de reloj del navegador)
      const uploadFormData = new FormData();
      uploadFormData.append("file", proofFile);

      const uploadResponse = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || uploadResult.error) {
        toast.error(uploadResult.error || "Error al subir la imagen");
        setIsUploading(false);
        return;
      }

      // Guardar URL en la orden
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("proofUrl", uploadResult.url);

      const result = await uploadPaymentProof(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("¡Comprobante subido! El asistente verificará tu pago.");
        setProofFile(null);
        setProofPreview(null);
        await loadOrder();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error de conexión al subir el comprobante");
    }

    setIsUploading(false);
  }

  const handleCopy = async () => {
    if (order) {
      await navigator.clipboard.writeText(`Orden: ${order.id}\nMonto: Bs. ${order.totalAmount}\nTienda: ${order.storeName}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Orden no encontrada</h2>
            <p className="text-muted-foreground">
              La orden que buscas no existe o ha expirado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending_payment: { label: "Pendiente de pago", variant: "destructive" },
    payment_verified: { label: "Pago verificado", variant: "default" },
    processing: { label: "Procesando", variant: "secondary" },
    shipped: { label: "Enviado", variant: "secondary" },
    delivered: { label: "Entregado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };

  const currentStatus = statusConfig[order.status] || { label: order.status, variant: "outline" };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Finalizar Compra</h1>
          <p className="text-muted-foreground mt-2">
            Completa el pago para confirmar tu pedido
          </p>
        </div>

        {/* Estado de la orden */}
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estado de la orden</p>
              <Badge variant={currentStatus.variant} className="mt-1">
                {currentStatus.label}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Número de orden</p>
              <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Información del producto */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle del pedido</CardTitle>
              <CardDescription>Revisa los datos de tu compra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  {order.productImage ? (
                    <Image
                      src={order.productImage}
                      alt={order.productName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{order.productName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Cantidad: {order.quantity} unidad(es)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tienda: {order.storeName}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Bs. {order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">Bs. {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Dirección de envío</p>
                <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
              </div>
            </CardContent>
          </Card>

          {/* Instrucciones de pago */}
          <Card>
            <CardHeader>
              <CardTitle>Instrucciones de pago</CardTitle>
              <CardDescription>
                Realiza el pago y sube tu comprobante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Datos para transferencia</span>
                </div>
                <p className="text-sm"><strong>Banco:</strong> Banco Unión</p>
                <p className="text-sm"><strong>Número de cuenta:</strong> 123-4567890</p>
                <p className="text-sm"><strong>CI/NIT:</strong> 123456789</p>
                <p className="text-sm"><strong>Beneficiario:</strong> {order.storeName}</p>
                <p className="text-sm font-bold mt-2">Monto a pagar: Bs. {order.totalAmount.toFixed(2)}</p>
                
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copiado!" : "Copiar datos"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver QR
                  </Button>
                </div>
              </div>

              {/* Subir comprobante */}
              {order.status === "pending_payment" && (
                <div className="space-y-3">
                  <Label>Subir comprobante de pago</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProofFile(file);
                          setProofPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {proofPreview ? (
                        <Image
                          src={proofPreview}
                          alt="Preview"
                          width={150}
                          height={150}
                          className="rounded-lg object-cover"
                        />
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Haz clic o arrastra tu comprobante
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                  
                  <Button
                    onClick={handleProofUpload}
                    disabled={!proofFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Subir comprobante
                  </Button>
                </div>
              )}

              {order.status === "payment_verified" && (
                <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/20">
                  <CheckCircle className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="font-semibold text-foreground">¡Pago verificado!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu pago ha sido confirmado. Pronto recibirás actualizaciones de tu envío.
                  </p>
                </div>
              )}

              {order.status === "shipped" && (
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <Truck className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="font-semibold text-foreground text-center">¡Pedido enviado!</p>
                  <p className="text-sm text-muted-foreground mt-1 text-center">
                    Tu pedido está en camino. Revisa tu correo para el código de seguimiento.
                  </p>
                </div>
              )}

              {order.status === "delivered" && (
                <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/20">
                  <CheckCircle className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="font-semibold text-foreground">¡Pedido entregado!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gracias por comprar en SIGE Marketplace.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal QR */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Código QR de pago</DialogTitle>
              <DialogDescription>
                Escanea este código QR para realizar el pago
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              {qrCodeUrl ? (
                <Image
                  src={qrCodeUrl}
                  alt="Código QR de pago"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              ) : (
                <Loader2 className="w-12 h-12 animate-spin" />
              )}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Monto: Bs. {order.totalAmount.toFixed(2)}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowQR(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}