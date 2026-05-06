"use client";

import { useEffect, useState } from "react";
import { validateGiftCard } from "@/app/actions/gift-cards";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Cake, Heart, GraduationCap, PartyPopper, Copy, Check, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEMPLATES: Record<string, { icon: any, color: string, bg: string, darkBg: string, accent: string }> = {
  general: { 
    icon: Gift, 
    color: "text-blue-600 dark:text-blue-400", 
    bg: "bg-blue-50", 
    darkBg: "dark:bg-blue-950/20",
    accent: "bg-blue-600 dark:bg-blue-500" 
  },
  birthday: { 
    icon: Cake, 
    color: "text-pink-600 dark:text-pink-400", 
    bg: "bg-pink-50", 
    darkBg: "dark:bg-pink-950/20",
    accent: "bg-pink-600 dark:bg-pink-500" 
  },
  anniversary: { 
    icon: Heart, 
    color: "text-red-600 dark:text-red-400", 
    bg: "bg-red-50", 
    darkBg: "dark:bg-red-950/20",
    accent: "bg-red-600 dark:bg-red-500" 
  },
  graduation: { 
    icon: GraduationCap, 
    color: "text-indigo-600 dark:text-indigo-400", 
    bg: "bg-indigo-50", 
    darkBg: "dark:bg-indigo-950/20",
    accent: "bg-indigo-600 dark:bg-indigo-500" 
  },
  wedding: { 
    icon: PartyPopper, 
    color: "text-amber-600 dark:text-amber-400", 
    bg: "bg-amber-50", 
    darkBg: "dark:bg-amber-950/20",
    accent: "bg-amber-600 dark:bg-amber-500" 
  },
};

export default function GiftCardViewPage({ params }: { params: any }) {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params;
      setCode(resolvedParams.code);
      const result = await validateGiftCard(resolvedParams.code);
      if (result.success) {
        setCard(result.card);
      }
      setLoading(false);
    };
    fetchData();
  }, [params]);

  const copyCode = () => {
    if (card?.code) {
      navigator.clipboard.writeText(card.code);
      setCopied(true);
      toast.success("Código copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Abriendo tu regalo...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6">
          <Gift className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black mb-3">Tarjeta no encontrada</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">
          El código ingresado no es válido, ha expirado o ya ha sido utilizado por completo.
        </p>
        <Link href="/">
          <Button variant="default" size="lg" className="rounded-2xl px-8 h-14 font-bold shadow-lg">
            Ir al Mercado SIGE
          </Button>
        </Link>
      </div>
    );
  }

  const tpl = TEMPLATES[card.templateType || "general"] || TEMPLATES.general;
  const Icon = tpl.icon;

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 transition-colors duration-700",
      tpl.bg,
      tpl.darkBg
    )}>
      {/* Elementos decorativos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[100px]", tpl.accent)}></div>
        <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[100px]", tpl.accent)}></div>
      </div>

      <Card className="w-full max-w-lg border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden rounded-[2.5rem] bg-background/70 backdrop-blur-2xl relative z-10 animate-in fade-in zoom-in duration-700">
        
        {/* Banner Superior con Icono Flotante */}
        <div className={cn("h-40 flex items-center justify-center relative", tpl.accent)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-full shadow-inner animate-bounce duration-3000">
            <Icon className="w-14 h-14 text-white drop-shadow-lg" />
          </div>
        </div>

        <CardContent className="p-8 sm:p-10 text-center space-y-8">
          
          {/* Monto y Código - Estilo Premium */}
          <div className="-mt-24 bg-background dark:bg-slate-900 rounded-4xl p-8 shadow-xl relative z-10 border border-primary/5 dark:border-white/5">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Gift Card Recibida
            </span>
            <h2 className={cn("text-5xl sm:text-6xl font-black mb-6 tracking-tighter", tpl.color)}>
              Bs. {card.currentBalance.toFixed(2)}
            </h2>
            
            <div className="group relative">
              <div className="bg-muted/30 dark:bg-white/5 border border-dashed border-primary/20 dark:border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4 group-hover:bg-muted/50 transition-colors">
                <span className="font-mono font-black text-xl sm:text-2xl tracking-[0.15em] text-foreground">
                  {card.code}
                </span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="rounded-xl h-10 w-10 shrink-0" 
                  onClick={copyCode}
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 font-medium">
                Copia este código y úsalo en el carrito de compras.
              </p>
            </div>
          </div>

          {/* Mensaje de Dedicatoria */}
          {card.dedicationMessage && (
            <div className="space-y-3 py-4">
              <div className="flex justify-center">
                <div className="h-0.5 w-12 bg-primary/20 rounded-full"></div>
              </div>
              <p className="text-xl sm:text-2xl italic text-foreground/90 font-serif leading-relaxed px-2">
                "{card.dedicationMessage}"
              </p>
              <div className="flex justify-center">
                <div className="h-0.5 w-12 bg-primary/20 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Multimedia Interactiva */}
          <div className="grid grid-cols-1 gap-6">
            {card.photoUrl && (
              <div className="group relative w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden shadow-lg border-[6px] border-white dark:border-slate-800 rotate-1 hover:rotate-0 transition-all duration-500">
                <Image 
                  src={card.photoUrl} 
                  alt="Recuerdo especial" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            )}
            
            {card.videoUrl && (
              <div className="w-full rounded-3xl overflow-hidden shadow-2xl border-[6px] border-white dark:border-slate-800 bg-black -rotate-1 hover:rotate-0 transition-all duration-500 aspect-video">
                <video 
                  src={card.videoUrl} 
                  controls 
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              </div>
            )}
          </div>

          {/* Acción Final */}
          <div className="pt-8 space-y-4">
            <Link href="/" className="block">
              <Button className={cn(
                "w-full h-16 rounded-3xl font-black text-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all text-white border-none",
                tpl.accent
              )}>
                <ShoppingBag className="w-6 h-6 mr-3" />
                ¡Ir a comprar!
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground font-medium">
              Válido hasta el {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : "fin de los tiempos"}
            </p>
          </div>

        </CardContent>
      </Card>
      
      {/* Footer Branding */}
      <div className="mt-8 opacity-40 hover:opacity-100 transition-opacity">
        <Link href="/" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
          <ShoppingBag className="w-4 h-4" />
          <span className="text-xs font-black tracking-tighter uppercase">SIGE MERCADO</span>
        </Link>
      </div>
    </div>
  );
}
