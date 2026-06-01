import { getMyStoreGiftCardData } from '@/app/actions/gift-cards';
import { GiftCardManagement } from '@/components/dashboard/gift-card-management';

export default async function DashboardGiftCardsPage() {
  const data = await getMyStoreGiftCardData();

  return (
    <GiftCardManagement
      store={data.store}
      templates={data.templates as any}
      settings={data.settings}
      pending={data.pending as any}
    />
  );
}
