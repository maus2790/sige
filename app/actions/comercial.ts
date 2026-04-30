// app/actions/comercial.ts
"use server";

import { db } from "@/db";
import { comercialConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "./auth";
import { z } from "zod";

const comercialConfigSchema = z.object({
  precioAdquisicion: z.number().min(0),
  precioVenta: z.number().min(0.01, "El precio de venta debe ser mayor a 0"),
  precioOferta: z.number().min(0).optional().nullable(),
  ofertaPorcentaje: z.number().min(0).max(100).default(0),
  isPublished: z.boolean().default(true),
  esDestacado: z.boolean().default(false),
  limiteCompra: z.number().int().min(1).optional().nullable(),
  fechaFinOferta: z.coerce.date().optional().nullable(),
});

export async function updateComercialConfig(productId: string, data: any) {
  const user = await requireRole("seller");
  
  // Validar que el producto pertenezca al vendedor (esto se podría hacer con un join más complejo o checkeando el producto primero)
  // Por ahora asumimos confianza o validamos el producto
  
  const validatedData = comercialConfigSchema.parse(data);
  
  await db
    .update(comercialConfig)
    .set({
      ...validatedData,
      updatedAt: new Date(),
    })
    .where(eq(comercialConfig.productId, productId));
    
  revalidatePath("/dashboard/comercial");
  revalidatePath("/dashboard/productos");
  revalidatePath(`/productos/${productId}`);
  revalidatePath("/");
  
  return { success: true };
}

export async function getComercialConfig(productId: string) {
  return await db
    .select()
    .from(comercialConfig)
    .where(eq(comercialConfig.productId, productId))
    .get();
}
