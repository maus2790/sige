'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiftCardCard } from './gift-card-card';
import { GiftCardListSkeleton } from './gift-card-skeleton';
import { Inbox, Send } from 'lucide-react';

interface GiftCardListProps {
  sent: any[];
  received: any[];
  isLoading?: boolean;
}

export function GiftCardList({ sent, received, isLoading = false }: GiftCardListProps) {
  const [activeTab, setActiveTab] = useState('received');
  
  if (isLoading) {
    return <GiftCardListSkeleton />;
  }
  
  return (
    <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="received" className="gap-2">
          <Inbox className="h-4 w-4" />
          Recibidas ({received.length})
        </TabsTrigger>
        <TabsTrigger value="sent" className="gap-2">
          <Send className="h-4 w-4" />
          Enviadas ({sent.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="received" className="mt-4">
        {received.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No has recibido ninguna gift card aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {received.map((giftCard) => (
              <GiftCardCard key={giftCard.id} giftCard={giftCard} type="received" />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="sent" className="mt-4">
        {sent.length === 0 ? (
          <div className="text-center py-12">
            <Send className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No has enviado ninguna gift card aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sent.map((giftCard) => (
              <GiftCardCard key={giftCard.id} giftCard={giftCard} type="sent" />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}