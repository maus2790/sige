import { Suspense } from 'react';
import { GiftCardBottomNav } from '@/components/gift-cards/gift-card-bottom-nav';

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
      <Suspense fallback={null}>
        <GiftCardBottomNav />
      </Suspense>
    </div>
  );
}
