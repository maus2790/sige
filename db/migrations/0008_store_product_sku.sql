ALTER TABLE `stores` ADD `sku` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `stores_sku_unique` ON `stores` (`sku`);
--> statement-breakpoint
WITH numbered_stores AS (
	SELECT
		`id`,
		upper(printf('%04X', row_number() OVER (ORDER BY `created_at`, `id`))) AS generated_sku
	FROM `stores`
)
UPDATE `stores`
SET `sku` = (
	SELECT generated_sku
	FROM numbered_stores
	WHERE numbered_stores.id = stores.id
)
WHERE `sku` IS NULL;
--> statement-breakpoint
WITH numbered_products AS (
	SELECT
		products.`id`,
		stores.`sku` || '-' || upper(printf('%04X', row_number() OVER (PARTITION BY products.`store_id` ORDER BY products.`created_at`, products.`id`))) AS generated_sku
	FROM `products`
	INNER JOIN `stores` ON stores.`id` = products.`store_id`
)
UPDATE `products`
SET `sku` = (
	SELECT generated_sku
	FROM numbered_products
	WHERE numbered_products.id = products.id
)
WHERE `sku` IS NULL OR length(`sku`) <> 9 OR instr(`sku`, '-') <> 5;
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);
