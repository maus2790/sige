import { InfiniteFeed } from "@/components/productos/infinite-feed";
import { getCategories } from "@/app/actions/categories";

export default async function SearchPage() {
  const initialCategories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-6">
      <InfiniteFeed initialCategories={initialCategories} />
    </div>
  );
}