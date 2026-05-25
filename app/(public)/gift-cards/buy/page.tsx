import { GiftCardBuyForm } from '@/components/gift-cards/gift-card-buy-form';
import { Suspense } from 'react';
import { GiftCardFormSkeleton } from '@/components/gift-cards/gift-card-skeleton';
import { getTotalBalance } from '@/app/actions/gift-cards';

export default async function GiftCardBuyPage() {
  const availableBalance = await getTotalBalance();

  return (
    <div className="w-full">
      <Suspense fallback={<GiftCardFormSkeleton />}>
        <GiftCardBuyForm availableBalance={availableBalance} />
      </Suspense>
    </div>
  );
}
