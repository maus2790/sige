"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";

interface CriticalProduct {
  id: string;
  name: string;
  stock: number;
  imageUrl: string | null;
  price: number;
}

interface CriticalStockProps {
  products: CriticalProduct[];
}

export function CriticalStock({ products }: CriticalStockProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock crítico</CardTitle>
          <CardDescription>Productos con bajo inventario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos con stock crítico</p>
            <p className="text-sm">Todos los productos tienen stock suficiente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          Stock crítico
        </CardTitle>
        <CardDescription>Productos que necesitan reabastecimiento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    📦
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stock: <span className="font-semibold text-yellow-700">{product.stock}</span> unidades
                </p>
              </div>
              <Link href={`/dashboard/productos/${product.id}/editar`}>
                <Button size="sm" variant="outline">
                  Reabastecer
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Link href="/dashboard/inventario">
            <Button variant="link" size="sm" className="w-full">
              Ver inventario completo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}