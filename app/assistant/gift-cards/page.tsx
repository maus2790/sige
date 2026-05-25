"use client";

import { useEffect, useState, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Calendar,
  Mail,
  Gift,
  RefreshCw,
  Settings,
  QrCode,
  Building2,
  Smartphone,
  Upload,
  X,
  MessageSquare,
  Users,
  BadgeCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPendingGiftCards,
  verifyGiftCardPayment,
  getPendingRecharges,
  verifyRechargeRequest,
  updateOperatorRecharge,
  getPaymentSettings,
  updatePaymentSettings,
} from "@/app/actions/gift-cards";

/* ─────────────────── TYPES ─────────────────── */
interface PendingGiftCard {
  id: string;
  amount: number;
  balance: number;
  senderName: string;
  senderEmail: string;
  recipientEmail: string | null;
  recipientName: string | null;
  createdAt: Date;
  receiptUrl: string | null;
  status: string;
}

interface PendingRecharge {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  transactionNumber: string | null;
  receiptUrl: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
  userName: string;
  userEmail: string;
}

/* ─────────────────── SKELETON ─────────────────── */
function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────── GIFT CARD VERIFICATION TAB ─────────────────── */
function GiftCardsTab() {
  const [cards, setCards] = useState<PendingGiftCard[]>([]);
  const [filtered, setFiltered] = useState<PendingGiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function load() {
    setIsLoading(true);
    const data = await getPendingGiftCards();
    setCards(data as unknown as PendingGiftCard[]);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = [...cards];
    if (searchTerm) {
      f = f.filter(
        (g) =>
          g.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.recipientName && g.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          g.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFiltered(f);
  }, [cards, searchTerm]);

  async function handleVerification(id: string, action: "approve" | "reject") {
    setProcessingId(id);
    const result = await verifyGiftCardPayment(id, action);
    if (result.error) toast.error(result.error);
    else { toast.success(result.message); await load(); }
    setProcessingId(null);
  }

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por remitente, destinatario o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 focus:outline-none focus:border-primary transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Sin verificaciones pendientes!</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron resultados." : "Todas las Gift Cards han sido procesadas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((card) => (
            <Card key={card.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary" /> Gift Card
                    </CardTitle>
                    <CardDescription>ID: {card.id.split('-')[0]}</CardDescription>
                  </div>
                  <Badge variant="destructive">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">De:</span> <strong>{card.senderName}</strong></p>
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{card.senderEmail}</span>
                  </p>
                  {card.recipientName && <p><span className="text-muted-foreground">Para:</span> <strong>{card.recipientName}</strong></p>}
                  <p className="text-lg font-bold text-primary pt-1">Bs. {card.amount.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(card.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" /> Comprobante
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Comprobante de Pago</DialogTitle>
                        <DialogDescription>Gift Card de {card.senderName} por Bs. {card.amount.toFixed(2)}</DialogDescription>
                      </DialogHeader>
                      {card.receiptUrl ? (
                        <div className="relative w-full h-[400px] border rounded-lg overflow-hidden mt-4">
                          <Image src={card.receiptUrl} alt="Comprobante" fill sizes="672px" className="object-contain" />
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-muted/50 rounded-lg mt-4">
                          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground font-medium">No hay comprobante disponible</p>
                        </div>
                      )}
                      <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button variant="destructive" onClick={() => handleVerification(card.id, "reject")} disabled={processingId === card.id}>
                          {processingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                          Rechazar
                        </Button>
                        <Button onClick={() => handleVerification(card.id, "approve")} disabled={processingId === card.id}>
                          {processingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Aprobar Pago
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── RECHARGE VERIFICATION TAB ─────────────────── */
function RechargesTab() {
  const [recharges, setRecharges] = useState<PendingRecharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [operatorDialogId, setOperatorDialogId] = useState<string | null>(null);
  const [operatorAmount, setOperatorAmount] = useState("");
  const [operatorTxn, setOperatorTxn] = useState("");
  const [operatorReceipt, setOperatorReceipt] = useState<File | null>(null);
  const [operatorReceiptPreview, setOperatorReceiptPreview] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const data = await getPendingRecharges();
    setRecharges(data as unknown as PendingRecharge[]);
    setIsLoading(false);
  }

  useEffect(() => { load(); }, []);

  const methodLabel: Record<string, string> = {
    qr: "QR",
    bank_transfer: "Transferencia bancaria",
    tigo_money: "Tigo Money",
    operator: "Mediante Operador",
    gateway: "Pasarela de Pago",
  };

  const methodIcon: Record<string, React.ElementType> = {
    qr: QrCode,
    bank_transfer: Building2,
    tigo_money: Smartphone,
    operator: Users,
  };

  async function handleApprove(id: string) {
    setProcessingId(id);
    const result = await verifyRechargeRequest(id, 'approve');
    if (result.error) toast.error(result.error);
    else { toast.success(result.message); await load(); }
    setProcessingId(null);
  }

  async function handleReject() {
    if (!rejectDialogId) return;
    setProcessingId(rejectDialogId);
    const result = await verifyRechargeRequest(rejectDialogId, 'reject', rejectReason || "Pago no verificado");
    if (result.error) toast.error(result.error);
    else { toast.success(result.message); setRejectDialogId(null); setRejectReason(""); await load(); }
    setProcessingId(null);
  }

  async function handleOperatorApprove() {
    if (!operatorDialogId || !operatorAmount || !operatorTxn) {
      toast.error("Completa todos los campos");
      return;
    }
    setProcessingId(operatorDialogId);

    let receiptUrl = "";
    if (operatorReceipt) {
      const fd = new FormData();
      fd.append("file", operatorReceipt);
      const res = await fetch("/api/upload/payment-proof", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) { toast.error(data.error || "Error al subir comprobante"); setProcessingId(null); return; }
      receiptUrl = data.url;
    }

    const result = await updateOperatorRecharge(operatorDialogId, parseFloat(operatorAmount), operatorTxn, receiptUrl);
    if (result.error) toast.error(result.error);
    else { toast.success(result.message); setOperatorDialogId(null); setOperatorAmount(""); setOperatorTxn(""); setOperatorReceipt(null); setOperatorReceiptPreview(null); await load(); }
    setProcessingId(null);
  }

  function handleOperatorFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOperatorReceipt(file);
    const reader = new FileReader();
    reader.onload = () => setOperatorReceiptPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;

  return (
    <div className="space-y-6">
      {recharges.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BadgeCheck className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Sin recargas pendientes!</h3>
            <p className="text-muted-foreground">Todas las solicitudes de recarga han sido procesadas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recharges.map((r) => {
            const Icon = methodIcon[r.paymentMethod] || RefreshCw;
            const isOperator = r.paymentMethod === "operator";
            return (
              <Card key={r.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" /> Recarga de Saldo
                      </CardTitle>
                      <CardDescription>ID: {r.id.split('-')[0]}</CardDescription>
                    </div>
                    <Badge variant={isOperator ? "secondary" : "destructive"}>
                      {isOperator ? "Operador" : "Pendiente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Usuario:</span> <strong>{r.userName}</strong></p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> <span className="truncate">{r.userEmail}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{methodLabel[r.paymentMethod] || r.paymentMethod}</span>
                      </div>
                    </div>
                    {!isOperator && (
                      <>
                        <p className="text-xl font-black text-primary pt-1">Bs. {r.amount.toFixed(2)}</p>
                        {r.transactionNumber && (
                          <p className="text-xs text-muted-foreground">Txn: <span className="font-mono">{r.transactionNumber}</span></p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {isOperator ? (
                      <Button size="sm" className="flex-1" onClick={() => setOperatorDialogId(r.id)}>
                        <MessageSquare className="w-4 h-4 mr-2" /> Registrar Pago
                      </Button>
                    ) : (
                      <>
                        {r.receiptUrl && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Eye className="w-4 h-4 mr-2" /> Comprobante
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Comprobante – {r.userName}</DialogTitle>
                                <DialogDescription>Recarga de Bs. {r.amount.toFixed(2)} vía {methodLabel[r.paymentMethod]}</DialogDescription>
                              </DialogHeader>
                              <div className="relative w-full h-[400px] border rounded-lg overflow-hidden mt-4">
                                <Image src={r.receiptUrl} alt="Comprobante" fill sizes="672px" className="object-contain" />
                              </div>
                              <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                                <Button variant="destructive" onClick={() => setRejectDialogId(r.id)} disabled={!!processingId}>
                                  <XCircle className="w-4 h-4 mr-2" /> Rechazar
                                </Button>
                                <Button onClick={() => handleApprove(r.id)} disabled={!!processingId}>
                                  {processingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                  Aprobar Recarga
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleApprove(r.id)}
                          disabled={!!processingId}
                          className={r.receiptUrl ? "flex-1" : "flex-[2]"}
                        >
                          {processingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectDialogId(r.id)}
                          disabled={!!processingId}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectDialogId} onOpenChange={(o) => { if (!o) setRejectDialogId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Solicitud</DialogTitle>
            <DialogDescription>Ingresa el motivo del rechazo (opcional). El usuario lo verá.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Motivo del rechazo</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: El comprobante no es legible, el monto no coincide..."
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRejectDialogId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!processingId}>
              {processingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Operator dialog */}
      <Dialog open={!!operatorDialogId} onOpenChange={(o) => { if (!o) { setOperatorDialogId(null); setOperatorAmount(""); setOperatorTxn(""); setOperatorReceipt(null); setOperatorReceiptPreview(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Pago del Operador</DialogTitle>
            <DialogDescription>Completa los datos del pago recibido para acreditar el saldo al usuario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Monto (Bs.)</Label>
                <Input type="number" placeholder="0.00" value={operatorAmount} onChange={(e) => setOperatorAmount(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Nro. de Transacción</Label>
                <Input type="text" placeholder="Ej. 123456789" value={operatorTxn} onChange={(e) => setOperatorTxn(e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comprobante (opcional)</Label>
              {operatorReceiptPreview ? (
                <div className="relative rounded-xl overflow-hidden border">
                  <div className="relative w-full aspect-video">
                    <Image src={operatorReceiptPreview} alt="Comprobante" fill className="object-contain bg-muted" />
                  </div>
                  <button
                    onClick={() => { setOperatorReceipt(null); setOperatorReceiptPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl h-28 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Seleccionar comprobante</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleOperatorFile} />
                </label>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setOperatorDialogId(null)}>Cancelar</Button>
            <Button onClick={handleOperatorApprove} disabled={!!processingId || !operatorAmount || !operatorTxn}>
              {processingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Acreditar Saldo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────────── PAYMENT SETTINGS TAB ─────────────────── */
function PaymentSettingsTab() {
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState("");
  const [tigoMoney, setTigoMoney] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [currentQrUrl, setCurrentQrUrl] = useState("");

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const settings = await getPaymentSettings();
      setCurrentQrUrl(settings.qrUrl);
      if (settings.qrUrl) setQrPreview(settings.qrUrl);
      setBankDetails(settings.bankDetails);
      setTigoMoney(settings.tigoMoney);
      setIsLoading(false);
    }
    load();
  }, []);

  function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setIsSaving(true);
    let qrUrl = currentQrUrl;
    if (qrFile) {
      setIsUploadingQr(true);
      const fd = new FormData();
      fd.append("file", qrFile);
      const res = await fetch("/api/upload/payment-proof", { method: "POST", body: fd });
      const data = await res.json();
      setIsUploadingQr(false);
      if (!res.ok || !data.success) { toast.error(data.error || "Error al subir QR"); setIsSaving(false); return; }
      qrUrl = data.url;
    }
    const result = await updatePaymentSettings({ qrUrl, bankDetails, tigoMoney });
    if (result.error) toast.error(result.error);
    else { toast.success("¡Configuración de pagos actualizada!"); setCurrentQrUrl(qrUrl); setQrFile(null); }
    setIsSaving(false);
  }

  if (isLoading) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" /> Código QR de Pago
          </CardTitle>
          <CardDescription>Sube una imagen del QR que los usuarios escanearán para pagar.</CardDescription>
        </CardHeader>
        <CardContent>
          {qrPreview ? (
            <div className="relative w-56 h-56 mx-auto rounded-2xl overflow-hidden border-2 border-primary/20">
              <Image src={qrPreview} alt="QR" fill className="object-contain bg-white p-2" />
              <button
                onClick={() => { setQrFile(null); setQrPreview(null); setCurrentQrUrl(""); }}
                className="absolute top-2 right-2 w-8 h-8 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl h-48 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-2" />
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-primary">Subir imagen del QR</span>
              <span className="text-xs text-muted-foreground mt-0.5">JPG, PNG o WEBP</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleQrFile} />
            </label>
          )}
          {qrFile && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {qrFile.name} · {(qrFile.size / 1024).toFixed(1)} KB (nuevo - se subirá al guardar)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Datos de Transferencia Bancaria
          </CardTitle>
          <CardDescription>Esta información la verán los usuarios al elegir transferencia bancaria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            placeholder={"Banco: Banco Nacional\nCuenta: 1234567890\nTitular: Juan Pérez\nCI: 12345678"}
            rows={5}
            className="font-mono text-sm resize-none"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Número Tigo Money
          </CardTitle>
          <CardDescription>Número de teléfono al que los usuarios enviarán el pago por Tigo Money.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="tel"
            value={tigoMoney}
            onChange={(e) => setTigoMoney(e.target.value)}
            placeholder="Ej. 76543210"
            className="h-12 text-lg font-bold tracking-widest"
            maxLength={15}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 font-black text-sm rounded-2xl">
        {isSaving ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isUploadingQr ? "Subiendo QR..." : "Guardando..."}</>
        ) : (
          <><Settings className="w-4 h-4 mr-2" />Guardar Configuración de Pagos</>
        )}
      </Button>
    </div>
  );
}

/* ─────────────────── PAGE ─────────────────── */
export default function GiftCardVerificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Gift Cards</h1>
        <p className="text-muted-foreground mt-1">Verifica pagos, aprueba recargas y configura métodos de pago</p>
      </div>

      <Tabs defaultValue="gift-cards">
        <TabsList className="grid grid-cols-3 w-full max-w-lg rounded-2xl h-11">
          <TabsTrigger value="gift-cards" className="rounded-xl gap-2">
            <Gift className="w-4 h-4" /> Gift Cards
          </TabsTrigger>
          <TabsTrigger value="recharges" className="rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Recargas
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl gap-2">
            <Settings className="w-4 h-4" /> Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gift-cards" className="mt-6">
          <GiftCardsTab />
        </TabsContent>
        <TabsContent value="recharges" className="mt-6">
          <RechargesTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <PaymentSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
