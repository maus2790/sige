"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Package, Loader2, ShoppingCart, Globe, Pencil, Trash2, EyeOff, MapPin } from "lucide-react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { publishProductToMarket, unpublishProduct, deleteProduct } from "@/app/actions/products";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "next-auth/react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    status?: string | null;
    createdAt: Date | string | null;
    imageUrls: string[] | null;
    imageUrlsThumb?: string[] | null;
    imageUrlsOg?: string[] | null;
    views: number | null;
    storeId?: string | null;
    store?: {
      name: string | null;
      phone: string | null;
    } | null;
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
  const pathname = usePathname();
  const isFromStore = pathname.startsWith('/tienda');
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const cart = useCart();
  // Prefer Feed (1200×900, 4:3) for marketplace cards to show full height; fall back to OG or thumb
  const mainImage = product.imageUrls?.[0] || product.imageUrlsOg?.[0] || product.imageUrlsThumb?.[0] || null;
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === "superadmin";
  const canManage = isStoreOwner || isSuperAdmin;

  const router = useRouter();
  const isInCart = cart.items.some(item => item.id === product.id);

  const handleCardClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) {
      setIsClicked(!isClicked);
    }
  };

  const handlePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Deseas publicar este producto en el Market Shop para que todos puedan verlo y comprarlo?")) {
      startTransition(async () => {
        try {
          await publishProductToMarket(product.id);
          toast.success("¡Producto publicado en el Market Shop con éxito!");
          window.dispatchEvent(new CustomEvent('product-status-changed'));
          router.refresh();
        } catch (error) {
          toast.error("Hubo un error al intentar publicar el producto.");
        }
      });
    }
  };

  const handleUnpublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("¿Deseas mover este producto a Borradores? Dejará de ser visible en el Market Shop.")) {
      startTransition(async () => {
        try {
          await unpublishProduct(product.id);
          toast.success("Producto movido a Borradores.");
          window.dispatchEvent(new CustomEvent('product-status-changed'));
          router.refresh();
        } catch (error) {
          toast.error("Hubo un error al intentar despublicar el producto.");
        }
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas ELIMINAR "${product.name}"? Esta acción es irreversible.`)) {
      startTransition(async () => {
        try {
          await deleteProduct(product.id);
          toast.success("Producto eliminado correctamente.");
          window.dispatchEvent(new CustomEvent('product-status-changed'));
          router.refresh();
        } catch (error) {
          toast.error("Hubo un error al intentar eliminar el producto.");
        }
      });
    }
  };

  const isDraft = product.comercialConfig?.isPublished === false;
  const productPrice = product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || product.price || 0;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col overflow-hidden transition-all duration-500 shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_20px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_0_40px_rgba(37,99,235,0.3)] cursor-pointer h-full border border-white/20 dark:border-white/10 rounded-3xl bg-card/50 backdrop-blur-md ${isClicked ? "ring-4 ring-blue-500/50 ring-offset-4 dark:ring-offset-zinc-950" : ""}`}
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

        {/* Badges de estado y stock (Izquierda) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          {/* Badge de stock bajo - PRIORIDAD */}
          {(product.inventory?.stockActual ?? 0) < (product.inventory?.stockMinimo ?? 5) && (product.inventory?.stockActual ?? 0) > 0 && (
            <Badge variant="destructive" className="text-[9px] font-bold px-2 py-0.5 border-none shadow-lg w-fit">
              ¡Solo {product.inventory?.stockActual}!
            </Badge>
          )}

          {/* Badge de estado (Refabricado, etc) */}
          {product.status && product.status !== "Nuevo" && (
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-black/50 text-white border-none backdrop-blur-md w-fit">
              {product.status}
            </Badge>
          )}
        </div>

        {/* Contenedor de Imagen y Botón de Carrito */}
        <div className="aspect-4/3 relative overflow-hidden bg-muted block">
          <Link 
            href={`/productos/${product.id}${isFromStore ? '?from=store' : ''}`}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full block cursor-pointer"
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
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover blur-xl opacity-20 scale-110 z-0"
                  aria-hidden="true"
                />
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`w-full h-full object-contain p-0 transition-transform duration-500 z-10 ${isHovered || isClicked ? "scale-110" : "scale-105"
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

          {/* Botón Añadir al Carrito Rápido - Movido fuera del Link */}
          {!isStoreOwner && !isDraft && (product.inventory?.stockActual ?? 0) > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (isInCart) {
                  cart.removeItem(product.id);
                  toast.info("Producto eliminado del carrito");
                } else {
                  const activePrice = product.comercialConfig?.precioOferta 
                    ? product.comercialConfig.precioOferta 
                    : (product.comercialConfig?.precioVenta || 0);

                  cart.addItem({
                    id: product.id,
                    name: product.name,
                    price: activePrice,
                    imageUrl: product.imageUrls?.[0] || "",
                    quantity: 1,
                    storeId: product.storeId || "",
                    storeName: product.store?.name || "Vendedor",
                    maxStock: product.inventory?.stockActual || 0
                  });

                  toast.success("¡Producto añadido al carrito!");
                }
              }}
              className={cn(
                "absolute bottom-2 right-2 w-9 h-9 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center transition-all z-30 border",
                isInCart
                  ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/20 scale-110"
                  : "bg-white/90 dark:bg-zinc-900/90 text-blue-600 dark:text-blue-400 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 border-white/20"
              )}
            >
              <ShoppingCart className={cn("w-4 h-4", isInCart && "fill-current")} />
            </button>
          )}

          {/* Botón Ver en Mapa (Inferior Izquierda) */}
          {/* Botón Ver en el Mapa - Solo para compradores */}
          {!isStoreOwner && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/mapa?q=${encodeURIComponent(product.name)}&r=0`);
              }}
              className="absolute bottom-2 left-2 w-9 h-9 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center transition-all z-30 border bg-white/90 dark:bg-zinc-900/90 text-blue-600 dark:text-blue-400 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 border-white/20"
              title="Ver en el mapa"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>

        <CardContent className="p-2 pb-1.5">
          <h3 className="font-bold text-sm line-clamp-1 mb-1.5 leading-tight">
            {product.name}
          </h3>
          <div className="flex flex-col">
            {product.comercialConfig?.precioOferta ? (
              <>
                <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                  Bs. {product.comercialConfig.precioVenta.toFixed(2)}
                </span>
                <span className="text-xl font-black text-blue-gradient py-0.5">
                  Bs. {product.comercialConfig.precioOferta.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-blue-gradient py-0.5">
                Bs. {product.comercialConfig?.precioVenta.toFixed(2) || "0.00"}
              </span>
            )}
          </div>
        </CardContent>

        <div
          className={`absolute ${canManage ? 'bottom-[48px]' : 'bottom-0'} left-0 right-0 px-3 py-2 bg-linear-to-t from-black/95 via-black/70 to-transparent dark:from-primary/40 dark:via-background/95 dark:to-transparent dark:backdrop-blur-[1px] transition-all duration-300 flex flex-col gap-1 z-40 ${isHovered || isClicked ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
            }`}
        >
          <div className="flex flex-col gap-1 w-full animate-in slide-in-from-bottom-4 duration-500">
            {canManage ? (
              /* Modo dueño de tienda o SuperAdmin */
              <>
                  <Button
                    className="w-full h-7 rounded-lg font-black text-[9px] uppercase tracking-wider bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-900/50 shadow-sm backdrop-blur-sm cursor-pointer"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetUrl = `/productos/${product.id}${isFromStore ? '?from=store' : ''}`;
                      router.push(targetUrl);
                    }}
                  >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver Detalles
                </Button>

                {isDraft ? (
                  <Button
                    className="w-full h-7 rounded-lg font-black text-[9px] uppercase tracking-wider bg-brand-gradient text-white hover:brightness-110 shadow-lg cursor-pointer border-none"
                    onClick={handlePublish}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Globe className="w-3 h-3 mr-1" />}
                    Publicar en Market Shop
                  </Button>
                ) : (
                  <Button
                    className="w-full h-7 rounded-lg font-black text-[9px] uppercase tracking-wider bg-yellow-50/80 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50 shadow-sm backdrop-blur-sm cursor-pointer"
                    variant="outline"
                    onClick={handleUnpublish}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <EyeOff className="w-3 h-3 mr-1" />}
                    Pasar a Borradores
                  </Button>
                )}
              </>
            ) : (
              /* Modo cliente */
              <>
                <Button
                  className="w-full h-7 rounded-lg font-black text-[9px] uppercase tracking-wider bg-white/90 text-slate-800 border-slate-200 hover:bg-white dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm cursor-pointer"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetUrl = `/productos/${product.id}${isFromStore ? '?from=store' : ''}`;
                    router.push(targetUrl);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver Detalles
                </Button>

                <a
                  href={`https://wa.me/${(product.store?.phone || "59173214036").replace(/\D/g, '')}?text=${encodeURIComponent(
                    `*PEDIDO DE PRODUCTO SIGE*\n\n` +
                    `*Producto:* ${product.name}\n` +
                    `*Precio:* Bs. ${productPrice.toFixed(2)}\n` +
                    `*Tienda:* ${product.store?.name || "SIGE Market"}\n` +
                    `*Link:* https://sige.click/productos/${product.id}\n\n` +
                    `*Imagen:* ${product.imageUrls?.[0]?.startsWith('http') ? product.imageUrls[0] : `https://sige.click${product.imageUrls?.[0]}`}\n\n` +
                    `Hola, estoy interesado en este producto.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full"
                >
                  <Button
                    className="w-full h-7 rounded-lg font-black text-[9px] uppercase tracking-wider bg-whatsapp-gradient text-white hover:brightness-110 shadow-md shadow-emerald-500/20 cursor-pointer border-none"
                  >
                    <WhatsAppIcon className="w-3 h-3 mr-1" />
                    Comprar por WhatsApp
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>

        {/* Footer solo para el dueño o SuperAdmin */}
        {canManage && (
          <div className="border-t mt-auto relative z-50 h-[48px] flex-none overflow-hidden bg-muted/30 backdrop-blur-md">
            <div className="flex w-full h-full divide-x divide-border/50">
              <button
                className="flex-1 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('open-publish-modal', { detail: product }));
                }}
              >
                <Pencil className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider">Editar</span>
              </button>
              
              <button
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/5 transition-all group cursor-pointer",
                  isPending && "opacity-50 pointer-events-none"
                )}
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-black uppercase tracking-wider">Eliminar</span>
              </button>
            </div>
          </div>
        )}
    </div>
  );
}