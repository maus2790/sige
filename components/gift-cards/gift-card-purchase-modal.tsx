'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { StoreGiftCardBuyForm } from './store-gift-card-buy-form';
import { getStoreGiftCardPaymentSettings } from '@/app/actions/gift-cards';

interface GiftCardTemplate {
  id: string;
  storeId: string;
  name: string;
  amount: number;
  description: string | null;
  designId: number;
  occasion: string | null;
  storeName: string;
  storeLogoUrl: string | null;
}

interface GiftCardPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  templateName: string;
  amount: number;
  storeId: string;
  templates: GiftCardTemplate[];
}

export function GiftCardPurchaseModal({
  open,
  onOpenChange,
  templateId,
  templateName,
  amount,
  storeId,
  templates,
}: GiftCardPurchaseModalProps) {
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  useEffect(() => {
    if (open && storeId) {
      getStoreGiftCardPaymentSettings(storeId).then(setPaymentSettings);
    }
  }, [open, storeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 rounded-md opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <StoreGiftCardBuyForm
            templates={templates}
            initialStoreId={storeId}
            initialPaymentSettings={paymentSettings}
            initialTemplateId={templateId || undefined}
            initialStep={1}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
