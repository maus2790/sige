import { InfiniteFeed } from "@/components/productos/infinite-feed";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIGE Marketplace - Los mejores productos de Bolivia",
  description:
    "Descubre los mejores productos de Bolivia. Compra de manera segura con videos, notificaciones y envíos a todo el país.",
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

export default function HomePage() {
  return <InfiniteFeed />;
}