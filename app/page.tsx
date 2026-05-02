// app/page.tsx

import { InfiniteFeed } from "@/components/productos/infinite-feed";
import { getCategories } from "@/app/actions/categories";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIGE Mercado - Los mejores productos de Bolivia",
  description:
    "Explora el mercado global de Bolivia. Compra de manera segura con envíos a todo el país y la mejor selección de productos locales.",
  keywords: "marketplace, Bolivia, compras online, productos, tiendas",
  openGraph: {
    title: "SIGE Marketplace",
    description: "Los mejores productos de Bolivia",
    url: "https://sige.click",
    siteName: "SIGE Marketplace",
    images: [
      {
        url: "https://sige.click/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "SIGE Marketplace",
      },
    ],
    type: "website",
  },
};

export default async function HomePage() {
  const categories = await getCategories();
  
  return <InfiniteFeed initialCategories={categories} />;
}