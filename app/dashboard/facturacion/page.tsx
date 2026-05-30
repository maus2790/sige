import { getFacturacionConfig } from "@/app/actions/facturacion";
import { getSellerComprobantes } from "@/app/actions/comprobantes";
import { ComprobantesTable } from "@/components/facturacion/comprobantes-table";
import { FacturacionConfigForm } from "@/components/facturacion/facturacion-config-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ReceiptText } from "lucide-react";

export default async function FacturacionPage() {
  const { store, config } = await getFacturacionConfig();
  const [facturas, recibos, proformas] = await Promise.all([
    getSellerComprobantes("FACTURA"),
    getSellerComprobantes("RECIBO"),
    getSellerComprobantes("PROFORMA"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <ReceiptText className="h-7 w-7 text-primary" />
            Facturacion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Revisa documentos emitidos y administra tus parametros de emision.
          </p>
        </div>
        <Link href="/dashboard/facturacion/nuevo">
          <Button className="w-full gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuevo documento
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="facturas" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="recibos">Recibos</TabsTrigger>
          <TabsTrigger value="proformas">Proformas</TabsTrigger>
          <TabsTrigger value="configuracion">Configuracion</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas">
          <ComprobantesTable rows={facturas} emptyLabel="Todavia no emitiste facturas." />
        </TabsContent>

        <TabsContent value="recibos">
          <ComprobantesTable rows={recibos} emptyLabel="Todavia no emitiste recibos." />
        </TabsContent>

        <TabsContent value="proformas">
          <ComprobantesTable rows={proformas} emptyLabel="Todavia no generaste proformas." />
        </TabsContent>

        <TabsContent value="configuracion">
          <Card>
            <CardHeader>
              <CardTitle>Parametros de emision</CardTitle>
              <CardDescription>
                Estos datos alimentan la logica simulada del SIAT y las reglas comerciales por documento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FacturacionConfigForm storeName={store.name} initialConfig={config} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
