CREATE TABLE `gift_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`qr_hash` text NOT NULL,
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
	`message` text,
	`template_id` integer,
	`custom_image_url` text,
	`scheduled_at` integer,
	`delivered_at` integer,
	`opened_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_cards_code_unique` ON `gift_cards` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `gift_cards_qr_hash_unique` ON `gift_cards` (`qr_hash`);