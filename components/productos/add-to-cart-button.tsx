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
}

export function AddToCartButton({ 
  product, 
  variant = "gradient", 
  size = "default", 
  className,
  showText = true 
}: AddToCartButtonProps) {
  const addItem = useCart((state) => state.addItem);
  const [isAdded, setIsAdded] = React.useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem(product);
    setIsAdded(true);
    toast.success(`${product.name} añadido al carrito`, {
      icon: <ShoppingCart className="w-4 h-4 text-primary" />,
      duration: 2000,
    });

    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <Button
      variant={isAdded ? "secondary" : variant}
      size={size}
      className={cn(
        "transition-all duration-300 active:scale-95",
        isAdded && "bg-green-500/10 text-green-600 border-green-200",
        className
      )}
      onClick={handleAdd}
    >
      {isAdded ? (
        <>
          <CheckCircle2 className={cn("w-4 h-4", showText && "mr-2")} />
          {showText && "Añadido"}
        </>
      ) : (
        <>
          <ShoppingCart className={cn("w-4 h-4", showText && "mr-2")} />
          {showText && "Al carrito"}
        </>
      )}
    </Button>
  );
}
