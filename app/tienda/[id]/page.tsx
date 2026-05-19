import { getStoreDetails, getStoreProducts } from "@/app/actions/storefront";
import { getCategories } from "@/app/actions/categories";
import { StoreFeed } from "@/components/productos/store-feed";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCurrentUser } from "@/app/actions/auth";

interface StorePageProps {
  params: Promise<{ id: string }>;
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
  
  // getCurrentUser is fetched in parallel but does NOT block the cached data fetches.
  // By isolating it here (not inside the cached actions), the store/product caches
  // remain valid even though this page is dynamically rendered per request.
  const [store, initialProducts, user, categoriesList] = await Promise.all([
    getStoreDetails(id),
    getStoreProducts(id, 1),
    getCurrentUser(),
    getCategories(),
  ]);

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <StoreFeed 
        store={store} 
        initialProducts={initialProducts} 
        myUserId={user?.id ?? null}
        categories={categoriesList}
      />
    </main>
  );
}
