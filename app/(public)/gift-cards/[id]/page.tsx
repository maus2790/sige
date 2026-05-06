import { notFound, redirect } from 'next/navigation';
import { getGiftCardById, markGiftCardAsOpened, checkAndUpdateExpiredStatus } from '@/app/actions/gift-cards';
import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import { GiftCardDetail } from '@/components/gift-cards/gift-card-detail';
import { Metadata } from 'next';

interface GiftCardDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GiftCardDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const giftCard = await getGiftCardById(id);

    if (!giftCard) {
        return { title: 'Gift Card no encontrada' };
    }

    return {
        title: `Gift Card - SIGE`,
        description: giftCard.message || `Gift card de Bs. ${giftCard.amount}`,
    };
}

export default async function GiftCardDetailPage({ params }: GiftCardDetailPageProps) {
    const { id } = await params;
    const session = await getServerSession(nextauthConfig);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        redirect('/auth/login');
    }

    let giftCard = await getGiftCardById(id);

    if (!giftCard) {
        notFound();
    }

    giftCard = await checkAndUpdateExpiredStatus(id) || giftCard;

    const userRole = giftCard.senderId === userId ? 'sender' : 'recipient';

    if (userRole === 'recipient' && !giftCard.openedAt) {
        await markGiftCardAsOpened(id);
        giftCard.openedAt = new Date();
    }

    // Normalize Date fields to numbers for the GiftCardDetail component
    const normalizedCard = {
        ...giftCard,
        expiresAt: giftCard.expiresAt instanceof Date ? giftCard.expiresAt.getTime() : Number(giftCard.expiresAt),
        createdAt: giftCard.createdAt instanceof Date ? giftCard.createdAt.getTime() : Number(giftCard.createdAt),
        deliveredAt: giftCard.deliveredAt instanceof Date ? giftCard.deliveredAt.getTime() : (giftCard.deliveredAt ?? null),
        openedAt: giftCard.openedAt instanceof Date ? giftCard.openedAt.getTime() : (giftCard.openedAt ?? null),
    };

    return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
            <GiftCardDetail
                giftCard={normalizedCard as any}
                userRole={userRole}
            />
        </div>
    );
}