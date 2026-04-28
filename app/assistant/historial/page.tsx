"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Eye } from "lucide-react";
import { getTransactionHistory } from "@/app/actions/orders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TransactionOrder {
  id: string;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  totalAmount: number;
  status: string;
  productName: string;
  storeName: string;
  paymentVerifiedBy: string;
  paymentVerifiedAt: Date;
  assistantNotes: string;
  createdAt: Date;
}

export default function HistorialPage() {
  const [orders, setOrders] = useState<TransactionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<TransactionOrder | null>(null);

  async function loadHistory() {
    setIsLoading(true);
    const data = await getTransactionHistory(page, 20, statusFilter);
    setOrders(data.orders as TransactionOrder[]);
    setPageCount(data.pageCount);
    setIsLoading(false);
  }

  useEffect(() => {
    loadHistory();
  }, [page, statusFilter]);

  const filteredOrders = orders.filter((order) =>
    searchTerm
      ? order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_payment: { label: "Pendiente", variant: "outline" },
      payment_verified: { label: "Verificado", variant: "default" },
      processing: { label: "Procesando", variant: "secondary" },
      shipped: { label: "Enviado", variant: "secondary" },
      delivered: { label: "Entregado", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial de Transacciones</h1>
        <p className="text-muted-foreground mt-1">
          Registro de todas las verificaciones de pago realizadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra las transacciones por estado o búsqueda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por comprador, producto o ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pending_payment">Pendiente</SelectItem>
                <SelectItem value="payment_verified">Verificado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
          <CardDescription>
            Total: {filteredOrders.length} transacciones encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay transacciones registradas
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tienda</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("es-BO")}
                        </TableCell>
                        <TableCell className="font-medium">{order.buyerName}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {order.productName}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {order.storeName}
                        </TableCell>
                        <TableCell>Bs. {order.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {pageCount > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm">
                    Página {page} de {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles de la Transacción</DialogTitle>
            <DialogDescription>
              Información completa de la verificación
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">ID de orden:</div>
                <div className="font-mono text-xs">{selectedOrder.id}</div>
                
                <div className="text-muted-foreground">Comprador:</div>
                <div>{selectedOrder.buyerName}</div>
                
                <div className="text-muted-foreground">Teléfono:</div>
                <div>{selectedOrder.buyerPhone}</div>
                
                <div className="text-muted-foreground">Cantidad:</div>
                <div>{selectedOrder.quantity} unidades</div>
                
                <div className="text-muted-foreground">Monto total:</div>
                <div className="font-bold">Bs. {selectedOrder.totalAmount.toFixed(2)}</div>
                
                <div className="text-muted-foreground">Estado:</div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              {selectedOrder.paymentVerifiedAt && (
                <>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Información de verificación</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Verificado por:</div>
                      <div>{selectedOrder.paymentVerifiedBy}</div>
                      <div className="text-muted-foreground">Fecha verificación:</div>
                      <div>{new Date(selectedOrder.paymentVerifiedAt).toLocaleString("es-BO")}</div>
                    </div>
                  </div>
                </>
              )}

              {selectedOrder.assistantNotes && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1">Notas del asistente:</p>
                  <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-lg">
                    {selectedOrder.assistantNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}