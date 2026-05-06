import { getMyGiftCards } from "@/app/actions/gift-cards";
import { GiftCardList } from "@/components/dashboard/gift-cards/gift-card-list";
import { GiftCardCreator } from "@/components/dashboard/gift-cards/gift-card-creator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift } from "lucide-react";

export default async function GiftCardsPage() {
  const cards = await getMyGiftCards();

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Gift className="w-10 h-10 text-primary" />
            Tarjetas de Regalo
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Gestiona tus tarjetas de regalo emitidas y su saldo actual.
          </p>
        </div>
        <GiftCardCreator />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-premium bg-brand-gradient text-white overflow-hidden relative group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-80">Total Emitido</CardTitle>
            <CardDescription className="text-4xl font-black text-white">
              Bs. {cards.reduce((acc, card) => acc + card.initialAmount, 0).toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="border-none shadow-premium bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tarjetas Activas</CardTitle>
            <CardDescription className="text-4xl font-black text-foreground">
              {cards.filter(c => c.status === "active").length}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-premium bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Saldo Pendiente</CardTitle>
            <CardDescription className="text-4xl font-black text-primary">
              Bs. {cards.reduce((acc, card) => acc + card.currentBalance, 0).toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none shadow-premium">
        <CardHeader>
          <CardTitle>Listado de Tarjetas</CardTitle>
        </CardHeader>
        <CardContent>
          <GiftCardList initialCards={cards} />
        </CardContent>
      </Card>
    </div>
  );
}
