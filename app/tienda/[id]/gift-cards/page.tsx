import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GiftCardFormSkeleton } from '@/components/gift-cards/gift-card-skeleton';
import {
  getActiveStoreGiftCardTemplates,
  getStoreGiftCardPaymentSettings,
  getStoreWithGiftCards,
} from '@/app/actions/gift-cards';
import { StoreGiftCardBuyForm } from '@/components/gift-cards/store-gift-card-buy-form';

export default async function StoreGiftCardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ templateId?: string; step?: string; customDesign?: string }>;
}) {
  const { id: storeId } = await params;
  const { templateId, step, customDesign } = await searchParams;
  const store = await getStoreWithGiftCards(storeId);

  if (!store || !store.giftCardsEnabled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Esta tienda no tiene gift cards disponibles en este momento.
          </p>
          <Link href="/gift-cards">
            <Button>Volver a Gift Cards</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header con botón de atrás */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/gift-cards?tab=stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">{store.name}</h1>
            <p className="text-sm text-muted-foreground">
              {store.templates.length} gift card{store.templates.length !== 1 ? 's' : ''} disponible{store.templates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<GiftCardFormSkeleton />}>
        <StoreGiftCardBuyForm
          templates={store.templates as any}
          initialStoreId={storeId}
          initialTemplateId={templateId}
          initialStep={step === 'payment' ? 1 : customDesign === 'true' ? 0 : 0}
          skipSelectionStep={step === 'payment' || customDesign === 'true'}
          initialCustomDesign={customDesign === 'true'}
        />
      </Suspense>
    </div>
  );
}
