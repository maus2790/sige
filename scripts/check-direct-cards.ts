import "dotenv/config";
import { db } from "../db";
import { giftCards } from "../db/schema";

async function main() {
  const cards = await db.select().from(giftCards).all();
  console.log("Total gift cards in DB:", cards.length);
  for (const card of cards) {
    console.log({
      id: card.id,
      code: card.code,
      senderId: card.senderId,
      recipientId: card.recipientId,
      recipientName: card.recipientName,
      storeGiftCardTemplateId: card.storeGiftCardTemplateId,
      status: card.status,
    });
  }
}

main().catch(console.error);
