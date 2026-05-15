import { Metadata } from "next";
import { MapExplorer } from "@/components/marketplace/map-explorer";

export const metadata: Metadata = {
  title: "Explorar Mapa | SIGE Mercado",
  description: "Encuentra tiendas y productos cerca de ti en SIGE Mercado",
};

export default function MapaPage() {
  return (
    <main className="w-full">
      <MapExplorer />
    </main>
  );
}
