"use server";

import { db } from "@/db";
import { stores, systemConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "./auth";

const facturacionConfigSchema = z.object({
  nitEmpresa: z.string().trim().optional().default(""),
  regimenTributario: z.enum(["REGIMEN_GENERAL", "REGIMEN_SIMPLIFICADO", "INFORMAL"]).default("INFORMAL"),
  tokenApiFacturacion: z.string().trim().optional().default(""),
  suscripcionActiva: z.boolean().default(false),
  simulacionSiat: z.enum(["EXITOSA", "RECHAZADA", "SIN_CONEXION"]).default("EXITOSA"),
  precioReciboFactor: z.number().min(0.01).max(10).default(0.9),
  precioFacturadoFactor: z.number().min(0.01).max(10).default(1),
  proformaFormalPorDefecto: z.boolean().default(true),
});

export type FacturacionConfig = z.infer<typeof facturacionConfigSchema>;

const defaultFacturacionConfig: FacturacionConfig = {
  nitEmpresa: "1020309021",
  regimenTributario: "REGIMEN_GENERAL",
  tokenApiFacturacion: "token-siat-simulado",
  suscripcionActiva: true,
  simulacionSiat: "EXITOSA",
  precioReciboFactor: 0.9,
  precioFacturadoFactor: 1,
  proformaFormalPorDefecto: true,
};

function configKey(storeId: string) {
  return `facturacion:${storeId}`;
}

async function getCurrentStore() {
  const user = await requireRole(["seller", "assistant", "superadmin"]);

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    throw new Error("No tienes una tienda asociada.");
  }

  return store;
}

export async function getFacturacionConfigForStore(storeId: string) {
  const row = await db
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.key, configKey(storeId)))
    .get();

  if (!row) {
    return defaultFacturacionConfig;
  }

  try {
    return facturacionConfigSchema.parse({
      ...defaultFacturacionConfig,
      ...JSON.parse(row.value),
    });
  } catch {
    return defaultFacturacionConfig;
  }
}

export async function getFacturacionConfig() {
  const store = await getCurrentStore();
  const config = await getFacturacionConfigForStore(store.id);

  return {
    store: {
      id: store.id,
      name: store.name,
    },
    config,
  };
}

export async function updateFacturacionConfig(input: FacturacionConfig) {
  const store = await getCurrentStore();
  const config = facturacionConfigSchema.parse(input);
  const key = configKey(store.id);
  const value = JSON.stringify(config);

  const existing = await db
    .select({ key: systemConfig.key })
    .from(systemConfig)
    .where(eq(systemConfig.key, key))
    .get();

  if (existing) {
    await db
      .update(systemConfig)
      .set({
        value,
        updatedAt: new Date(),
      })
      .where(eq(systemConfig.key, key));
  } else {
    await db.insert(systemConfig).values({
      key,
      value,
      updatedAt: new Date(),
    });
  }

  revalidatePath("/dashboard/facturacion");

  return { success: true };
}
