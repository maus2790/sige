"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { emitirComprobante } from "@/app/actions/comprobantes";
import { Minus, Plus, ReceiptText, Search, Trash2 } from "lucide-react";

type ProductOption = {
  id: string;
  sku?: string | null;
  name?: string;
  category?: string | null;
  price?: number;
  stock?: number;
  comercialConfig?: {
    precioVenta?: number | null;
    precioOferta?: number | null;
  } | null;
};

type SelectedItem = {
  product: ProductOption;
  cantidad: number;
  precioSolicitado?: number;
};

interface ComprobanteFormProps {
  products: ProductOption[];
  facturacionConfig: {
    precioReciboFactor: number;
    precioFacturadoFactor: number;
    proformaFormalPorDefecto: boolean;
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(value);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function ComprobanteForm({ products, facturacionConfig }: ComprobanteFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [tipoDocumento, setTipoDocumento] = useState<"FACTURA" | "RECIBO" | "PROFORMA">("FACTURA");
  const [search, setSearch] = useState("");
  const [cliente, setCliente] = useState({
    nitCi: "",
    razonSocial: "",
    email: "",
  });
  const [clienteRechazaFactura, setClienteRechazaFactura] = useState(false);
  const [emitirProforma, setEmitirProforma] = useState(true);
  const [pagoGiftCard, setPagoGiftCard] = useState(0);
  const [pagoEfectivoQr, setPagoEfectivoQr] = useState(0);
  const [items, setItems] = useState<SelectedItem[]>([]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toUpperCase();
    if (!term) {
      return products.slice(0, 10);
    }

    return products
      .filter((product) => {
        const sku = (product.sku || "").toUpperCase();
        const productCode = sku.split("-")[1] || sku;
        return sku.includes(term) || productCode.includes(term) || (product.name || "").toUpperCase().includes(term);
      })
      .slice(0, 10);
  }, [products, search]);

  const montoTotal = items.reduce((total, item) => {
    const basePrice = item.product.comercialConfig?.precioOferta ?? item.product.price ?? 0;
    const precioVenta = item.product.price ?? basePrice;
    const precioFacturado = roundMoney(precioVenta * facturacionConfig.precioFacturadoFactor);
    const precioRecibo = roundMoney(basePrice * facturacionConfig.precioReciboFactor);
    const price = tipoDocumento === "PROFORMA" && item.precioSolicitado !== undefined
      ? item.precioSolicitado
      : tipoDocumento === "FACTURA"
        ? precioFacturado
        : tipoDocumento === "RECIBO"
          ? precioRecibo
          : facturacionConfig.proformaFormalPorDefecto
            ? precioFacturado
            : basePrice;
    return roundMoney(total + roundMoney(price * item.cantidad));
  }, 0);
  const totalPagado = tipoDocumento === "PROFORMA" ? 0 : roundMoney(pagoGiftCard + pagoEfectivoQr);
  const cambio = tipoDocumento === "PROFORMA" ? 0 : Math.max(0, roundMoney(totalPagado - montoTotal));
  const saldoPendiente = tipoDocumento === "PROFORMA" ? 0 : Math.max(0, roundMoney(montoTotal - totalPagado));

  function addProduct(product: ProductOption) {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }

      return [...current, { product, cantidad: 1 }];
    });
  }

  function updateQuantity(productId: string, cantidad: number) {
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, cantidad: Math.max(1, cantidad || 1) } : item
      )
    );
  }

  function removeProduct(productId: string) {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }

  async function handleSubmit() {
    if (items.length === 0) {
      toast.error("Agrega al menos un producto.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await emitirComprobante({
        tipoDocumento,
        cliente: {
          nitCi: cliente.nitCi,
          razonSocial: cliente.razonSocial,
          email: cliente.email || undefined,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          cantidad: item.cantidad,
          precioSolicitado: tipoDocumento === "PROFORMA" ? item.precioSolicitado : undefined,
        })),
        pagoGiftCard: tipoDocumento === "PROFORMA" ? 0 : pagoGiftCard,
        pagoEfectivoQr: tipoDocumento === "PROFORMA" ? 0 : pagoEfectivoQr,
        clienteRechazaFactura,
        emitirProforma,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`${tipoDocumento} generado correctamente`);
      router.push(`/dashboard/facturacion/${result.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "No se pudo generar el documento.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <div className="grid gap-4 rounded-md border bg-card p-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Documento</Label>
            <Select value={tipoDocumento} onValueChange={(value: "FACTURA" | "RECIBO" | "PROFORMA") => setTipoDocumento(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FACTURA">Factura</SelectItem>
                <SelectItem value="RECIBO">Recibo</SelectItem>
                <SelectItem value="PROFORMA">Proforma</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nitCi">NIT/CI</Label>
            <Input
              id="nitCi"
              value={cliente.nitCi}
              onChange={(event) => setCliente({ ...cliente, nitCi: event.target.value })}
              placeholder="Ej: 1234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="razonSocial">Razon social</Label>
            <Input
              id="razonSocial"
              value={cliente.razonSocial}
              onChange={(event) => setCliente({ ...cliente, razonSocial: event.target.value })}
              placeholder="Nombre del cliente"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={cliente.email}
              onChange={(event) => setCliente({ ...cliente, email: event.target.value })}
              placeholder="cliente@correo.com"
            />
          </div>

          {tipoDocumento === "RECIBO" && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="rechazaFactura" className="text-sm">Cliente rechaza factura</Label>
              <Switch id="rechazaFactura" checked={clienteRechazaFactura} onCheckedChange={setClienteRechazaFactura} />
            </div>
          )}

          {tipoDocumento === "PROFORMA" && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="emitirProforma" className="text-sm">Emitir ahora</Label>
              <Switch id="emitirProforma" checked={emitirProforma} onCheckedChange={setEmitirProforma} />
            </div>
          )}
        </div>

        <div className="rounded-md border bg-card">
          <div className="border-b p-4">
            <Label htmlFor="productSearch">Buscar producto</Label>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="productSearch"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o SKU de 4 digitos"
                className="pl-9"
              />
            </div>
          </div>

          <div className="divide-y">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{product.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {product.sku || "----"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stock {product.stock ?? 0} · {formatMoney(product.price ?? 0)}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => addProduct(product)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-md border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <ReceiptText className="h-4 w-4" />
            Detalle
          </h2>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Agrega productos para elaborar el documento.</p>
            ) : (
              items.map((item) => (
                <div key={item.product.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{item.product.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{item.product.sku}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeProduct(item.product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => updateQuantity(item.product.id, item.cantidad - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(event) => updateQuantity(item.product.id, parseInt(event.target.value) || 1)}
                      className="h-8 w-20 text-center"
                    />
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => updateQuantity(item.product.id, item.cantidad + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {tipoDocumento !== "PROFORMA" && (
          <div className="rounded-md border bg-card p-4">
            <h2 className="font-semibold">Pagos</h2>
            <div className="mt-4 grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="giftCard">Gift Card</Label>
                <Input
                  id="giftCard"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pagoGiftCard}
                  onChange={(event) => setPagoGiftCard(parseFloat(event.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="efectivoQr">Efectivo / QR</Label>
                <Input
                  id="efectivoQr"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pagoEfectivoQr}
                  onChange={(event) => setPagoEfectivoQr(parseFloat(event.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-4 rounded-md bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagado</span>
                <span>{formatMoney(totalPagado)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Cambio</span>
                <span className="font-semibold text-primary">{formatMoney(cambio)}</span>
              </div>
              {saldoPendiente > 0 && (
                <div className="mt-1 flex justify-between text-destructive">
                  <span>Falta</span>
                  <span>{formatMoney(saldoPendiente)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-md border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <span className="text-xl font-bold">{formatMoney(montoTotal)}</span>
          </div>
          <Button onClick={handleSubmit} loading={isSaving} className="mt-4 w-full">
            Generar documento
          </Button>
        </div>
      </div>
    </div>
  );
}
