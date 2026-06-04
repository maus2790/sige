'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Sparkles } from 'lucide-react';

interface GiftCardTemplate {
  id: string;
  name: string;
  amount: number;
  designId: number;
  imageUrl: string | null;
}

interface StoreGiftCardTemplatesProps {
  storeId: string;
  templates: GiftCardTemplate[];
  onSelectTemplate: (templateId: string) => void;
  onCustomDesign: () => void;
}

export function StoreGiftCardTemplates({ storeId, templates, onSelectTemplate, onCustomDesign }: StoreGiftCardTemplatesProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Gift className="h-12 w-12 text-muted-foreground mb-3" />
        <h2 className="text-xl font-bold mb-2">Sin gift cards disponibles</h2>
        <p className="text-muted-foreground text-center">
          Esta tienda no tiene gift cards disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {/* Custom Design Skeleton */}
      <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col cursor-pointer" onClick={onCustomDesign}>
        <div className="relative w-full h-56 md:h-44 bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center">
          <div className="text-center text-white">
            <Sparkles className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm font-bold">Diseña tu propia</p>
          </div>
        </div>

        <CardContent className="p-3 flex-1 flex flex-col justify-start gap-2">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm line-clamp-2">Tarjeta Personalizada</h3>
            <p className="text-xs text-muted-foreground">Crea tu regalo único</p>
          </div>

          <Button
            size="xs"
            className="w-full h-8 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-0.5" />
            Crear
          </Button>
        </CardContent>
      </Card>

      {/* Gift Card Templates */}
      {templates.map((template) => (
        <Card
          key={template.id}
          className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
          onClick={() => onSelectTemplate(template.id)}
        >
          {/* Gift Card Image - Top */}
          <div className={`relative w-full h-56 md:h-44 ${template.imageUrl ? 'bg-transparent' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`}>
            {template.imageUrl ? (
              <Image
                src={template.imageUrl}
                alt={template.name}
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
            {/* Template info */}
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm line-clamp-2">{template.name}</h3>
              <p className="text-xs font-semibold text-primary">
                Bs. {template.amount}
              </p>
            </div>

            {/* Action button */}
            <Button
              size="xs"
              className="w-full h-8 text-xs"
            >
              <Gift className="h-3 w-3 mr-0.5" />
              Comprar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
