import "dotenv/config";
import { db } from "../db";
import { users, stores } from "../db/schema";

async function main() {
  const allUsers = await db.select().from(users).all();
  console.log("Users in DB:");
  console.log(JSON.stringify(allUsers, null, 2));

  const allStores = await db.select().from(stores).all();
  console.log("Stores in DB:");
  console.log(JSON.stringify(allStores, null, 2));
}

main().catch(console.error);
