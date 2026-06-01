import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const storeGiftCardTemplates = sqliteTable('store_gift_card_templates', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull(),
  name: text('name').notNull(),
  code: text('code').unique(),
  amount: real('amount').notNull(),
  description: text('description'),
  designId: integer('design_id').notNull().default(1),
  occasion: text('occasion'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  customStyle: text('custom_style'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const storeGiftCardPaymentSettings = sqliteTable('store_gift_card_payment_settings', {
  id: text('id').primaryKey(),
  storeId: text('store_id').notNull().unique(),
  qrUrl: text('qr_url'),
  bankDetails: text('bank_details'),
  tigoMoney: text('tigo_money'),
  operatorPhone: text('operator_phone'),
  maxAmount: real('max_amount').notNull().default(5000),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

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
  storeGiftCardTemplateId: text('store_gift_card_template_id'),
  productId: text('product_id'),
  message: text('message'),
  templateId: integer('template_id'),
  occasion: text('occasion'),
  customImageUrl: text('custom_image_url'),
  cardImageUrl: text('card_image_url'),
  receiptUrl: text('receipt_url'),
  paymentMethod: text('payment_method'),
  transactionNumber: text('transaction_number'),
  rejectionReason: text('rejection_reason'),
  verifiedBy: text('verified_by'),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  openedAt: integer('opened_at', { mode: 'timestamp' }),
  customStyle: text('custom_style'),
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

export const giftCardHistory = sqliteTable('gift_card_history', {
  id: text('id').primaryKey(),
  giftCardId: text('gift_card_id').notNull(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(), // 'sent', 'received', 'saved', 'transferred', 'redeemed', 'recharge'
  description: text('description'),
  amount: real('amount'), // Para acciones de recarga
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
