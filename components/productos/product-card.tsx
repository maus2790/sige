"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ShoppingCart, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    status?: string | null;
    createdAt: Date | string | null;
    imageUrls: string[] | null;
    views: number | null;
    inventory?: {
      stockActual: number;
      stockMinimo: number;
    } | null;
    comercialConfig?: {
      precioVenta: number;
      precioOferta: number | null;
      ofertaPorcentaje: number | null;
      isPublished: boolean | null;
      esDestacado: boolean | null;
      fechaFinOferta?: Date | string | null;
      limiteCompra?: number | null;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const { items } = useCart();
  const isInCart = items.some((item) => item.id === product.id);
  const [isLoading, setIsLoading] = useState(true);
  const mainImage = product.imageUrls?.[0] || null;
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // En móviles, el primer click muestra opciones. El segundo o click en botón navega.
    if (window.innerWidth < 768) {
      if (!isClicked) {
        e.preventDefault();
        e.stopPropagation();
        setIsClicked(true);
      }
    } else {
      router.push(`/productos/${product.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden transition-all duration-500 shadow-md hover:shadow-2xl dark:shadow-[0_0_20px_rgba(37,99,235,0.12)] dark:hover:shadow-[0_0_35px_rgba(37,99,235,0.25)] cursor-pointer h-full border border-white/20 dark:border-white/10 rounded-2xl bg-card/50 backdrop-blur-md ${isClicked ? "ring-2 ring-primary ring-offset-2" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsClicked(false);
      }}
    >
        {/* Ribbons */}
        <div className="absolute top-0 right-0 z-30 pointer-events-none w-32 h-32 overflow-hidden">
          {product.inventory?.stockActual === 0 ? (
            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black py-1.5 w-[150%] text-center rotate-45 translate-x-[30%] translate-y-[20%] shadow-md uppercase tracking-tighter">
              Agotado
            </div>
          ) : product.comercialConfig?.precioOferta ? (
            <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[10px] font-black py-1.5 w-[150%] text-center rotate-45 translate-x-[30%] translate-y-[20%] shadow-md uppercase tracking-tighter">
              {product.comercialConfig.ofertaPorcentaje || 0}% OFF
            </div>
          ) : (product.createdAt && new Date().getTime() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000) ? (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black py-1.5 w-[150%] text-center rotate-45 translate-x-[30%] translate-y-[20%] shadow-md uppercase tracking-tighter">
              Nuevo
            </div>
          ) : null}
        </div>

        {/* Badge de estado (Izquierda) */}
        {product.status && product.status !== "Nuevo" && (
          <div className="absolute top-3 left-3 z-20">
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-black/50 text-white border-none backdrop-blur-md">
              {product.status}
            </Badge>
          </div>
        )}

        {/* Badge de stock bajo */}
        {(product.inventory?.stockActual ?? 0) < (product.inventory?.stockMinimo ?? 5) && (product.inventory?.stockActual ?? 0) > 0 && (
          <div className="absolute top-10 left-3 z-20">
            <Badge variant="destructive" className="text-[9px] font-bold px-2 py-0.5 border-none shadow-lg">
              ¡Solo {product.inventory?.stockActual}!
            </Badge>
          </div>
        )}

        {/* Imagen - Reducida de aspect-square a aspect-4/3 */}
        <div className="aspect-4/3 relative overflow-hidden bg-muted">
          {mainImage ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              <Image
                src={mainImage}
                alt={product.name}
                width={400}
                height={300}
                className={`w-full h-full object-cover transition-transform duration-500 ${isHovered || isClicked ? "scale-110" : "scale-100"
                  } ${isLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setIsLoading(false)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="w-12 h-12" />
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1 mb-2">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description || "Sin descripción"}
          </p>
          <div className="flex flex-col">
            {product.comercialConfig?.precioOferta ? (
              <>
                <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                  Bs. {product.comercialConfig.precioVenta.toFixed(2)}
                </span>
                <span className="text-2xl font-black text-brand-gradient">
                  Bs. {product.comercialConfig.precioOferta.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-black text-brand-gradient">
                Bs. {product.comercialConfig?.precioVenta.toFixed(2) || "0.00"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Eye className="w-3 h-3" />
            <span>{product.views || 0} visualizaciones</span>
          </div>
        </CardContent>

        {/* Botones flotantes (Revertido a animación desde abajo con degradado) */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/95 via-black/70 to-transparent dark:from-primary/40 dark:via-background/95 dark:to-transparent dark:backdrop-blur-[1px] transition-all duration-300 flex flex-col gap-2 z-40 ${isHovered || isClicked ? "translate-y-0" : "translate-y-full"
            }`}
        >
          <div className="flex flex-col gap-2 w-full animate-in slide-in-from-bottom-4 duration-500">
            <Button 
              className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-wider bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-900/50 shadow-sm backdrop-blur-sm cursor-pointer" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/productos/${product.id}`);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalles
            </Button>
            
            <AddToCartButton 
              product={product} 
              variant="outline"
              size="default" 
              showText={true}
              className={cn(
                "w-full h-11 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm backdrop-blur-sm cursor-pointer",
                isInCart 
                  ? "bg-red-50/80 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50 dark:hover:bg-red-900/50" 
                  : "bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-900/50"
              )}
            />
          </div>

          {/* Botón para cerrar en móvil */}
          <button
            className="md:hidden text-white/60 text-[9px] font-bold uppercase tracking-[0.2em] py-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsClicked(false);
            }}
          >
            Cerrar opciones
          </button>
        </div>

        {/* Botón de favorito (corazón) - Oculto en móviles para simplificar */}
        <button
          className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-accent hidden md:block z-30"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Implementar favoritos
          }}
        >
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" />
        </button>

        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground border-t mt-2">
          <div className="flex justify-between w-full">
            <span>Envío seguro</span>
            <span>Pago QR</span>
          </div>
        </CardFooter>
    </div>
  );
}