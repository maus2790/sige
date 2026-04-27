import { getProductById } from "@/app/actions/products";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, MessageSquare, ShieldCheck, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProductoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductoDetailPage({ params }: ProductoDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const mainImage = product.imageUrls?.[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold truncate">Detalles del Producto</h1>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda: Galería de Imágenes */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border shadow-sm relative">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-20 h-20" />
                </div>
              )}
              
              {/* Badge de estado */}
              {product.status && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-white border-none px-3 py-1">
                    {product.status}
                  </Badge>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.imageUrls.map((url, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg border bg-white shrink-0 overflow-hidden cursor-pointer hover:border-primary transition-colors">
                    <Image
                      src={url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  {product.category || "General"}
                </Badge>
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-primary">
                  Bs. {product.price.toFixed(2)}
                </span>
              </div>

              <Separator />

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Envío a todo el país</p>
                    <p className="text-xs text-muted-foreground">Llega en 24-48 horas hábiles</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Compra Protegida</p>
                    <p className="text-xs text-muted-foreground">Recibe lo que esperabas o te devolvemos tu dinero</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button className="w-full h-12 text-lg font-bold gap-2" size="lg">
                  <ShoppingCart className="w-5 h-5" />
                  Comprar Ahora
                </Button>
                <Button variant="outline" className="w-full h-12 text-lg gap-2" size="lg">
                  <MessageSquare className="w-5 h-5" />
                  Contactar Vendedor
                </Button>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Descripción</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {product.description || "El vendedor no ha proporcionado una descripción detallada para este producto."}
                </p>
              </div>
            </div>
            
            {/* Info de Stock */}
            <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Disponibilidad:</span>
              <Badge variant={product.stock && product.stock > 0 ? "default" : "destructive"}>
                {product.stock && product.stock > 0 ? `${product.stock} unidades` : "Agotado"}
              </Badge>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
