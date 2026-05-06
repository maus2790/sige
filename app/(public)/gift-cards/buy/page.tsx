import { GiftCardBuyForm } from '@/components/gift-cards/gift-card-buy-form';
import { Suspense } from 'react';
import { GiftCardListSkeleton } from '@/components/gift-cards/gift-card-skeleton';

export default function GiftCardBuyPage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-2">Comprar Gift Card</h1>
        <p className="text-muted-foreground text-lg">Regala la libertad de elegir lo mejor de Bolivia.</p>
      </div>
      
      <Suspense fallback={<GiftCardListSkeleton />}>
        <GiftCardBuyForm />
      </Suspense>
    </div>
  );
}
