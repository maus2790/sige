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
    <div className="space-y-4">
      {stores.map((store) => (
        <Card
          key={store.id}
          className="overflow-hidden hover:shadow-lg transition-shadow flex flex-row h-40"
        >
          {/* Gift Card Image - Left Side */}
          <div className="relative w-48 flex-shrink-0 bg-gradient-to-br from-blue-400 to-blue-600">
            {store.imageUrl ? (
              <Image
                src={store.imageUrl}
                alt={store.firstTemplateName}
                fill
                className="object-cover w-full h-full"
                sizes="200px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="h-16 w-16 text-white opacity-30" />
              </div>
            )}
          </div>

          {/* Card Info and Actions - Right Side */}
          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            {/* Store info */}
            <div className="space-y-1">
              <h3 className="font-bold text-base line-clamp-2">{store.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Gift className="h-3 w-3" />
                {store.firstTemplateName}
              </p>
              <p className="text-sm font-semibold text-primary">
                Bs. {store.firstTemplateAmount}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {/* Visitar tienda */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/tienda/${store.id}`)}
              >
                <Store className="h-3 w-3 mr-1" />
                Visitar
              </Button>

              {/* Comprar (directo a payment step) */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  router.push(
                    `/tienda/${store.id}/gift-cards?templateId=${store.firstTemplateId}&step=payment`
                  )
                }
              >
                <Gift className="h-3 w-3 mr-1" />
                Comprar
              </Button>

              {/* Personalizar (custom design) */}
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  router.push(
                    `/tienda/${store.id}/gift-cards?customDesign=true&storeId=${store.id}`
                  );
                }}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Diseñar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
