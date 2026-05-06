import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import { redirect } from 'next/navigation';
import { getUserGiftCards, getTotalBalance, getGiftCardStats } from '@/app/actions/gift-cards';
import { Suspense } from 'react';
import { GiftCardListSkeleton } from '@/components/gift-cards/gift-card-skeleton';
import { GiftCardWallet } from '@/components/gift-cards/gift-card-wallet';

async function WalletContent() {
    const session = await getServerSession(nextauthConfig);
    const userId = (session?.user as any)?.id;
    if (!userId) redirect('/auth/login');

    const { sent, received } = await getUserGiftCards();
    const totalBalance = await getTotalBalance();
    const stats = await getGiftCardStats();

    return (
        <GiftCardWallet
            sent={sent as any[]}
            received={received as any[]}
            totalBalance={totalBalance}
            stats={stats}
        />
    );
}

export default function GiftCardsPage() {
    return (
        <Suspense fallback={<GiftCardListSkeleton />}>
            <WalletContent />
        </Suspense>
    );
}