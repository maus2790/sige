import { Suspense } from 'react';
import { GiftCardList } from '@/components/gift-cards/gift-card-list';
import { GiftCardListSkeleton } from '@/components/gift-cards/gift-card-skeleton';
import { getUserGiftCards, getTotalBalance, getGiftCardStats } from '@/app/actions/gift-cards';
import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Inbox, Send, Clock } from 'lucide-react';
import Link from 'next/link';

async function GiftCardsContent() {
    const session = await getServerSession(nextauthConfig);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        redirect('/auth/login');
    }

    const { sent, received } = await getUserGiftCards();
    const totalBalance = await getTotalBalance();
    const stats = await getGiftCardStats();

    const activeReceived = received.filter(c =>
        c.status === 'active' && c.expiresAt > new Date() && c.balance > 0
    );

    return (
        <div className="space-y-6">
            <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <p className="text-sm opacity-90">Tu saldo total disponible</p>
                        <p className="text-3xl font-bold mt-1">Bs. {totalBalance.toFixed(2)}</p>
                        <p className="text-xs opacity-80 mt-1">
                            En {activeReceived.length} gift card{activeReceived.length !== 1 ? 's' : ''} activas
                        </p>
                    </div>
                    <Button asChild variant="secondary" size="sm" className="gap-2">
                        <Link href="/gift-cards/buy">
                            <Gift className="h-4 w-4" />
                            Comprar Gift Card
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Recibidas</p>
                                <p className="text-2xl font-bold">{stats?.receivedCount || 0}</p>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.activeCount || 0} activas
                                </p>
                            </div>
                            <Inbox className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Enviadas</p>
                                <p className="text-2xl font-bold">{stats?.sentCount || 0}</p>
                                <p className="text-xs text-muted-foreground">
                                    Total de regalos
                                </p>
                            </div>
                            <Send className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Expiradas</p>
                                <p className="text-2xl font-bold">{stats?.expiredCount || 0}</p>
                                <p className="text-xs text-muted-foreground">
                                    Gift cards vencidas
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-3">
                <h2 className="text-xl font-semibold">Tus Gift Cards</h2>
                <GiftCardList sent={sent} received={received} />
            </div>
        </div>
    );
}

export default function GiftCardsPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <Suspense fallback={<GiftCardListSkeleton />}>
                <GiftCardsContent />
            </Suspense>
        </div>
    );
}