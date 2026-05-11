import { GiftCardBuyForm } from '@/components/gift-cards/gift-card-buy-form';
import { Suspense } from 'react';
import { GiftCardFormSkeleton } from '@/components/gift-cards/gift-card-skeleton';

export default function GiftCardBuyPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<GiftCardFormSkeleton />}>
        <GiftCardBuyForm />
      </Suspense>
    </div>
  );
}

