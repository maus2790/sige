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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {stores.map((store) => (
        <Card
          key={store.id}
          className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
        >
          {/* Gift Card Image - Top */}
          <div className={`relative w-full h-59 md:h-43 ${store.imageUrl ? 'bg-transparent' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
            {store.imageUrl ? (
              <Image
                src={store.imageUrl}
                alt={store.firstTemplateName}
                fill
                className="object-cover w-full h-full"
                sizes="160px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md">
                <div className="text-center">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Sin imagen</p>
                </div>
              </div>
            )}
          </div>

          {/* Card Info and Actions - Bottom */}
          <CardContent className="p-3 flex-1 flex flex-col justify-start gap-2">
            {/* Store info */}
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm line-clamp-2">{store.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {store.firstTemplateName}
              </p>
              <p className="text-xs font-semibold text-primary">
                Bs. {store.firstTemplateAmount}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1">
              {/* Visitar tienda */}
              <Button
                variant="outline"
                size="xs"
                className="flex-1 h-8 text-xs"
                onClick={() => router.push(`/tienda/${store.id}`)}
              >
                <Store className="h-3 w-3 mr-0.5" />
                Visitar
              </Button>

              {/* Comprar (directo a payment step) */}
              <Button
                variant="outline"
                size="xs"
                className="flex-1 h-8 text-xs"
                onClick={() =>
                  router.push(
                    `/tienda/${store.id}/gift-cards?templateId=${store.firstTemplateId}&step=payment`
                  )
                }
              >
                <Gift className="h-3 w-3 mr-0.5" />
                Comprar
              </Button>

              {/* Personalizar (custom design) */}
              <Button
                size="xs"
                className="flex-1 h-8 text-xs"
                onClick={() => {
                  router.push(
                    `/tienda/${store.id}/gift-cards?customDesign=true&storeId=${store.id}`
                  );
                }}
              >
                <Sparkles className="h-3 w-3 mr-0.5" />
                Diseñar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
