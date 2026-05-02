"use client";

import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight, 
  ChevronLeft,
  Loader2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export function CartClient() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 animate-pulse">
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Tu carrito está vacío</h1>
        <p className="text-muted-foreground max-w-xs mb-8">
          Parece que aún no has añadido nada a tu carrito de compras.
        </p>
        <Link href="/">
          <Button className="rounded-full px-8 h-12 font-bold bg-brand-gradient border-0">
            Explorar Mercado
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <div className="flex items-center gap-2 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Mi Carrito</h1>
        <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none font-bold">
          {items.length} {items.length === 1 ? 'producto' : 'productos'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-card">
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                  <Image
                    src={item.imageUrls?.[0] || "/placeholder-product.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.category}</p>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center bg-muted/50 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="p-1 hover:bg-background rounded-md transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-background rounded-md transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Precio unitario: Bs. {item.price}</p>
                      <p className="font-black text-xl text-primary">Bs. {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <Button 
            variant="ghost" 
            className="w-full py-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl border-2 border-dashed transition-all"
            onClick={clearCart}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Vaciar Carrito
          </Button>
        </div>

        {/* Resumen de Compra */}
        <div className="lg:col-span-1">
          <Card className="p-6 rounded-3xl border-none shadow-premium bg-card sticky top-24">
            <h2 className="text-xl font-black mb-6 tracking-tight">Resumen de Compra</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-bold text-foreground">Bs. {getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span className="text-green-500 font-bold uppercase text-xs bg-green-500/10 px-2 py-1 rounded-md">Gratis</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black text-primary">Bs. {getTotalPrice().toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl bg-brand-gradient text-white border-0 font-black text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group"
              disabled={isCheckingOut}
            >
              Finalizar Compra
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              Impuestos incluidos. Pago seguro garantizado.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}
