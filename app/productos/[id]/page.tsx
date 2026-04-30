import { getProductById } from "@/app/actions/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, MessageSquare, ShieldCheck, Truck, Store, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/productos/product-gallery";

interface ProductoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductoDetailPage({ params }: ProductoDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const isOutOfStock = product.inventory?.stockActual === 0;
  const isPublished = product.comercialConfig?.isPublished ?? true;

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-20 relative">
      {/* Floating Glass Header */}
      <div className="sticky top-0 z-40 glass border-b shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg truncate text-foreground max-w-[200px] sm:max-w-md">
              {product.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/comprar/${product.id}`} className="hidden md:flex">
               <Button size="sm" variant="gradient" className="rounded-full gap-2 shadow-sm font-semibold" disabled={isOutOfStock}>
                 <ShoppingCart className="w-4 h-4" />
                 Comprar Ahora
               </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="lg:col-span-7">
             <ProductGallery 
               imageUrls={product.imageUrls || []} 
               productName={product.name} 
             />
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glass-card p-6 md:p-8 rounded-4xl border shadow-sm space-y-5">
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
                      <span className="text-5xl font-black text-brand-gradient drop-shadow-sm">
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
                  <span className="text-5xl font-black text-brand-gradient drop-shadow-sm">
                    Bs. {product.comercialConfig?.precioVenta.toFixed(2) || "0.00"}
                  </span>
                )}
              </div>

              <Separator className="my-2 opacity-50" />

              <div className="space-y-5 py-2">
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

              {/* Botones Desktop */}
              <div className="pt-4 flex-col gap-3 hidden md:flex">
                <Link href={`/comprar/${product.id}`} className="w-full">
                  <Button 
                    className="w-full h-14 text-lg font-bold gap-2 rounded-2xl shadow-premium hover:shadow-2xl transition-all hover:-translate-y-1 bg-brand-gradient text-white border-0" 
                    size="lg"
                    disabled={isOutOfStock}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {isOutOfStock ? "Producto Agotado" : "Comprar Ahora"}
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-14 text-base font-semibold gap-2 rounded-2xl border-2 hover:bg-accent transition-colors" size="lg">
                  <MessageSquare className="w-5 h-5" />
                  Contactar al Vendedor
                </Button>
              </div>
            </div>

            {/* Info de Stock */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 border shadow-sm backdrop-blur-sm ${isOutOfStock ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border'}`}>
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

            {/* Descripción */}
            <div className="bg-card p-6 md:p-8 rounded-4xl border shadow-sm mt-2">
              <h2 className="text-2xl font-bold mb-6 text-foreground tracking-tight">Acerca de este producto</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">
                  {product.description || "El vendedor no ha proporcionado una descripción detallada para este producto. Si tienes dudas, puedes contactarlo directamente."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Bar for Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t shadow-glass z-40 md:hidden flex items-center justify-between gap-4 pb-safe animate-in slide-in-from-bottom-full duration-500">
         <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total</span>
            <span className="text-xl font-black text-foreground">
              Bs. {(product.comercialConfig?.precioOferta || product.comercialConfig?.precioVenta || 0).toFixed(2)}
            </span>
         </div>
         <Link href={`/comprar/${product.id}`} className="flex-1 max-w-[200px]">
            <Button 
               className="w-full h-12 text-base font-bold gap-2 rounded-full shadow-premium bg-brand-gradient text-white border-0" 
               disabled={isOutOfStock}
            >
               <ShoppingCart className="w-4 h-4" />
               {isOutOfStock ? "Agotado" : !isPublished ? "Oculto" : "Comprar"}
            </Button>
         </Link>
      </div>
    </div>
  );
}
