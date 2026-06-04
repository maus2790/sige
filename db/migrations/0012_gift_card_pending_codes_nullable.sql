ALTER TABLE `store_gift_card_templates` ADD `custom_style` text;
--> statement-breakpoint
ALTER TABLE `store_gift_card_payment_settings` ADD `max_amount` real DEFAULT 5000 NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS `gift_cards_code_unique`;
--> statement-breakpoint
DROP INDEX IF EXISTS `gift_cards_qr_hash_unique`;
--> statement-breakpoint
CREATE TABLE `gift_cards_new` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`qr_hash` text,
	`amount` real NOT NULL,
	`balance` real NOT NULL,
	`expires_at` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text,
	`recipient_email` text,
	`recipient_phone` text,
	`recipient_name` text,
	`business_id` text NOT NULL,
	`store_gift_card_template_id` text,
	`product_id` text,
	`message` text,
	`template_id` integer,
	`occasion` text,
	`custom_image_url` text,
	`card_image_url` text,
	`receipt_url` text,
	`payment_method` text,
	`transaction_number` text,
	`rejection_reason` text,
	`verified_by` text,
	`verified_at` integer,
	`scheduled_at` integer,
	`delivered_at` integer,
	`opened_at` integer,
	`custom_style` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `gift_cards_new` (
	`id`, `code`, `qr_hash`, `amount`, `balance`, `expires_at`, `status`, `sender_id`, `recipient_id`,
	`recipient_email`, `recipient_phone`, `recipient_name`, `business_id`, `store_gift_card_template_id`,
	`product_id`, `message`, `template_id`, `occasion`, `custom_image_url`, `card_image_url`, `receipt_url`,
	`payment_method`, `transaction_number`, `rejection_reason`, `verified_by`, `verified_at`, `scheduled_at`,
	`delivered_at`, `opened_at`, `custom_style`, `created_at`, `updated_at`
)
SELECT
	`id`, `code`, `qr_hash`, `amount`, `balance`, `expires_at`, `status`, `sender_id`, `recipient_id`,
	`recipient_email`, `recipient_phone`, `recipient_name`, `business_id`, `store_gift_card_template_id`,
	`product_id`, `message`, `template_id`, `occasion`, `custom_image_url`, `card_image_url`, `receipt_url`,
	`payment_method`, `transaction_number`, `rejection_reason`, `verified_by`, `verified_at`, `scheduled_at`,
	`delivered_at`, `opened_at`, NULL, `created_at`, `updated_at`
FROM `gift_cards`;
--> statement-breakpoint
DROP TABLE `gift_cards`;
--> statement-breakpoint
ALTER TABLE `gift_cards_new` RENAME TO `gift_cards`;
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_cards_code_unique` ON `gift_cards` (`code`);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_cards_qr_hash_unique` ON `gift_cards` (`qr_hash`);
