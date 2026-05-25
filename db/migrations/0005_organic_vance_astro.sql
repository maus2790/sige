CREATE TABLE `gift_card_recharges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`payment_method` text NOT NULL,
	`transaction_number` text,
	`receipt_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'general',
	`link` text,
	`read` integer DEFAULT false,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `system_config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
ALTER TABLE `stores` ADD `banner_url` text;--> statement-breakpoint
ALTER TABLE `stores` ADD `theme_config` text;--> statement-breakpoint
ALTER TABLE `stores` ADD `latitude` real;--> statement-breakpoint
ALTER TABLE `stores` ADD `longitude` real;--> statement-breakpoint
ALTER TABLE `products` ADD `image_urls_thumb` text;--> statement-breakpoint
ALTER TABLE `products` ADD `image_urls_og` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `product_id` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `occasion` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `card_image_url` text;--> statement-breakpoint
ALTER TABLE `gift_cards` ADD `receipt_url` text;