import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import { redirect } from 'next/navigation';
import { getUserGiftCards, getTotalBalance, getGiftCardStats, getStoresWithGiftCards } from '@/app/actions/gift-cards';
import { Suspense } from 'react';
import { GiftCardWalletSkeleton } from '@/components/gift-cards/gift-card-skeleton';
import { GiftCardWallet } from '@/components/gift-cards/gift-card-wallet';

async function WalletContent() {
    const session = await getServerSession(nextauthConfig);
    const userId = (session?.user as any)?.id;
    if (!userId) redirect('/auth/login');

    const { sent, received, saved, mine } = await getUserGiftCards();
    const totalBalance = await getTotalBalance();
    const stats = await getGiftCardStats();
    const stores = await getStoresWithGiftCards();

    return (
        <GiftCardWallet
            sent={sent as any[]}
            received={received as any[]}
            saved={saved as any[]}
            mine={mine as any[]}
            totalBalance={totalBalance}
            stats={stats}
            stores={stores as any[]}
        />
    );
}

export default function GiftCardsPage() {
    return (
        <Suspense fallback={<GiftCardWalletSkeleton />}>
            <WalletContent />
        </Suspense>
    );
}
