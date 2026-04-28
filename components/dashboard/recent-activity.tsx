"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Package, ShoppingCart, CheckCircle, Truck, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: "order" | "product" | "payment" | "shipping";
  title: string;
  description: string;
  time: string;
  status?: string;
  productImage?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending_payment: { label: "Pendiente", variant: "destructive", icon: Clock },
  payment_verified: { label: "Verificado", variant: "default", icon: CheckCircle },
  processing: { label: "Procesando", variant: "secondary", icon: Package },
  shipped: { label: "Enviado", variant: "secondary", icon: Truck },
  delivered: { label: "Entregado", variant: "default", icon: CheckCircle },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Últimos movimientos de tu tienda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aún no hay actividad reciente</p>
            <p className="text-sm">Cuando recibas pedidos, aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
        <CardDescription>Últimos movimientos de tu tienda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {/* Icono de actividad */}
              <div className="shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  activity.type === "order" && "bg-blue-100 text-blue-600",
                  activity.type === "payment" && "bg-green-100 text-green-600",
                  activity.type === "shipping" && "bg-purple-100 text-purple-600",
                  activity.type === "product" && "bg-orange-100 text-orange-600"
                )}>
                  {activity.type === "order" && <ShoppingCart className="w-5 h-5" />}
                  {activity.type === "payment" && <CheckCircle className="w-5 h-5" />}
                  {activity.type === "shipping" && <Truck className="w-5 h-5" />}
                  {activity.type === "product" && <Package className="w-5 h-5" />}
                </div>
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{activity.title}</p>
                  {activity.status && statusConfig[activity.status] && (
                    <Badge variant={statusConfig[activity.status].variant} className="text-xs">
                      {statusConfig[activity.status].label}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>

              {/* Acción */}
              {activity.type === "order" && (
                <Link href="/dashboard/pedidos">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <Link href="/dashboard/pedidos">
            <Button variant="outline" size="sm">
              Ver todas las actividades
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper para cn (si no está importado)
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}