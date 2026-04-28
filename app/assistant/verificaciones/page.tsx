"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { getTransactionHistory, verifyPayment } from "@/app/actions/orders";
import { toast } from "sonner";

export default function VerificacionesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadPending() {
    setIsLoading(true);
    const data = await getTransactionHistory(1, 50, "pending_payment");
    setOrders(data.orders);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function handleVerification(orderId: string, action: "approve" | "reject") {
    setProcessingId(orderId);
    
    const formData = new FormData();
    formData.append("action", action);
    
    const result = await verifyPayment(orderId, formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      await loadPending();
    }
    
    setProcessingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificaciones Rápidas</h1>
        <p className="text-muted-foreground mt-1">
          Interface rápida para verificar pagos sin distracciones
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Sin verificaciones pendientes!</h3>
            <p className="text-muted-foreground">
              Todos los pagos han sido procesados correctamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.productName}</CardTitle>
                    <CardDescription>{order.storeName}</CardDescription>
                  </div>
                  <Badge variant="destructive">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Comprador:</span>{" "}
                    <strong>{order.buyerName}</strong>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Cantidad:</span>{" "}
                    {order.quantity} unidades
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Bs. {order.totalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleVerification(order.id, "reject")}
                    disabled={processingId === order.id}
                  >
                    {processingId === order.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleVerification(order.id, "approve")}
                    disabled={processingId === order.id}
                  >
                    {processingId === order.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    Verificar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}