import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssistantStats } from "@/app/actions/orders";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function AssistantHomePage() {
  const stats = await getAssistantStats();

  const statCards = [
    {
      title: "Pagos Pendientes",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Verificados Hoy",
      value: stats.verifiedToday,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10 border-green-500/20",
    },
    {
      title: "Total Verificados",
      value: stats.totalVerified,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10 border-primary/20",
    },
    {
      title: "Total Rechazados",
      value: stats.totalRejected,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10 border-destructive/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido al panel del asistente. Gestiona las verificaciones de pago.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={stat.bgColor}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
              <h3 className="font-semibold mb-2">📋 Verificación de Pagos</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Revisa los comprobantes de pago subidos por los compradores y
                verifica que coincidan con el monto de la orden.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
              <h3 className="font-semibold mb-2">⚠️ Rechazo de Pagos</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Si el comprobante no es válido o no coincide, puedes rechazar
                el pago y dejar una nota explicativa.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Revisar comprobante</p>
                  <p className="text-sm text-muted-foreground">
                    Verifica que el nombre del comprador coincida
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Validar monto</p>
                  <p className="text-sm text-muted-foreground">
                    Confirma que el monto pagado sea el correcto
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Aprobar o rechazar</p>
                  <p className="text-sm text-muted-foreground">
                    Selecciona la acción correspondiente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}