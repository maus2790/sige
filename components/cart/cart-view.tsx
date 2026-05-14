"use client";

import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  Store, 
  Package, 
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function CartView() {
  const [mounted, setMounted] = useState(false);
  const cart = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Group items by store
  const itemsByStore = cart.items.reduce((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = {
        storeName: item.storeName,
        items: []
      };
    }
    acc[item.storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string, items: typeof cart.items }>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(price);
  };

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-48 h-48 mb-8 relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
          <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl border border-white/20 relative z-10">
            <ShoppingCart className="w-24 h-24 text-blue-500 opacity-80" />
          </div>
        </div>
        <h1 className="text-3xl font-black mb-2 text-center">Tu carrito está vacío</h1>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Explora nuestro mercado y descubre los mejores productos de vendedores verificados.
        </p>
        <Link href="/">
          <Button className="h-14 px-8 rounded-2xl bg-brand-gradient text-white shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all text-lg font-bold gap-2">
            <Package className="w-5 h-5" />
            Explorar Mercado
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-48 md:pb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-black tracking-tight">Mi Carrito</h1>
        <div className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-sm">
          {cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'artículo' : 'artículos'}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-6">
          {Object.entries(itemsByStore).map(([storeId, store]) => (
            <div key={storeId} className="bg-card rounded-3xl border shadow-sm overflow-hidden group">
              {/* Store Header */}
              <div className="bg-muted/30 px-6 py-4 flex items-center gap-3 border-b">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-md text-white">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vendedor</p>
                  <Link href={`/tienda/${storeId}`} className="font-bold text-lg hover:text-primary transition-colors truncate block">
                    {store.storeName}
                  </Link>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y">
                {store.items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-white dark:bg-zinc-950 hover:bg-muted/10 transition-colors">
                    {/* Product Image */}
                    <Link href={`/producto/${item.id}`} className="shrink-0 relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border shadow-sm group-hover:shadow-md transition-shadow block bg-muted">
                      {item.imageUrl ? (
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </Link>

                    {/* Product Info & Controls */}
                    <div className="flex-1 min-w-0 w-full flex flex-col sm:flex-row gap-4 sm:items-center">
                      <div className="flex-1 min-w-0">
                        <Link href={`/producto/${item.id}`}>
                          <h3 className="font-bold text-lg truncate hover:text-primary transition-colors">{item.name}</h3>
                        </Link>
                        <p className="text-primary font-black text-xl mt-1">{formatPrice(item.price)}</p>
                        {item.quantity === item.maxStock && (
                          <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Stock máximo alcanzado
                          </p>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end w-full sm:w-auto">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-2xl p-1 border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-10 text-center font-bold text-lg">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="font-black text-lg hidden sm:block text-brand-gradient">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-8 px-2"
                            onClick={() => cart.removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-card rounded-3xl border shadow-xl p-6 sticky top-24">
            <h2 className="text-xl font-black mb-6">Resumen del pedido</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="font-medium">Subtotal ({cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'item' : 'items'})</span>
                <span className="font-bold text-foreground">{formatPrice(cart.getTotalPrice())}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="font-medium">Envío estimado</span>
                <span className="font-bold text-foreground">Por calcular</span>
              </div>
            </div>

            <Separator className="mb-6 opacity-50" />

            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold">Total</span>
              <span className="text-4xl font-black text-brand-gradient">{formatPrice(cart.getTotalPrice())}</span>
            </div>

            <Button className="w-full h-14 rounded-2xl bg-brand-gradient text-white shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all text-lg font-bold gap-2">
              <CreditCard className="w-5 h-5" />
              Proceder al Pago
            </Button>

            <p className="text-center text-[11px] text-muted-foreground mt-5 flex items-center justify-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Los costos de envío se calcularán en el checkout
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Checkout Bar */}
      <div className="md:hidden fixed bottom-[64px] left-0 right-0 z-30 bg-background/95 backdrop-blur-lg border-t border-primary/10 p-4 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)] pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total a pagar</span>
            <span className="text-2xl font-black text-brand-gradient leading-none">{formatPrice(cart.getTotalPrice())}</span>
          </div>
          <Button className="flex-1 h-12 rounded-xl bg-brand-gradient text-white shadow-premium active:scale-95 transition-all font-bold gap-2">
            <CreditCard className="w-4 h-4" />
            Proceder al Pago
          </Button>
        </div>
      </div>
    </div>
  );
}
