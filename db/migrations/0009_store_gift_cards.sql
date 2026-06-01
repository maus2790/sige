CREATE TABLE `store_gift_card_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`design_id` integer DEFAULT 1 NOT NULL,
	`occasion` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_gift_card_payment_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`qr_url` text,
	`bank_details` text,
	`tigo_money` text,
	`operator_phone` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `store_gift_card_payment_settings_store_id_unique` ON `store_gift_card_payment_settings` (`store_id`);--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `store_gift_card_template_id` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `payment_method` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `transaction_number` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `rejection_reason` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `verified_by` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `verified_at` integer;
