import { Skeleton } from "@/components/ui/skeleton";
import { CardContent } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <div className="product-card-premium relative flex flex-col overflow-hidden h-full border border-white/20 dark:border-white/10 rounded-3xl bg-card/50 backdrop-blur-md shadow-xl">
      {/* Contenedor de Imagen */}
      <div className="aspect-4/3 relative overflow-hidden bg-muted block">
        <Skeleton className="h-full w-full rounded-none animate-pulse" />
        
        {/* Botón Ver en el Mapa (Inferior Izquierda) */}
        <div className="absolute bottom-2 left-2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-white/20 flex items-center justify-center shadow-md">
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
        
        {/* Botón Añadir al Carrito (Inferior Derecha) */}
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-white/20 flex items-center justify-center shadow-md">
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>
      </div>

      {/* Cuerpo de la tarjeta */}
      <CardContent className="product-card-body p-2 pb-1.5 flex flex-col justify-between flex-1">
        {/* Título del producto */}
        <div className="mb-1.5 mt-0.5">
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </div>
        {/* Precio */}
        <div className="flex flex-col gap-0.5 mt-auto">
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
      </CardContent>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

