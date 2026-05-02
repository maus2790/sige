import { getStoreDetails, getStoreProducts } from "@/app/actions/storefront";
import { StoreFeed } from "@/components/productos/store-feed";
import { notFound } from "next/navigation";
import { Metadata } from "next";

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
  
  const [store, initialProducts] = await Promise.all([
    getStoreDetails(id),
    getStoreProducts(id, 1, 20),
  ]);

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <StoreFeed store={store} initialProducts={initialProducts} />
    </main>
  );
}
