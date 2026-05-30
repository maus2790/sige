CREATE TABLE `comprobantes` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`tipo_documento` text NOT NULL,
	`monto_total` real NOT NULL,
	`pago_gift_card` real NOT NULL DEFAULT 0,
	`pago_efectivo_qr` real NOT NULL DEFAULT 0,
	`estado_documento` text NOT NULL,
	`datos_cliente` text NOT NULL,
	`metadatos_fiscales` text NOT NULL,
	`fecha_creacion` integer NOT NULL,
	`fecha_actualizacion` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `detalle_comprobante` (
	`id` text PRIMARY KEY NOT NULL,
	`comprobante_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_sku` text NOT NULL,
	`nombre_producto` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` real NOT NULL,
	`subtotal` real NOT NULL,
	FOREIGN KEY (`comprobante_id`) REFERENCES `comprobantes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `correlativos_comprobante` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`tipo_documento` text NOT NULL,
	`siguiente_numero` integer NOT NULL DEFAULT 1,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `correlativos_comprobante_store_tipo_idx` ON `correlativos_comprobante` (`store_id`,`tipo_documento`);
