CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`stock_actual` integer DEFAULT 0 NOT NULL,
	`stock_minimo` integer DEFAULT 5 NOT NULL,
	`ubicacion` text,
	`updated_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `products` ADD `sku` text;--> statement-breakpoint
ALTER TABLE `products` ADD `status` text DEFAULT 'Nuevo';--> statement-breakpoint
ALTER TABLE `products` ADD `is_published` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `stock`;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_proof_url` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_verified_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `assistant_notes` text;