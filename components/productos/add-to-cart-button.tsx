"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: any;
  variant?: "default" | "outline" | "ghost" | "gradient" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
  label?: string;
}

export function AddToCartButton({ 
  product, 
  variant = "gradient", 
  size = "default", 
  className,
  showText = true,
}: AddToCartButtonProps) {
  const { items, addItem, removeItem } = useCart();
  const isInCart = items.some((item) => item.id === product.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInCart) {
      removeItem(product.id);
      toast.error(`${product.name} eliminado del carrito`, {
        duration: 2000,
      });
    } else {
      addItem(product);
      toast.success(`${product.name} añadido al carrito`, {
        icon: <ShoppingCart className="w-4 h-4 text-primary" />,
        duration: 2000,
      });
    }
  };

  return (
    <Button
      variant={isInCart ? "outline" : variant}
      size={size}
      className={cn(
        "transition-all duration-300 active:scale-95",
        isInCart && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50",
        className
      )}
      onClick={handleToggle}
    >
      <ShoppingCart className={cn("w-4 h-4", showText && "mr-2")} />
      {showText && (isInCart ? "Quitar del carrito" : "Añadir al carrito")}
    </Button>
  );
}
