ALTER TABLE `store_gift_card_templates` ADD `code` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `store_gift_card_templates_code_unique` ON `store_gift_card_templates` (`code`);
