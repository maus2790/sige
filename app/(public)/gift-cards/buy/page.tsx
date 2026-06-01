import { Suspense } from 'react';
import { GiftCardFormSkeleton } from '@/components/gift-cards/gift-card-skeleton';
import {
  getActiveStoreGiftCardTemplates,
  getStoreGiftCardPaymentSettings,
} from '@/app/actions/gift-cards';
import { StoreGiftCardBuyForm } from '@/components/gift-cards/store-gift-card-buy-form';

export default async function GiftCardBuyPage({
  searchParams,
}: {
  searchParams?: Promise<{ storeId?: string }>;
}) {
  const params = await searchParams;
  const storeId = params?.storeId;
  const templates = await getActiveStoreGiftCardTemplates(storeId);
  const paymentSettings = storeId ? await getStoreGiftCardPaymentSettings(storeId) : null;

  return (
    <div className="w-full">
      <Suspense fallback={<GiftCardFormSkeleton />}>
        <StoreGiftCardBuyForm
          templates={templates}
          initialStoreId={storeId}
          initialPaymentSettings={paymentSettings}
        />
      </Suspense>
    </div>
  );
}
