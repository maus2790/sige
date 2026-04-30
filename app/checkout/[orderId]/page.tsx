"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle, AlertCircle, CreditCard, Truck, Eye, Upload, Package, ArrowLeft, ExternalLink, Calendar, Info, Store } from "lucide-react";
import { getOrderForCheckout, uploadPaymentProof } from "@/app/actions/orders";
import QRCode from "qrcode";
import Link from "next/link";

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

      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("proofUrl", uploadResult.url);

      const result = await uploadPaymentProof(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("¡Comprobante subido! Verificaremos tu pago pronto.");
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
      await navigator.clipboard.writeText(`Orden: ${order.id}\nMonto: Bs. ${order.totalAmount}\nTienda: ${order.storeName}\nCuenta: 123-4567890 (Banco Unión)`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md border-none bg-transparent shadow-none">
          <CardContent className="text-center py-8">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Orden no encontrada</h2>
            <p className="text-muted-foreground mb-6">
              La orden que buscas no existe o ha expirado.
            </p>
            <Link href="/">
              <Button className="rounded-full px-8">Ir al Inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }> = {
    pending_payment: { label: "Pendiente de pago", variant: "destructive", icon: CreditCard, color: "text-red-500 bg-red-500/10" },
    payment_verified: { label: "Pago verificado", variant: "default", icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
    processing: { label: "Procesando", variant: "secondary", icon: Package, color: "text-blue-500 bg-blue-500/10" },
    shipped: { label: "Enviado", variant: "secondary", icon: Truck, color: "text-orange-500 bg-orange-500/10" },
    delivered: { label: "Entregado", variant: "default", icon: CheckCircle, color: "text-primary bg-primary/10" },
    cancelled: { label: "Cancelado", variant: "destructive", icon: AlertCircle, color: "text-gray-500 bg-gray-500/10" },
  };

  const currentStatus = statusConfig[order.status] || { label: order.status, variant: "outline", icon: Info, color: "text-muted-foreground bg-muted" };
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navbar simplificada */}
      <div className="sticky top-0 z-30 glass border-b shadow-sm">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Estado de mi Pedido</h1>
          </div>
          <Badge variant="outline" className="font-mono text-xs hidden sm:flex">
             #{order.id.slice(0, 8)}
          </Badge>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        
        {/* Banner de Estado */}
        <div className={`w-full p-6 rounded-4xl border mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm transition-all duration-500 animate-in fade-in zoom-in-95 ${currentStatus.color.split(' ')[1]} ${currentStatus.color.split(' ')[0].replace('text-', 'border-').replace('500', '200')}/20`}>
           <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${currentStatus.color.split(' ')[0].replace('text-', 'bg-')} text-white shadow-lg`}>
                 <StatusIcon className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-sm font-bold uppercase tracking-wider opacity-70">Estado Actual</p>
                 <h2 className={`text-3xl font-black ${currentStatus.color.split(' ')[0]}`}>{currentStatus.label}</h2>
              </div>
           </div>
           <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <p className="text-sm font-medium opacity-60">Fecha del pedido</p>
              <div className="flex items-center gap-2 mt-1">
                 <Calendar className="w-4 h-4" />
                 <p className="font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
           </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Detalles del pedido (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-4xl border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Package className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-bold tracking-tight">Detalles de la Compra</h3>
              </div>

              <div className="flex gap-5 mb-8">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-muted shrink-0 border shadow-sm">
                  {order.productImage ? (
                    <Image
                      src={order.productImage}
                      alt={order.productName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <Package className="w-10 h-10 text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-foreground leading-tight mb-1">{order.productName}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                     <p>Cantidad: <span className="text-foreground font-bold">{order.quantity}</span></p>
                     <p>Tienda: <span className="text-foreground font-bold">{order.storeName}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-6 border-t border-b border-border/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-bold">Bs. {order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Costo de envío</span>
                  <span className="text-green-600 font-bold">Gratis</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-bold">Total Pagado</span>
                  <span className="text-2xl font-black text-brand-gradient">Bs. {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                   <Truck className="w-4 h-4 text-muted-foreground" />
                   <p className="text-sm font-bold text-foreground">Dirección de entrega</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                   <p className="text-sm leading-relaxed text-foreground/80">{order.shippingAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Pago (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 rounded-4xl border shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <CreditCard className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-bold tracking-tight">Instrucciones de Pago</h3>
              </div>

              {order.status === "pending_payment" ? (
                <div className="space-y-6">
                  <div className="bg-muted/50 p-5 rounded-2xl border-2 border-primary/10 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                       <Store className="w-16 h-16" />
                    </div>
                    <div className="relative z-10">
                       <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Datos de la Cuenta</p>
                       <div className="space-y-1">
                          <p className="text-sm"><strong>Banco:</strong> Banco Unión</p>
                          <p className="text-sm"><strong>Número:</strong> 123-4567890</p>
                          <p className="text-sm"><strong>Beneficiario:</strong> {order.storeName}</p>
                          <p className="text-sm"><strong>CI/NIT:</strong> 123456789</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-2 pt-3">
                      <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-1 rounded-xl h-10 font-bold transition-transform active:scale-95">
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? "¡Copiado!" : "Copiar"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="flex-1 rounded-xl h-10 font-bold transition-transform active:scale-95">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver QR
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-bold">Subir Comprobante</Label>
                    <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all group ${proofPreview ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-muted/50'}`}>
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
                        className="cursor-pointer flex flex-col items-center gap-4"
                      >
                        {proofPreview ? (
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-premium border-2 border-white">
                            <Image
                              src={proofPreview}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <Upload className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                              <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                               <span className="text-sm font-bold text-foreground">Seleccionar imagen</span>
                               <p className="text-xs text-muted-foreground mt-1">Sube una foto del comprobante o captura de pantalla</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                    
                    <Button
                      onClick={handleProofUpload}
                      disabled={!proofFile || isUploading}
                      className="w-full h-12 rounded-xl bg-brand-gradient text-white border-0 shadow-md font-bold transition-all hover:shadow-lg active:scale-95"
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      Enviar Comprobante
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="p-8 rounded-4xl border-2 border-dashed border-primary/20 bg-primary/5 text-center space-y-4">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                         <StatusIcon className={`w-10 h-10 ${currentStatus.color.split(' ')[0]}`} />
                      </div>
                      <div>
                         <h4 className="text-xl font-black tracking-tight">{currentStatus.label}</h4>
                         <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto leading-relaxed">
                            {order.status === "payment_verified" ? "Hemos recibido tu pago correctamente. Estamos preparando tu paquete." : 
                             order.status === "shipped" ? "Tu paquete está en camino a la dirección indicada." :
                             order.status === "delivered" ? "El pedido ha sido entregado. ¡Gracias por confiar en SIGE!" : 
                             "Estamos procesando tu solicitud."}
                         </p>
                      </div>
                      {order.status === "shipped" && (
                         <Button variant="outline" className="w-full rounded-xl gap-2 font-bold h-12 border-2">
                            <ExternalLink className="w-4 h-4" />
                            Rastrear Envío
                         </Button>
                      )}
                   </div>

                   <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Cualquier duda contacta a</p>
                      <p className="text-sm font-bold">{order.storeName}</p>
                      <p className="text-xs text-primary font-medium mt-1">{order.storePhone}</p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal QR */}
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-0 shadow-premium">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl font-black tracking-tight">Escanea para Pagar</DialogTitle>
              <DialogDescription className="text-base">
                Realiza el pago exacto para acelerar la verificación.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <div className="p-6 bg-white rounded-3xl shadow-premium mb-6 border-2 border-primary/5">
                {qrCodeUrl ? (
                  <Image
                    src={qrCodeUrl}
                    alt="Código QR de pago"
                    width={220}
                    height={220}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="text-center">
                 <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Monto Total</p>
                 <p className="text-4xl font-black text-brand-gradient">Bs. {order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => setShowQR(false)} className="rounded-full px-12 h-12 font-bold shadow-md">Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}