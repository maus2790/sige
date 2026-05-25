import { getProductById } from "@/app/actions/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageSquare, ShieldCheck, Truck, Store, Info, Mail, Phone, User as UserIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/productos/product-gallery";
import { ShareWhatsAppButton } from "@/components/productos/share-whatsapp-button";
import { cn } from "@/lib/utils";
import { ProductBackButton } from "@/components/productos/product-back-button";
import { getSystemConfig } from "@/app/actions/config";
import { cookies } from "next/headers";
import { db } from "@/db";
import { products, comercialConfig } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

import { Metadata, ResolvingMetadata } from "next";

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const activeProducts = await db
      .select({ id: products.id })
      .from(products)
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
      .where(eq(comercialConfig.isPublished, true))
      .orderBy(desc(products.createdAt))
      .limit(10)
      .all();

    return activeProducts.map((p) => ({
      id: p.id,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams for products:", error);
    return [];
  }
}

interface ProductoDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: ProductoDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Producto no encontrado | SIGE Market",
    };
  }

  const description = product.description || "Comprar este producto en SIGE Market";

  // Prefer OG-optimized image (1200×630), fall back to standard feed image
  const ogImages = (product.imageUrlsOg && product.imageUrlsOg.length > 0)
    ? product.imageUrlsOg
    : product.imageUrls || [];

  const toAbsolute = (url: string) =>
    url.startsWith("http") ? url : `https://sige.click${url}`;

  const primaryOgUrl = ogImages[0]
    ? toAbsolute(ogImages[0])
    : `https://sige.click/placeholder-product.png`;

  const price = product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0;

  const metadata: Metadata = {
    title: `${product.name} | Bs. ${price.toFixed(2)} | SIGE Market`,
    description: description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: description,
      url: `https://sige.click/productos/${id}`,
      siteName: 'SIGE Market',
      images: ogImages.map((url: string) => ({
        url: toAbsolute(url),
        width: 1200,
        height: 630,
        alt: product.name,
      })).length > 0 ? ogImages.map((url: string) => ({
        url: toAbsolute(url),
        width: 1200,
        height: 630,
        alt: product.name,
      })) : [{ url: primaryOgUrl, width: 1200, height: 630, alt: product.name }],
      locale: 'es_BO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: description,
      images: [primaryOgUrl],
    },
  };

  // Add video if available
  if (product.hasVideo && product.videoUrl) {
    const videoUrl = product.videoUrl.startsWith('http') 
      ? product.videoUrl 
      : `https://sige.click${product.videoUrl}`;
    
    // @ts-ignore - Some OG video properties might not be in the strict Metadata type but are valid
    metadata.openGraph!.videos = [
      {
        url: videoUrl,
        width: 1280,
        height: 720,
        // @ts-ignore
        type: product.videoType || 'video/mp4',
      },
    ];
  }

  return metadata;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export default async function ProductoDetailPage({ params }: ProductoDetailPageProps) {
  const { id } = await params;

  const config = await getSystemConfig();
  const isrMode = config.isrEnabled ? "ISR ⚡ Nivel 2" : "Dinamico 🔄";
  console.log(`[PAGE 📦] Renderizando Producto ID: ${id} | Modo: ${isrMode}`);

  if (!config.isrEnabled) {
    // Bypass: force dynamic rendering if ISR Nivel 2 is disabled
    await cookies();
  }

  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  console.log(`[PAGE 📦] Producto cargado: "${product!.name}" (Tienda: ${product!.storeId})`);
  const isOutOfStock = product.inventory?.stockActual === 0;
  const isPublished = product.comercialConfig?.isPublished ?? true;

  // Determinar la URL de regreso de forma robusta
  const effectiveStoreId = product.storeId || product.store?.id;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-20 relative">
      {/* Floating Glass Header */}
      <div className="sticky top-0 z-40 glass border-b shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_15px_rgba(37,99,235,0.15)] transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductBackButton storeId={effectiveStoreId} />
            <h1 className="font-bold text-lg truncate text-foreground max-w-[200px] sm:max-w-md">
              {product.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Botones en cabecera solo para Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <Link href={`/tienda/${product.storeId}`}>
                <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold h-10 px-4 border-2">
                  <Store className="w-4 h-4" />
                  Ir a Tienda
                </Button>
              </Link>
              <ShareWhatsAppButton
                productId={product.id}
                productName={product.name}
                className="h-10 px-4 rounded-xl border-2 text-sm font-bold gap-2"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-2 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Columna Izquierda: Galería de Imágenes - Sticky en Desktop, Scrollable en Móvil */}
          <div className="max-md:contents lg:col-span-7 md:sticky md:top-24 z-30 md:bg-transparent md:mx-0 md:px-0 md:pb-0 md:border-0 md:self-start md:h-auto flex flex-col">
             <ProductGallery 
               imageUrls={product.imageUrls || []} 
               imageUrlsThumb={product.imageUrlsThumb || []}
               imageUrlsOg={product.imageUrlsOg || []}
               productName={product.name} 
               mobileStickyActions={
                 <div className="flex items-center gap-2 px-2 h-10 w-full mb-1">
                   <Link href={`/tienda/${product.storeId}`} className="flex-1">
                     <Button variant="outline" className="w-full h-9 rounded-xl gap-1.5 font-bold text-[10px] uppercase border-2 shadow-sm">
                       <Store className="w-3.5 h-3.5" />
                       Tienda
                     </Button>
                   </Link>
                   <ShareWhatsAppButton
                     productId={product.id}
                     productName={product.name}
                     className="flex-1 h-9 rounded-xl border-2 text-[10px] font-bold gap-1.5 uppercase shadow-sm"
                   />
                 </div>
               }
             />
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:pl-0 lg:pr-4">
            <div className="glass-card p-4 md:p-8 rounded-4xl border border-white/20 dark:border-white/10 shadow-md dark:shadow-[0_0_25px_rgba(37,99,235,0.1)] transition-all duration-300 space-y-4 md:space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border-primary/20">
                    {product.category || "General"}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
                    <Store className="w-4 h-4" />
                    <span>Vendido en SIGE</span>
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight tracking-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex flex-col pt-2">
                {product.comercialConfig?.precioOferta ? (
                  <>
                    <span className="text-sm font-bold text-muted-foreground line-through decoration-red-500/40">
                      Precio Original: Bs. {product.comercialConfig.precioVenta.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-5xl font-black text-blue-gradient drop-shadow-md py-1">
                        Bs. {product.comercialConfig.precioOferta.toFixed(2)}
                      </span>
                      <Badge className="bg-green-500 text-white border-none font-bold animate-pulse">
                        ¡{product.comercialConfig.ofertaPorcentaje}% DESC!
                      </Badge>
                    </div>
                    {(product.comercialConfig.fechaFinOferta || product.comercialConfig.limiteCompra) && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {product.comercialConfig.fechaFinOferta && (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 gap-1.5 py-1 px-3 shadow-sm font-bold">
                            ⏱ Termina en {Math.max(0, Math.ceil((new Date(product.comercialConfig.fechaFinOferta).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días
                          </Badge>
                        )}
                        {product.comercialConfig.limiteCompra && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 gap-1.5 py-1 px-3 shadow-sm font-bold">
                            🛒 Máx. {product.comercialConfig.limiteCompra} unidades / persona
                          </Badge>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-5xl font-black text-blue-gradient drop-shadow-md py-1">
                    Bs. {product.comercialConfig?.precioVenta.toFixed(2) || "0.00"}
                  </span>
                )}
              </div>

              <Separator className="my-2 opacity-50" />

              {/* Descripción */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Acerca de este producto
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description || "El vendedor no ha proporcionado una descripción detallada para este producto."}
                </p>
              </div>

              <Separator className="my-2 opacity-50" />
              
              <div className="pt-4 hidden md:flex flex-col gap-3">
                <a 
                  href={`https://wa.me/${(product.store?.phone || "59173214036").replace(/\D/g, '')}?text=${encodeURIComponent(
                    `*PEDIDO DE PRODUCTO SIGE*\n\n` +
                    `*Producto:* ${product.name}\n` +
                    `*Precio:* Bs. ${(product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0).toFixed(2)}\n` +
                    `*Tienda:* ${product.store?.name || "SIGE Market"}\n` +
                    `*Link:* https://sige.click/productos/${product.id}\n\n` +
                    `*Imagen:* ${product.imageUrls?.[0]?.startsWith('http') ? product.imageUrls[0] : `https://sige.click${product.imageUrls?.[0]}`}\n\n` +
                    `Hola, quiero comprar este producto.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button 
                    className={cn(
                      "w-full h-14 text-lg font-bold gap-3 rounded-2xl transition-all hover:-translate-y-1 border-0",
                      isOutOfStock 
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-100" 
                        : "bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-[0_10px_20px_rgba(37,211,102,0.25)] hover:shadow-[0_15px_30px_rgba(37,211,102,0.4)]"
                    )}
                    size="lg"
                  >
                    <WhatsAppIcon className="w-6 h-6" />
                    {isOutOfStock ? "Producto Agotado" : "Comprar por WhatsApp"}
                  </Button>
                </a>
              </div>
            </div>

            {/* Info de Stock */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 border shadow-md dark:shadow-[0_0_20px_rgba(37,99,235,0.08)] backdrop-blur-sm transition-all duration-300 ${isOutOfStock ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-white/20 dark:border-white/10'}`}>
              <div className={`p-3 rounded-full ${isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                 <Info className="w-6 h-6" />
              </div>
               <div>
                 <p className="font-bold text-foreground">Disponibilidad en almacén</p>
                 <p className={`text-sm font-semibold mt-0.5 ${isOutOfStock ? 'text-destructive' : !isPublished ? 'text-amber-600' : 'text-muted-foreground'}`}>
                   {!isPublished 
                     ? "Este producto está oculto (Borrador)" 
                     : isOutOfStock 
                       ? "Agotado temporalmente" 
                       : `Quedan ${product.inventory?.stockActual} unidades listas para envío`}
                 </p>
              </div>
            </div>

            {/* Información del Vendedor */}
            <div className="bg-card p-6 md:p-8 rounded-4xl border border-white/20 dark:border-white/10 shadow-md dark:shadow-[0_0_25px_rgba(37,99,235,0.1)] transition-all duration-300 mt-2 space-y-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Información del Vendedor
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Store className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tienda</p>
                    <p className="font-bold text-foreground">{product.store?.name || "Tienda SIGE"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Correo</p>
                    <p className="font-medium text-foreground">{product.seller?.email || "No disponible"}</p>
                  </div>
                </div>

                {(product.store?.phone || product.seller?.phone) && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Teléfono / WhatsApp</p>
                      <p className="font-medium text-foreground">{product.store?.phone || product.seller?.phone}</p>
                    </div>
                  </div>
                )}

                {product.store?.address && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-full shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ubicación</p>
                      <p className="font-medium text-foreground leading-snug">{product.store.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Garantías y Envío al final */}
            <div className="bg-card p-6 md:p-8 rounded-4xl border border-white/20 dark:border-white/10 shadow-md dark:shadow-[0_0_25px_rgba(37,99,235,0.1)] transition-all duration-300 mt-2 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Envío a todo el país</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Llega en 24-48 horas hábiles mediante transporte seguro</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-500/10 rounded-full shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Compra Protegida</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Recibe el producto que esperabas o te devolvemos tu dinero</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile Only - Above Navigation */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/90 backdrop-blur-xl border-t shadow-glass z-40 md:hidden animate-in slide-in-from-bottom-full duration-500">
        <div className="flex items-center justify-between gap-4 px-4 h-16">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total</span>
            <span className="text-lg font-black text-foreground">
              Bs. {(product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0).toFixed(2)}
            </span>
          </div>
          
          <a 
            href={`https://wa.me/${(product.store?.phone || "59173214036").replace(/\D/g, '')}?text=${encodeURIComponent(
              `*PEDIDO DE PRODUCTO SIGE*\n\n` +
              `*Producto:* ${product.name}\n` +
              `*Precio:* Bs. ${(product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0).toFixed(2)}\n` +
              `*Tienda:* ${product.store?.name || "SIGE Market"}\n` +
              `*Link:* https://sige.click/productos/${product.id}\n\n` +
              `*Imagen:* ${product.imageUrls?.[0]?.startsWith('http') ? product.imageUrls[0] : `https://sige.click${product.imageUrls?.[0]}`}\n\n` +
              `Hola, quiero comprar este producto.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button 
              className={cn(
                "w-full h-10 text-xs font-bold gap-2 rounded-xl border-0 transition-all",
                isOutOfStock 
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-100" 
                  : "bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-[0_8px_16px_rgba(37,211,102,0.2)]"
              )}
            >
              <WhatsAppIcon className="w-4 h-4" />
              {isOutOfStock ? "Agotado" : "Comprar por WhatsApp"}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
