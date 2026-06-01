"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    storeId?: string | null;
    imageUrls?: string[] | null;
    inventory?: { stockActual?: number | null } | null;
    comercialConfig?: {
      precioVenta?: number | null;
      precioOferta?: number | null;
    } | null;
    store?: {
      name?: string | null;
    } | null;
  };
  className?: string;
  iconClassName?: string;
  label?: string;
  disabled?: boolean;
}

export function AddToCartButton({
  product,
  className,
  iconClassName,
  label = "Al Carrito",
  disabled = false,
}: AddToCartButtonProps) {
  const cart = useCart();
  const isInCart = cart.items.some((item) => item.id === product.id);
  const stock = product.inventory?.stockActual ?? 0;
  const activePrice = product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0;

  const handleAddToCart = () => {
    if (disabled || stock <= 0) {
      toast.error("Este producto no tiene stock disponible.");
      return;
    }

    if (isInCart) {
      cart.removeItem(product.id);
      toast.info("Producto eliminado del carrito");
      return;
    }

    cart.addItem({
      id: product.id,
      name: product.name,
      price: activePrice,
      imageUrl: product.imageUrls?.[0] || "",
      quantity: 1,
      storeId: product.storeId || "",
      storeName: product.store?.name || "Vendedor",
      maxStock: stock,
    });

    toast.success("Producto añadido al carrito");
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleAddToCart}
      disabled={disabled || stock <= 0}
      className={cn(
        "rounded-xl gap-2 font-bold border-2 transition-all",
        isInCart
          ? "product-card-cart-active bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
          : "text-primary border-primary/25 bg-primary/5 hover:bg-primary/10 hover:text-primary",
        className
      )}
    >
      <ShoppingCart className={cn("w-4 h-4 shrink-0", isInCart && "fill-current", iconClassName)} />
      {isInCart ? "En Carrito" : label}
    </Button>
  );
}
