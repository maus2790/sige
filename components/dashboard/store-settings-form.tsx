"use client";

import { useState } from "react";
import { toggleStoreGiftCardsEnabled } from "@/app/actions/gift-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Gift } from "lucide-react";

interface StoreSettingsFormProps {
  initialGiftCardsEnabled: boolean;
}

export function StoreSettingsForm({ initialGiftCardsEnabled }: StoreSettingsFormProps) {
  const [giftCardsEnabled, setGiftCardsEnabled] = useState(initialGiftCardsEnabled);
  const [isLoading, setIsLoading] = useState(false);

  const handleGiftCardsToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const result = await toggleStoreGiftCardsEnabled(enabled);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setGiftCardsEnabled(enabled);
      toast.success(
        enabled
          ? "Gift Cards habilitado"
          : "Gift Cards deshabilitado"
      );
    } catch (error) {
      toast.error("No se pudo actualizar la configuración");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gift Cards Service */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Servicio de Gift Cards</CardTitle>
              <CardDescription>
                Habilita o deshabilita el servicio de gift cards de tu tienda
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-1">
              <Label className="text-base font-semibold">
                {giftCardsEnabled ? "Gift Cards Activo" : "Gift Cards Inactivo"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {giftCardsEnabled
                  ? "Los clientes pueden ver y comprar gift cards"
                  : "Los clientes no pueden ver ni comprar gift cards"}
              </p>
            </div>
            <Switch
              checked={giftCardsEnabled}
              onCheckedChange={handleGiftCardsToggle}
              disabled={isLoading}
            />
          </div>

          {/* Information Alert */}
          <div className={`p-4 rounded-lg border ${
            giftCardsEnabled
              ? "bg-blue-50 border-blue-200"
              : "bg-amber-50 border-amber-200"
          }`}>
            <div className="flex gap-3">
              {giftCardsEnabled ? (
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className={giftCardsEnabled ? "text-blue-800" : "text-amber-800"}>
                {giftCardsEnabled ? (
                  <div className="space-y-2">
                    <p className="font-semibold">Gift Cards está habilitado</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Los clientes pueden comprar gift cards de tu tienda</li>
                      <li>Puedes crear y gestionar plantillas de gift cards</li>
                      <li>Los clientes pueden transferir y regalar gift cards</li>
                      <li>Tienes acceso a la sección "Gift Cards" en el panel</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold">Gift Cards está deshabilitado</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Los clientes no verán gift cards de tu tienda</li>
                      <li>No puedes crear ni gestionar gift cards</li>
                      <li>Habilita esta opción para activar el servicio</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-sm">
            <p className="font-semibold">¿Qué es el servicio de Gift Cards?</p>
            <p className="text-muted-foreground">
              El servicio de gift cards te permite crear y gestionar tarjetas de regalo digitales que tus clientes
              pueden comprar, regalar y usar en tu tienda. Es una excelente herramienta para:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Aumentar las ventas durante temporadas</li>
              <li>Ofrecer un regalo único y flexible</li>
              <li>Fidelizar clientes</li>
              <li>Permitir transferencias y regalos personalizados</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future settings */}
      <Card className="opacity-50 pointer-events-none">
        <CardHeader>
          <CardTitle className="text-lg">Más opciones próximamente</CardTitle>
          <CardDescription>
            Estamos trabajando en más opciones de configuración
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

