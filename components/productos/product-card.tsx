"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ShoppingCart, Package, Loader2, CreditCard, ShoppingBag, Store, Globe, Pencil, Trash2, EyeOff } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { publishProductToMarket, unpublishProduct, deleteProduct } from "@/app/actions/products";

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
    storeId?: string | null;
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
  isStoreOwner?: boolean;
}

export function ProductCard({ product, isStoreOwner = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const { items } = useCart();
  const isInCart = items.some((item) => item.id === product.id);
  const [isLoading, setIsLoading] = useState(true);
  const mainImage = product.imageUrls?.[0] || null;
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      setIsClicked(!isClicked);
    } else {
      router.push(`/productos/${product.id}`);
    }
  };

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Deseas publicar este producto en el Market Shop para que todos puedan verlo y comprarlo?")) {
      try {
        await publishProductToMarket(product.id);
        toast.success("¡Producto publicado en el Market Shop con éxito!");
        router.refresh();
      } catch (error) {
        toast.error("Hubo un error al intentar publicar el producto.");
      }
    }
  };

  const handleUnpublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Deseas mover este producto a Borradores? Dejará de ser visible en el Market Shop.")) {
      try {
        await unpublishProduct(product.id);
        toast.success("Producto movido a Borradores.");
        router.refresh();
      } catch (error) {
        toast.error("Hubo un error al intentar despublicar el producto.");
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas ELIMINAR "${product.name}"? Esta acción es irreversible.`)) {
      try {
        await deleteProduct(product.id);
        toast.success("Producto eliminado correctamente.");
        router.refresh();
      } catch (error) {
        toast.error("Hubo un error al intentar eliminar el producto.");
      }
    }
  };

  const isDraft = product.comercialConfig?.isPublished === false;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col overflow-hidden transition-all duration-500 shadow-md hover:shadow-2xl dark:shadow-[0_0_20px_rgba(37,99,235,0.12)] dark:hover:shadow-[0_0_35px_rgba(37,99,235,0.25)] cursor-pointer h-full border border-white/20 dark:border-white/10 rounded-2xl bg-card/50 backdrop-blur-md ${isClicked ? "ring-2 ring-primary ring-offset-2" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsClicked(false);
      }}
    >
        {/* Ribbons */}
        <div className="absolute top-0 right-0 z-30 pointer-events-none w-32 h-32 overflow-hidden">
          {isDraft ? (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black py-1.5 w-[150%] text-center rotate-45 translate-x-[30%] translate-y-[20%] shadow-md uppercase tracking-tighter">
              Borrador
            </div>
          ) : product.inventory?.stockActual === 0 ? (
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

        {/* Imagen */}
        <Link 
          href={`/productos/${product.id}`}
          onClick={(e) => e.stopPropagation()}
          className="aspect-4/3 relative overflow-hidden bg-muted block cursor-pointer"
        >
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
        </Link>

        <CardContent className="p-3">
          <h3 className="font-bold text-sm line-clamp-1 mb-1 leading-tight">
            {product.name}
          </h3>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 leading-snug">
            {product.description || "Sin descripción"}
          </p>
          <div className="flex flex-col">
            {product.comercialConfig?.precioOferta ? (
              <>
                <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                  Bs. {product.comercialConfig.precioVenta.toFixed(2)}
                </span>
                <span className="text-xl font-black text-brand-gradient">
                  Bs. {product.comercialConfig.precioOferta.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-brand-gradient">
                Bs. {product.comercialConfig?.precioVenta.toFixed(2) || "0.00"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
            <Eye className="w-2.5 h-2.5" />
            <span>{product.views || 0} visualizaciones</span>
          </div>
        </CardContent>

        {/* Botones flotantes */}
        <div
          className={`absolute bottom-[52px] left-0 right-0 p-4 bg-linear-to-t from-black/95 via-black/70 to-transparent dark:from-primary/40 dark:via-background/95 dark:to-transparent dark:backdrop-blur-[1px] transition-all duration-300 flex flex-col gap-2 z-40 ${isHovered || isClicked ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
            }`}
        >
          <div className="flex flex-col gap-1.5 w-full animate-in slide-in-from-bottom-4 duration-500">
            {isStoreOwner ? (
              /* Modo dueño de tienda */
              <>
                <Button
                  className="w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-wider bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-900/50 shadow-sm backdrop-blur-sm cursor-pointer"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/productos/${product.id}`);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Ver Detalles
                </Button>

                {isDraft ? (
                  <Button
                    className="w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-wider bg-brand-gradient text-white hover:brightness-110 shadow-lg cursor-pointer border-none"
                    onClick={handlePublish}
                  >
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    Publicar en Market Shop
                  </Button>
                ) : (
                  <Button
                    className="w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-wider bg-yellow-50/80 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50 shadow-sm backdrop-blur-sm cursor-pointer"
                    variant="outline"
                    onClick={handleUnpublish}
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                    Pasar a Borradores
                  </Button>
                )}
              </>
            ) : (
              /* Modo cliente */
              <>
                <Button
                  className="w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-wider bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-900/50 shadow-sm backdrop-blur-sm cursor-pointer"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/productos/${product.id}`);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Ver Detalles
                </Button>

                <AddToCartButton
                  product={product}
                  variant="outline"
                  size="sm"
                  showText={true}
                  className={cn(
                    "w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm backdrop-blur-sm cursor-pointer",
                    isInCart
                      ? "bg-red-50/80 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50 dark:hover:bg-red-900/50"
                      : "bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-900/50"
                  )}
                />

                <Button
                  className="w-full h-9 rounded-xl font-black text-[10px] uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 shadow-md shadow-orange-500/20 cursor-pointer border-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/cart?checkout=${product.id}`);
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                  Comprar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <CardFooter className="p-3 bg-card border-t mt-auto relative z-50 h-[52px] flex-none">
          <div className="flex justify-between w-full items-center">
            {isStoreOwner ? (
              /* Footer del dueño: Editar + Eliminar */
              <>
                <button
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/productos?edit=${product.id}`);
                  }}
                >
                  <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Editar</span>
                </button>
                <div className="flex items-center gap-4">
                  <button
                    className="text-muted-foreground hover:text-red-500 transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                    onClick={handleDelete}
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-green-500 transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = encodeURIComponent(window.location.origin + `/productos/${product.id}`);
                      const text = encodeURIComponent(`¡Mira este producto en SIGE!\n${product.name}`);
                      window.open(`https://wa.me/?text=${text}%0A${url}`, '_blank');
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              /* Footer del cliente: Ir a tienda + Me gusta + Compartir */
              <>
                <button
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.storeId) {
                      router.push(`/tienda/${product.storeId}`);
                    }
                  }}
                >
                  <Store className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Ir a tienda</span>
                </button>
                <div className="flex items-center gap-4">
                  <button
                    className="text-muted-foreground hover:text-red-500 transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implementar favoritos
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-green-500 transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = encodeURIComponent(window.location.origin + `/productos/${product.id}`);
                      const text = encodeURIComponent(`¡Mira este producto en SIGE!\n${product.name}`);
                      window.open(`https://wa.me/?text=${text}%0A${url}`, '_blank');
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </CardFooter>
    </div>
  );
}