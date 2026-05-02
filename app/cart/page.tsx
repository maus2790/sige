import { CartClient } from "@/components/cart/cart-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Carrito - SIGE Mercado",
  description: "Revisa los productos en tu carrito y finaliza tu compra.",
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <CartClient />
    </main>
  );
}
