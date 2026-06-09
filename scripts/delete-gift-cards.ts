import "dotenv/config";
import { sql, eq, or } from "drizzle-orm";

import { db } from "../db";
import {
  giftCards,
  giftCardHistory,
  giftCardRecharges,
  storeGiftCardTemplates,
  storeGiftCardPaymentSettings,
  systemConfig,
  notifications
} from "../db/schema";
import { deleteImage, extractKeyFromUrl } from "../lib/cloudflare";

async function main() {
  console.log("=== INICIANDO PROCESO DE LIMPIEZA DE NOTIFICACIONES Y DATOS DE GIFT CARDS ===");

  // 1. Obtener registros para contar
  const cards = await db.select().from(giftCards).all();
  const history = await db.select().from(giftCardHistory).all();
  const recharges = await db.select().from(giftCardRecharges).all();
  const templates = await db.select().from(storeGiftCardTemplates).all();
  const storeSettings = await db.select().from(storeGiftCardPaymentSettings).all();

  // Buscar notificaciones relacionadas a gift cards
  const giftCardNotifications = await db
    .select()
    .from(notifications)
    .where(
      or(
        eq(notifications.type, "gift_card"),
        sql`${notifications.link} LIKE '%gift-card%'`
      )
    )
    .all();

  console.log(`Se encontraron en la base de datos:`);
  console.log(`- ${cards.length} Gift Cards emitidas`);
  console.log(`- ${history.length} registros de historial`);
  console.log(`- ${recharges.length} solicitudes de recarga`);
  console.log(`- ${templates.length} plantillas de diseño de tiendas`);
  console.log(`- ${storeSettings.length} configuraciones de pago de tiendas`);
  console.log(`- ${giftCardNotifications.length} notificaciones de Gift Cards`);

  // 2. Eliminar imágenes de Cloudflare R2
  console.log("\nProcesando eliminación de imágenes en Cloudflare R2...");
  let deletedImagesCount = 0;

  for (const card of cards) {
    const urlsToDelete = [
      card.cardImageUrl,
      card.customImageUrl,
      card.receiptUrl
    ].filter((url): url is string => typeof url === "string" && url.length > 0);

    for (const url of urlsToDelete) {
      const key = extractKeyFromUrl(url);
      if (key) {
        try {
          console.log(`  -> Eliminando key R2 (Gift Card): "${key}" (URL: ${url})`);
          await deleteImage(key);
          deletedImagesCount++;
        } catch (error) {
          console.error(`  ❌ Error al eliminar key R2 "${key}":`, error);
        }
      }
    }
  }

  for (const setting of storeSettings) {
    if (setting.qrUrl) {
      const key = extractKeyFromUrl(setting.qrUrl);
      if (key) {
        try {
          console.log(`  -> Eliminando key R2 (Tienda QR): "${key}" (URL: ${setting.qrUrl})`);
          await deleteImage(key);
          deletedImagesCount++;
        } catch (error) {
          console.error(`  ❌ Error al eliminar key R2 "${key}":`, error);
        }
      }
    }
  }

  // QR global
  const globalQrConfig = await db
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.key, "payment_qr_url"))
    .get();

  if (globalQrConfig && globalQrConfig.value) {
    const key = extractKeyFromUrl(globalQrConfig.value);
    if (key) {
      try {
        console.log(`  -> Eliminando key R2 (QR Global): "${key}" (URL: ${globalQrConfig.value})`);
        await deleteImage(key);
        deletedImagesCount++;
      } catch (error) {
        console.error(`  ❌ Error al eliminar key R2 "${key}":`, error);
      }
    }
  }

  console.log(`Eliminación de imágenes completada. Total eliminadas: ${deletedImagesCount}`);

  // 3. Eliminar de la base de datos Turso
  console.log("\nEliminando registros de la base de datos Turso...");

  if (cards.length > 0) {
    await db.delete(giftCards);
    console.log("✅ Se eliminaron todos los registros de la tabla 'gift_cards'.");
  }

  if (history.length > 0) {
    await db.delete(giftCardHistory);
    console.log("✅ Se eliminaron todos los registros de la tabla 'gift_card_history'.");
  }

  if (recharges.length > 0) {
    await db.delete(giftCardRecharges);
    console.log("✅ Se eliminaron todos los registros de la tabla 'gift_card_recharges'.");
  }

  if (templates.length > 0) {
    await db.delete(storeGiftCardTemplates);
    console.log("✅ Se eliminaron todos los registros de la tabla 'store_gift_card_templates'.");
  }

  if (storeSettings.length > 0) {
    await db.delete(storeGiftCardPaymentSettings);
    console.log("✅ Se eliminaron todos los registros de la tabla 'store_gift_card_payment_settings'.");
  }

  // Eliminar notificaciones
  if (giftCardNotifications.length > 0) {
    await db
      .delete(notifications)
      .where(
        or(
          eq(notifications.type, "gift_card"),
          sql`${notifications.link} LIKE '%gift-card%'`
        )
      );
    console.log(`✅ Se eliminaron ${giftCardNotifications.length} registros de la tabla 'notifications'.`);
  } else {
    console.log("ℹ️ No hay notificaciones de gift cards para eliminar.");
  }

  // Eliminar configuraciones de pago globales
  await db
    .delete(systemConfig)
    .where(
      or(
        eq(systemConfig.key, "payment_qr_url"),
        eq(systemConfig.key, "payment_bank_details"),
        eq(systemConfig.key, "payment_tigo_money")
      )
    );
  console.log("✅ Se eliminaron las configuraciones globales de pago de la tabla 'system_config'.");

  console.log("\n=== PROCESO DE LIMPIEZA COMPLETADO CON ÉXITO ===");
}

main().catch((err) => {
  console.error("❌ Error durante la ejecución del script:", err);
  process.exit(1);
});
