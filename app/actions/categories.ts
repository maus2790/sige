// app/actions/categories.ts
"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function getCategories() {
  try {
    const results = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.name))
      .all();
    
    return results;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
