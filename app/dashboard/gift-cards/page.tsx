import { getMyStoreGiftCardData } from '@/app/actions/gift-cards';
import { GiftCardManagement } from '@/components/dashboard/gift-card-management';

export default async function DashboardGiftCardsPage() {
  const data = await getMyStoreGiftCardData();

  return (
    <GiftCardManagement
      store={data.store}
      availableTemplates={data.availableTemplates as any}
      activeCards={data.activeCards as any}
      inactiveCards={data.inactiveCards as any}
      settings={data.settings}
      pending={data.pending as any}
      giftCardsEnabled={data.giftCardsEnabled}
    />
  );
}
