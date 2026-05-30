"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { updateFacturacionConfig, type FacturacionConfig } from "@/app/actions/facturacion";
import { Save } from "lucide-react";

interface FacturacionConfigFormProps {
  storeName: string;
  initialConfig: FacturacionConfig;
}

export function FacturacionConfigForm({ storeName, initialConfig }: FacturacionConfigFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<FacturacionConfig>(initialConfig);

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await updateFacturacionConfig(config);

      if (result.success) {
        toast.success("Configuracion de facturacion actualizada");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la configuracion");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Datos simulados</Badge>
        <span className="text-sm text-muted-foreground">{storeName}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nitEmpresa">NIT de la empresa</Label>
          <Input
            id="nitEmpresa"
            value={config.nitEmpresa}
            onChange={(event) => setConfig({ ...config, nitEmpresa: event.target.value })}
            placeholder="Ej: 1020309021"
          />
        </div>

        <div className="space-y-2">
          <Label>Regimen tributario</Label>
          <Select
            value={config.regimenTributario}
            onValueChange={(value: FacturacionConfig["regimenTributario"]) =>
              setConfig({ ...config, regimenTributario: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGIMEN_GENERAL">Regimen General</SelectItem>
              <SelectItem value="REGIMEN_SIMPLIFICADO">Regimen Simplificado</SelectItem>
              <SelectItem value="INFORMAL">Informal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenApiFacturacion">Token API de facturacion</Label>
          <Input
            id="tokenApiFacturacion"
            value={config.tokenApiFacturacion}
            onChange={(event) => setConfig({ ...config, tokenApiFacturacion: event.target.value })}
            placeholder="token-siat-simulado"
          />
        </div>

        <div className="space-y-2">
          <Label>Respuesta simulada del SIAT</Label>
          <Select
            value={config.simulacionSiat}
            onValueChange={(value: FacturacionConfig["simulacionSiat"]) =>
              setConfig({ ...config, simulacionSiat: value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXITOSA">Exitosa</SelectItem>
              <SelectItem value="RECHAZADA">Rechazada</SelectItem>
              <SelectItem value="SIN_CONEXION">Sin conexion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="precioFacturadoFactor">Factor precio facturado</Label>
          <Input
            id="precioFacturadoFactor"
            type="number"
            min="0.01"
            max="10"
            step="0.01"
            value={config.precioFacturadoFactor}
            onChange={(event) =>
              setConfig({ ...config, precioFacturadoFactor: parseFloat(event.target.value) || 1 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="precioReciboFactor">Factor precio recibo</Label>
          <Input
            id="precioReciboFactor"
            type="number"
            min="0.01"
            max="10"
            step="0.01"
            value={config.precioReciboFactor}
            onChange={(event) =>
              setConfig({ ...config, precioReciboFactor: parseFloat(event.target.value) || 0.9 })
            }
          />
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between rounded-md border p-4">
          <div className="space-y-1">
            <Label>Suscripcion activa</Label>
            <p className="text-sm text-muted-foreground">Habilita la emision simulada de facturas electronicas.</p>
          </div>
          <Switch
            checked={config.suscripcionActiva}
            onCheckedChange={(value) => setConfig({ ...config, suscripcionActiva: value })}
          />
        </div>

        <div className="flex items-center justify-between rounded-md border p-4">
          <div className="space-y-1">
            <Label>Proforma formal por defecto</Label>
            <p className="text-sm text-muted-foreground">Usa el precio facturado cuando el flujo no mande un precio solicitado.</p>
          </div>
          <Switch
            checked={config.proformaFormalPorDefecto}
            onCheckedChange={(value) => setConfig({ ...config, proformaFormalPorDefecto: value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar configuracion
        </Button>
      </div>
    </div>
  );
}
