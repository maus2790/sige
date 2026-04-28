"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye, ShoppingCart, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    inventory?: {
      stockActual: number;
      stockMinimo: number;
    } | null;
    imageUrls: string[] | null;
    views: number | null;
    status?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mainImage = product.imageUrls?.[0] || null;

  return (
    <Link href={`/productos/${product.id}`}>
      <Card
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Badge de estado */}
        {product.status && product.status !== "Nuevo" && (
          <div className="absolute top-2 left-2 z-10">
            <Badge variant="secondary" className="text-xs">
              {product.status}
            </Badge>
          </div>
        )}

        {/* Badge de stock bajo */}
        {(product.inventory?.stockActual ?? 0) < (product.inventory?.stockMinimo ?? 5) && (product.inventory?.stockActual ?? 0) > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="destructive" className="text-xs">
              ¡Quedan {product.inventory?.stockActual}!
            </Badge>
          </div>
        )}

        {(!product.inventory || product.inventory.stockActual === 0) && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Agotado
            </Badge>
          </div>
        )}

        {/* Imagen */}
        <div className="aspect-square relative overflow-hidden bg-linear-to-br from-slate-100 to-slate-200">
          {mainImage ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              <Image
                src={mainImage}
                alt={product.name}
                width={400}
                height={400}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isHovered ? "scale-110" : "scale-100"
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
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              Bs. {product.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{product.views || 0}</span>
            </div>
          </div>
        </CardContent>

        {/* Botones flotantes en hover */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent transition-all duration-300 ${
            isHovered ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <Button className="w-full gap-2" size="sm">
            <ShoppingCart className="w-4 h-4" />
            Ver detalles
          </Button>
        </div>

        {/* Botón de favorito (corazón) */}
        <button
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50"
          onClick={(e) => {
            e.preventDefault();
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
      </Card>
    </Link>
  );
}