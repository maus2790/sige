"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  QrCode, ArrowLeft, ArrowRight, Loader2, CheckCircle2,
  Upload, X, AlertCircle, Clock, ExternalLink, MessageSquare,
  Building2, Smartphone, CreditCard, Users, ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  createRechargeRequest,
  getUserActiveRecharge,
  dismissRechargeRequest,
  getPaymentSettings,
} from "@/app/actions/gift-cards";

type PaymentMethod = "qr" | "bank_transfer" | "tigo_money" | "gateway" | "operator";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeClassName?: string;
}

interface PaymentSettings {
  qrUrl: string;
  bankDetails: string;
  tigoMoney: string;
}

const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; description: string; disabled?: boolean }[] = [
  { id: "qr", label: "Pago con QR", icon: QrCode, description: "Escanea el código QR y paga desde tu app" },
  { id: "bank_transfer", label: "Transferencia bancaria", icon: Building2, description: "Transfiere desde tu banco al número de cuenta" },
  { id: "tigo_money", label: "Tigo Money", icon: Smartphone, description: "Envía dinero al número Tigo Money configurado" },
  { id: "gateway", label: "Pasarela de Pago", icon: CreditCard, description: "Próximamente disponible", disabled: true },
  { id: "operator", label: "Mediante Operador", icon: Users, description: "Un operador te atenderá por WhatsApp" },
];

export function RechargeDialog({ open, onOpenChange, themeClassName }: RechargeDialogProps) {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod | null>(null);
  const [paymentSettings, setPaymentSettings] = React.useState<PaymentSettings | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [transactionNumber, setTransactionNumber] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = React.useState<string | null>(null);
  const [activeRecharge, setActiveRecharge] = React.useState<any>(null);
  const [checkingRecharge, setCheckingRecharge] = React.useState(true);

  // Check for existing recharge when dialog opens
  React.useEffect(() => {
    if (open) {
      checkExistingRecharge();
      loadPaymentSettings();
    }
  }, [open]);

  // Detect desktop breakpoint to switch modal style
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  async function checkExistingRecharge() {
    setCheckingRecharge(true);
    const recharge = await getUserActiveRecharge();
    if (recharge) {
      setActiveRecharge(recharge);
      setStep(3);
    } else {
      setActiveRecharge(null);
      setStep(1);
    }
    setCheckingRecharge(false);
  }

  async function loadPaymentSettings() {
    const settings = await getPaymentSettings();
    setPaymentSettings(settings);
  }

  function resetDialog() {
    setStep(1);
    setSelectedMethod(null);
    setReceiptFile(null);
    setReceiptPreview(null);
    setAmount("");
    setTransactionNumber("");
    setUploadedReceiptUrl(null);
    setActiveRecharge(null);
  }

  function handleClose() {
    resetDialog();
    onOpenChange(false);
  }

  function handleSelectMethod(method: PaymentMethod) {
    setSelectedMethod(method);
    if (method === "operator") {
      handleOperatorRequest();
      return;
    }
    setStep(2);
  }

  async function handleOperatorRequest() {
    setIsLoading(true);
    try {
      const result = await createRechargeRequest({
        amount: 0,
        paymentMethod: "operator",
      });
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      // Redirect to WhatsApp
      const waText = encodeURIComponent(
        `*SOLICITUD DE RECARGA DE SALDO - SIGE*\n\n` +
        `Hola Marco, necesito recargar mi saldo en SIGE Market.\n` +
        `Por favor, ¿podría guiarme con el proceso de pago?\n\n` +
        `ID de solicitud: ${result.id}`
      );
      window.open(`https://wa.me/59173214036?text=${waText}`, "_blank");
      await checkExistingRecharge();
    } catch {
      toast.error("Error al crear la solicitud");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no puede superar 5MB");
      return;
    }
    setReceiptFile(file);
    setUploadedReceiptUrl(null);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadReceipt(): Promise<string | null> {
    if (!receiptFile) return null;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      const res = await fetch("/api/upload/payment-proof", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error al subir el comprobante");
      setUploadedReceiptUrl(data.url);
      return data.url;
    } catch (err: any) {
      toast.error(err.message || "Error al subir el comprobante");
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedMethod || !receiptFile || !amount || !transactionNumber) return;
    setIsLoading(true);
    try {
      const url = uploadedReceiptUrl || await uploadReceipt();
      if (!url) { setIsLoading(false); return; }
      const result = await createRechargeRequest({
        amount: parseFloat(amount),
        paymentMethod: selectedMethod,
        transactionNumber,
        receiptUrl: url,
      });
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      toast.success("¡Solicitud enviada a verificación!");
      await checkExistingRecharge();
    } catch {
      toast.error("Error inesperado al enviar la solicitud");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDismiss() {
    if (!activeRecharge) return;
    setIsLoading(true);
    const result = await dismissRechargeRequest(activeRecharge.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Solicitud descartada");
      resetDialog();
    }
    setIsLoading(false);
  }

  function buildWhatsAppMessage() {
    return encodeURIComponent(
      `*RECLAMACIÓN - RECARGA DE SALDO SIGE*\n\n` +
      `ID de solicitud: ${activeRecharge?.id || "N/A"}\n` +
      `Monto: Bs. ${activeRecharge?.amount?.toFixed(2) || "0.00"}\n` +
      `Método: ${activeRecharge?.paymentMethod || "N/A"}\n` +
      `Número de transacción: ${activeRecharge?.transactionNumber || "N/A"}\n\n` +
      `Hola Marco, mi solicitud de recarga fue rechazada y quiero hacer un reclamo.`
    );
  }

  const methodDetails: Record<string, { label: string; icon: React.ElementType }> = {
    qr: { label: "QR", icon: QrCode },
    bank_transfer: { label: "Transferencia", icon: Building2 },
    tigo_money: { label: "Tigo Money", icon: Smartphone },
    operator: { label: "Operador", icon: Users },
    gateway: { label: "Pasarela", icon: CreditCard },
  };

  const canSubmit = !!receiptFile && !!amount && parseFloat(amount) > 0 && !!transactionNumber && !isLoading && !isUploading;

  const content = (
    <div className={cn("quick-publish-theme flex flex-col max-h-[90vh] w-full", themeClassName)}>
      {/* Header */}
      <div className="quick-publish-header flex-none bg-brand-gradient p-4 text-white">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black tracking-tight text-white leading-none">
            Recargar Crédito
          </h2>
          <p className="text-blue-100 font-medium text-[10px]">
            {step === 1 && "Selecciona tu método de pago"}
            {step === 2 && `Sube tu comprobante · ${METHODS.find(m => m.id === selectedMethod)?.label}`}
            {step === 3 && (activeRecharge?.status === "rejected" ? "Solicitud rechazada" : "En verificación...")}
          </p>
        </div>
      </div>

      <div className="quick-publish-body flex-1 p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
        {checkingRecharge ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando estado...</p>
          </div>
        ) : step === 1 ? (
          /* STEP 1: METHOD SELECTION */
          <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
            {METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => !method.disabled && handleSelectMethod(method.id)}
                  disabled={method.disabled || isLoading}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200",
                    method.disabled
                      ? "opacity-40 cursor-not-allowed border-border bg-muted/30"
                      : "cursor-pointer border-border hover:border-primary hover:bg-primary/5 hover:shadow-sm active:scale-[0.98]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    method.disabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground leading-none mb-1">{method.label}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{method.description}</p>
                  </div>
                  {method.disabled ? (
                    <span className="text-[10px] font-bold text-amber-500 border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">
                      Pronto
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a WhatsApp...
              </div>
            )}
          </div>
        ) : step === 2 && selectedMethod ? (
          /* STEP 2: RECEIPT UPLOAD */
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Payment data display */}
            {(selectedMethod === "qr" || selectedMethod === "bank_transfer" || selectedMethod === "tigo_money") && (
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
                {selectedMethod === "qr" && paymentSettings?.qrUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Código QR de Pago</p>
                    <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary/20 bg-white">
                      <Image src={paymentSettings.qrUrl} alt="QR de pago" fill className="object-contain p-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">Escanea con tu app bancaria o billetera</p>
                  </div>
                )}
                {selectedMethod === "qr" && !paymentSettings?.qrUrl && (
                  <div className="text-center py-4">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">QR no configurado aún. Contáctanos por WhatsApp.</p>
                  </div>
                )}
                {selectedMethod === "bank_transfer" && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Datos de Transferencia</p>
                    {paymentSettings?.bankDetails ? (
                      <pre className="text-sm font-mono bg-card rounded-xl border p-3 whitespace-pre-wrap leading-relaxed">{paymentSettings.bankDetails}</pre>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Datos de banco no configurados. Contacta a un operador.</p>
                    )}
                  </div>
                )}
                {selectedMethod === "tigo_money" && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Número Tigo Money</p>
                    {paymentSettings?.tigoMoney ? (
                      <div className="flex items-center gap-3 bg-card rounded-xl border p-3">
                        <Smartphone className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-xl font-black tracking-widest">{paymentSettings.tigoMoney}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Número de Tigo Money no configurado. Contacta a un operador.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Receipt upload */}
            <div className="space-y-2">
              <Label className="font-bold text-sm">Comprobante de Pago</Label>
              {receiptPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30">
                  <div className="relative w-full aspect-4/3">
                    <Image src={receiptPreview} alt="Comprobante" fill className="object-contain bg-muted" />
                  </div>
                  <button
                    onClick={() => { setReceiptFile(null); setReceiptPreview(null); setUploadedReceiptUrl(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-xs font-semibold">✓ Comprobante cargado</p>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl h-40 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                  <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary">Toca para seleccionar foto</span>
                  <span className="text-xs text-muted-foreground mt-0.5">JPG, PNG o WEBP · Máx. 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
              )}
            </div>

            {/* Amount and transaction fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-bold text-sm">Monto (Bs.)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 rounded-xl text-lg font-black border-2 border-primary/20"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Nro. de Transacción</Label>
                <Input
                  type="text"
                  placeholder="Ej. 123456789"
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  className="h-12 rounded-xl border-2"
                />
              </div>
            </div>
          </div>
        ) : step === 3 ? (
          /* STEP 3: STATUS */
          <div className="flex flex-col items-center text-center py-6 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeRecharge?.status === "rejected" ? (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-foreground">Solicitud Rechazada</h3>
                  <p className="text-sm text-muted-foreground">Tu solicitud de recarga no fue aprobada.</p>
                </div>
                {activeRecharge.rejectionReason && (
                  <div className="w-full bg-destructive/5 border border-destructive/20 rounded-2xl p-4 text-left">
                    <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-1">Motivo del rechazo</p>
                    <p className="text-sm text-foreground leading-relaxed">{activeRecharge.rejectionReason}</p>
                  </div>
                )}
                <div className="w-full grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    disabled={isLoading}
                    className="h-12 rounded-2xl font-bold"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aceptar"}
                  </Button>
                  <a
                    href={`https://wa.me/59173214036?text=${buildWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full h-12 rounded-2xl font-bold gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white border-0">
                      <MessageSquare className="w-4 h-4" />
                      Reclamar
                    </Button>
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-foreground">Pago en Verificación</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Tu solicitud fue enviada. El equipo SIGE la verificará en breve y recibirás tu saldo.
                  </p>
                </div>
                <div className="w-full bg-card rounded-2xl border p-4 space-y-3 text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Datos del asistente</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Marco Uscamayta</p>
                    <p className="text-xs text-muted-foreground">Cel: 73214036</p>
                    <p className="text-xs text-muted-foreground">maus279000@gmail.com</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/59173214036?text=${encodeURIComponent(
                    `*VERIFICACIÓN DE RECARGA - SIGE*\n\n` +
                    `Hola Marco, soy ${activeRecharge?.userName || ""}, acabo de enviar mi comprobante de recarga.\n` +
                    `ID de solicitud: ${activeRecharge?.id || "N/A"}\n` +
                    `Monto: Bs. ${activeRecharge?.amount?.toFixed(2) || "0.00"}\n` +
                    `Método: ${activeRecharge?.paymentMethod || "N/A"}\n` +
                    `Transacción: ${activeRecharge?.transactionNumber || "N/A"}\n\n` +
                    `Por favor, verifica mi pago. ¡Gracias!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full h-12 rounded-2xl font-bold gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white border-0">
                    <MessageSquare className="w-4 h-4" />
                    Contactar al Asistente
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </Button>
                </a>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      {!checkingRecharge && step !== 3 && (
        <div className="quick-publish-footer flex-none py-2 px-4 flex gap-3 justify-between items-center bg-background/50 backdrop-blur-sm border-t border-border/50">
          {step === 2 ? (
            <Button
              variant="ghost"
              onClick={() => { setStep(1); setSelectedMethod(null); setReceiptFile(null); setReceiptPreview(null); setAmount(""); setTransactionNumber(""); }}
              disabled={isLoading}
              className="rounded-xl h-10 text-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Atrás
            </Button>
          ) : (
            <div />
          )}
          {step === 2 && (
            <Button
              className="rounded-full px-8 h-10 font-black text-xs gap-2"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isLoading || isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {isUploading ? "Subiendo..." : "Enviando..."}</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Enviar a Verificación</>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={cn("p-0 overflow-hidden border-none rounded-xl max-w-3xl w-full max-h-[90vh]", themeClassName)}>
          <DialogTitle className="sr-only">Recargar Crédito</DialogTitle>
          <DialogDescription className="sr-only">Carga saldo a tu billetera de Gift Cards paso a paso.</DialogDescription>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className={cn("quick-publish-dialog p-0 overflow-hidden border-none rounded-t-[2.5rem] h-auto max-h-[90vh]", themeClassName)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">Recargar Crédito</SheetTitle>
        <SheetDescription className="sr-only">Carga saldo a tu billetera de Gift Cards paso a paso.</SheetDescription>
        {content}
      </SheetContent>
    </Sheet>
  );
}
