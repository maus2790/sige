CREATE TABLE `gift_card_history` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`amount` real,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users` ADD `balance` real;