"use client";

import { useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Calendar,
  Mail,
  Gift
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPendingGiftCards, verifyGiftCardPayment } from "@/app/actions/gift-cards";

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

export default function GiftCardVerificationsPage() {
  const [giftCards, setGiftCards] = useState<PendingGiftCard[]>([]);
  const [filteredGiftCards, setFilteredGiftCards] = useState<PendingGiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadData() {
    setIsLoading(true);
    const data = await getPendingGiftCards();
    setGiftCards(data as unknown as PendingGiftCard[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let fGiftCards = [...giftCards];
    if (searchTerm) {
      fGiftCards = fGiftCards.filter(
        (g) =>
          g.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.recipientName && g.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          g.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredGiftCards(fGiftCards);
  }, [giftCards, searchTerm]);

  async function handleVerification(giftCardId: string, action: "approve" | "reject") {
    setProcessingId(giftCardId);
    const result = await verifyGiftCardPayment(giftCardId, action);

    if (result.error) toast.error(result.error);
    else {
      toast.success(result.message);
      await loadData();
    }
    setProcessingId(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
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
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificación de Gift Cards</h1>
        <p className="text-muted-foreground mt-1">
          Valida los pagos de tarjetas de regalo para activarlas
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por remitente, destinatario o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-muted/50 focus:outline-none focus:border-primary transition-colors"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {filteredGiftCards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Sin verificaciones pendientes!</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No se encontraron resultados para tu búsqueda." : "Todas las gift cards han sido procesadas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGiftCards.map((card) => (
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
                  <p>
                    <span className="text-muted-foreground">De:</span>{" "}
                    <strong>{card.senderName}</strong>
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{card.senderEmail}</span>
                  </p>
                  {card.recipientName && (
                    <p>
                      <span className="text-muted-foreground">Para:</span>{" "}
                      <strong>{card.recipientName}</strong>
                    </p>
                  )}
                  <p className="text-lg font-bold text-primary pt-1">
                    Bs. {card.amount.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(card.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Comprobante
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Comprobante de Pago</DialogTitle>
                        <DialogDescription>
                          Gift Card de {card.senderName} por Bs. {card.amount.toFixed(2)}
                        </DialogDescription>
                      </DialogHeader>
                      {card.receiptUrl ? (
                        <div className="relative w-full h-[400px] border rounded-lg overflow-hidden mt-4">
                          <Image
                            src={card.receiptUrl}
                            alt="Comprobante de pago"
                            fill
                            sizes="(max-width: 768px) 100vw, 672px"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-muted/50 rounded-lg mt-4">
                          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground font-medium">No hay comprobante disponible</p>
                        </div>
                      )}
                      <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleVerification(card.id, "reject")}
                          disabled={processingId === card.id}
                        >
                          {processingId === card.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                          Rechazar
                        </Button>
                        <Button
                          onClick={() => handleVerification(card.id, "approve")}
                          disabled={processingId === card.id}
                        >
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
