import { getStoreDetails, getStoreProducts } from "@/app/actions/storefront";
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
  
  const [store, initialProducts, user] = await Promise.all([
    getStoreDetails(id),
    getStoreProducts(id, 1, 20),
    getCurrentUser(),
  ]);

  if (!store) {
    notFound();
  }

  const isOwner = user?.id === store.userId;

  return (
    <main className="min-h-screen">
      <StoreFeed 
        store={store} 
        initialProducts={initialProducts} 
        isOwner={isOwner}
      />
    </main>
  );
}
