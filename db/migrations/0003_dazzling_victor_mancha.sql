CREATE TABLE `comercial_config` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`precio_adquisicion` real DEFAULT 0,
	`precio_venta` real NOT NULL,
	`precio_oferta` real,
	`oferta_porcentaje` integer DEFAULT 0,
	`is_published` integer DEFAULT true,
	`es_destacado` integer DEFAULT false,
	`fecha_fin_oferta` integer,
	`limite_compra` integer,
	`updated_at` integer,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comercial_config_product_id_unique` ON `comercial_config` (`product_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `image` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `unit_price` real;--> statement-breakpoint
ALTER TABLE `orders` ADD `discount_applied` integer;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `price`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `is_published`;