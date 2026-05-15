"use server";

import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { uploadImageFromBuffer, deleteImage } from "@/lib/cloudflare";
import { revalidatePath } from "next/cache";

export async function updateStore(storeId: string, data: {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  themeConfig?: string;
  bannerUrl?: string;
  logoUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado" };

  try {
    const store = await db.select().from(stores).where(eq(stores.id, storeId)).get();
    if (!store || store.userId !== user.id) {
      return { error: "No tienes permiso para editar esta tienda" };
    }

    await db.update(stores)
      .set({
        ...data,
      })
      .where(eq(stores.id, storeId))
      .run();

    revalidatePath(`/tienda/${storeId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating store:", error);
    return { error: "Error al actualizar la tienda" };
  }
}

export async function updateStoreLogo(storeId: string, base64Image: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado" };

  try {
    const store = await db.select().from(stores).where(eq(stores.id, storeId)).get();
    if (!store || store.userId !== user.id) {
      return { error: "No tienes permiso para editar esta tienda" };
    }

    // Convert base64 to Buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Upload to R2
    const fileName = `stores/${storeId}/logo-${Date.now()}.png`;
    const uploadResult = await uploadImageFromBuffer(buffer, fileName, "image/png");

    if (!uploadResult) throw new Error("Upload failed");

    // Delete old logo if exists
    if (store.logoUrl) {
      const oldKey = store.logoUrl.split("/").slice(-3).join("/");
      if (oldKey.includes("stores/")) {
        await deleteImage(oldKey);
      }
    }

    // Update DB
    await db.update(stores)
      .set({ logoUrl: uploadResult.url })
      .where(eq(stores.id, storeId))
      .run();

    revalidatePath(`/tienda/${storeId}`);
    return { success: true, url: uploadResult.url };
  } catch (error) {
    console.error("Error updating store logo:", error);
    return { error: "Error al actualizar el logo" };
  }
}

export async function updateStoreBanner(storeId: string, base64Image: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado" };

  try {
    const store = await db.select().from(stores).where(eq(stores.id, storeId)).get();
    if (!store || store.userId !== user.id) {
      return { error: "No tienes permiso para editar esta tienda" };
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `stores/${storeId}/banner-${Date.now()}.png`;
    const uploadResult = await uploadImageFromBuffer(buffer, fileName, "image/png");

    if (!uploadResult) throw new Error("Upload failed");

    if (store.bannerUrl) {
      const oldKey = store.bannerUrl.split("/").slice(-3).join("/");
      if (oldKey.includes("stores/")) {
        await deleteImage(oldKey);
      }
    }

    await db.update(stores)
      .set({ bannerUrl: uploadResult.url })
      .where(eq(stores.id, storeId))
      .run();

    revalidatePath(`/tienda/${storeId}`);
    return { success: true, url: uploadResult.url };
  } catch (error) {
    console.error("Error updating store banner:", error);
    return { error: "Error al actualizar la portada" };
  }
}
