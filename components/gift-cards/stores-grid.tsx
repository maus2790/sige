'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Store, Sparkles } from 'lucide-react';

interface StoreWithGiftCard {
  id: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  firstTemplateId: string;
  firstTemplateName: string;
  firstTemplateAmount: number;
  firstTemplateDesignId: number;
  imageUrl: string | null;
}

interface StoresGridProps {
  stores: StoreWithGiftCard[];
}

export function StoresGrid({ stores }: StoresGridProps) {
  const router = useRouter();

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Store className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="text-xl font-bold mb-2">No hay tiendas disponibles</h2>
        <p className="text-muted-foreground text-center">
          Explora tiendas que ofrecen gift cards personalizadas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores.map((store) => (
        <Card
          key={store.id}
          className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
        >
          {/* Gift Card Image - Full Width Top */}
          <div className="relative w-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 aspect-video">
            {store.imageUrl ? (
              <Image
                src={store.imageUrl}
                alt={store.firstTemplateName}
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="h-16 w-16 text-white opacity-30" />
              </div>
            )}
          </div>

          {/* Card Info and Actions */}
          <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
            {/* Store info */}
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="font-bold text-base line-clamp-2">{store.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Gift className="h-3 w-3" />
                  {store.firstTemplateName}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">
                  Bs. {store.firstTemplateAmount}
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Disponible
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              {/* Visitar tienda */}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto flex flex-col gap-1 py-2"
                onClick={() => router.push(`/tienda/${store.id}`)}
                title="Visitar tienda"
              >
                <Store className="h-4 w-4" />
                <span className="text-[10px]">Visitar</span>
              </Button>

              {/* Comprar (directo a payment step) */}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto flex flex-col gap-1 py-2"
                onClick={() =>
                  router.push(
                    `/tienda/${store.id}/gift-cards?templateId=${store.firstTemplateId}&step=payment`
                  )
                }
                title="Comprar gift card"
              >
                <Gift className="h-4 w-4" />
                <span className="text-[10px]">Comprar</span>
              </Button>

              {/* Personalizar (custom design) */}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto flex flex-col gap-1 py-2"
                onClick={() => {
                  router.push(
                    `/tienda/${store.id}/gift-cards?customDesign=true&storeId=${store.id}`
                  );
                }}
                title="Diseño personalizado"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-[10px]">Diseñar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
