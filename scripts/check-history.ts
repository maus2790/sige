import "dotenv/config";
import { db } from "../db";
import { giftCardHistory } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const history = await db.select().from(giftCardHistory).where(eq(giftCardHistory.giftCardId, "4b4bf392-3f19-4ce2-892d-a987429324eb")).all();
  console.log(JSON.stringify(history, null, 2));
}

main().catch(console.error);
