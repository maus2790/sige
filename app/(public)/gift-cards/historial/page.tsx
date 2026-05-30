import { getServerSession } from "next-auth/next";
import { nextauthConfig } from "@/lib/nextauth.config";
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { GiftCardHistory } from '@/components/gift-cards/gift-card-history';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

async function HistoryContent() {
    const session = await getServerSession(nextauthConfig);
    const userId = (session?.user as any)?.id;
    if (!userId) redirect('/auth/login');

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Back button */}
                <div className="mb-6">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="gap-2"
                    >
                        <Link href="/gift-cards">
                            <ChevronLeft className="h-4 w-4" />
                            Volver a Gift Cards
                        </Link>
                    </Button>
                </div>

                {/* Historial Component */}
                <GiftCardHistory />
            </div>
        </div>
    );
}

export default function HistorialPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin">⏳</div></div>}>
            <HistoryContent />
        </Suspense>
    );
}
