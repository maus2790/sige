// app/actions/categories.ts
"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";

const PREDEFINED_ORDER = [
  "Tecnología",
  "Moda",
  "Hogar",
  "Salud y Belleza",
  "Alimentos",
  "Vehículos",
  "Herramientas",
  "Deportes",
  "Bebés y Niños",
  "Mascotas",
  "Oficina",
  "Electrodomésticos",
  "Entretenimiento",
  "Servicios",
  "Inmuebles",
  "Empleos",
  "Agro",
  "Industria"
];

export async function getCategories() {
  try {
    const results = await db
      .select()
      .from(categories)
      .all();
    
    // Sort based on the PREDEFINED_ORDER array
    return results.sort((a, b) => {
      const indexA = PREDEFINED_ORDER.indexOf(a.name);
      const indexB = PREDEFINED_ORDER.indexOf(b.name);
      
      // If a category is not in the predefined order, push it to the end
      const posA = indexA !== -1 ? indexA : PREDEFINED_ORDER.length;
      const posB = indexB !== -1 ? indexB : PREDEFINED_ORDER.length;
      
      return posA - posB;
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}
