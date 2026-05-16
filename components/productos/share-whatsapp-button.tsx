"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";

interface ShareWhatsAppButtonProps {
  productId: string;
  productName: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareWhatsAppButton({
  productId,
  productName,
  className,
  size = "default",
}: ShareWhatsAppButtonProps) {
  const handleShare = async () => {
    const shareUrl = `https://sige.click/productos/${productId}`;
    const shareText = `¡Mira este producto en SIGE!\n${productName}`;

    // Intentar usar la API nativa de compartir si está disponible
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error al compartir:", error);
        } else {
          return; // El usuario canceló la acción
        }
      }
    }

    // Fallback: Abrir WhatsApp directamente
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${text}%0A${url}`, "_blank");
  };

  return (
    <Button
      variant="outline"
      size={size}
      className={cn(
        "text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:hover:bg-primary/20 transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4 shrink-0" />
      Compartir
    </Button>
  );
}
