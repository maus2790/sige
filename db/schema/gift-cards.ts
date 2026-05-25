import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const giftCards = sqliteTable('gift_cards', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  qrHash: text('qr_hash').notNull().unique(),
  amount: real('amount').notNull(),
  balance: real('balance').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('active'),
  senderId: text('sender_id').notNull(),
  recipientId: text('recipient_id'),
  recipientEmail: text('recipient_email'),
  recipientPhone: text('recipient_phone'),
  recipientName: text('recipient_name'),
  businessId: text('business_id').notNull(),
  productId: text('product_id'),
  message: text('message'),
  templateId: integer('template_id'),
  occasion: text('occasion'),
  customImageUrl: text('custom_image_url'),
  cardImageUrl: text('card_image_url'),
  receiptUrl: text('receipt_url'),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  openedAt: integer('opened_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const giftCardRecharges = sqliteTable('gift_card_recharges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  amount: real('amount').notNull().default(0),
  paymentMethod: text('payment_method').notNull(), // 'qr', 'bank_transfer', 'tigo_money', 'operator'
  transactionNumber: text('transaction_number'),
  receiptUrl: text('receipt_url'),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected', 'pending_operator'
  rejectionReason: text('rejection_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});