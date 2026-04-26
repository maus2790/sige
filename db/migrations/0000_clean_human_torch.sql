CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text,
	`name` text NOT NULL,
	`role` text DEFAULT 'seller' NOT NULL,
	`phone` text,
	`video_plan` text DEFAULT 'free',
	`video_plan_expires_at` integer,
	`reset_token` text,
	`reset_token_expiry` integer,
	`provider` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`address` text,
	`phone` text,
	`logo_url` text,
	`verified` integer DEFAULT false,
	`rating` real DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_user_id_unique` ON `stores` (`user_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`stock` integer DEFAULT 0,
	`category` text,
	`image_urls` text,
	`video_url` text,
	`video_type` text,
	`has_video` integer DEFAULT false,
	`views` integer DEFAULT 0,
	`sales` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`store_id` text NOT NULL,
	`buyer_name` text NOT NULL,
	`buyer_phone` text NOT NULL,
	`buyer_email` text,
	`quantity` integer NOT NULL,
	`total_amount` real NOT NULL,
	`status` text DEFAULT 'pending_payment',
	`payment_method` text,
	`payment_verified_by` text,
	`created_at` integer,
	`delivered_at` integer
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`onesignal_id` text,
	`player_id` text NOT NULL,
	`device_type` text,
	`browser` text,
	`created_at` integer,
	`last_active_at` integer,
	`is_active` integer DEFAULT true
);
