import { getStoreDetails, getStoreProducts } from "@/app/actions/storefront";
import { getCategories } from "@/app/actions/categories";
import { StoreFeed } from "@/components/productos/store-feed";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCurrentUser } from "@/app/actions/auth";
import { getSystemConfig } from "@/app/actions/config";
import { cookies } from "next/headers";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getActiveStoreGiftCardTemplates } from "@/app/actions/gift-cards";

interface StorePageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const activeStores = await db
      .select({ id: stores.id })
      .from(stores)
      .orderBy(desc(stores.createdAt))
      .limit(5)
      .all();

    return activeStores.map((s) => ({
      id: s.id,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams for stores:", error);
    return [];
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await getStoreDetails(id);

  if (!store) return { title: "Tienda no encontrada" };

  return {
    title: `${store.name} - SIGE Mercado`,
    description: store.description || `Visita la tienda oficial de ${store.name} en SIGE Mercado.`,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;

  const config = await getSystemConfig();
  const isrMode = config.isrEnabled ? "ISR ⚡ Nivel 2" : "Dinamico 🔄";
  console.log(`[PAGE 🏪] Renderizando Tienda ID: ${id} | Modo: ${isrMode}`);
  
  let user = null;
  if (!config.isrEnabled) {
    // Bypass: force dynamic rendering and fetch user on the server
    await cookies();
    user = await getCurrentUser();
  }

  // Fetch store, initial products, categories, and gift card templates
  const [store, initialProducts, categoriesList, giftCardTemplates] = await Promise.all([
    getStoreDetails(id),
    getStoreProducts(id, 1),
    getCategories(),
    getActiveStoreGiftCardTemplates(id),
  ]);

  if (!store) {
    notFound();
  }

  console.log(`[PAGE 🏪] Tienda cargada: "${store.name}" (${initialProducts.length} productos en pagina 1)`);

  return (
    <main className="min-h-screen">
      <StoreFeed
        store={store}
        initialProducts={initialProducts}
        myUserId={user?.id ?? null}
        categories={categoriesList}
        hasGiftCards={giftCardTemplates.length > 0}
        giftCardTemplates={giftCardTemplates}
      />
    </main>
  );
}
