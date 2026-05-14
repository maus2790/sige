import { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Carrito de Compras | SIGE Mercado",
  description: "Revisa los productos en tu carrito de compras",
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background">
      <CartView />
    </main>
  );
}
