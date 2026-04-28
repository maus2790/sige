"use client";

import { useRouter, usePathname } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { categoryColumns } from "./category-columns";

interface CategoryTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
}

export function CategoryTableClient({
  initialData,
  total,
  pageCount,
  initialPage,
  initialSearch,
}: CategoryTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handlePaginationChange = (pageIndex: number) => {
    const params = new URLSearchParams();
    params.set("page", (pageIndex + 1).toString());
    if (initialSearch) params.set("search", initialSearch);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (search) params.set("search", search);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DataTable
      columns={categoryColumns}
      data={initialData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      isLoading={false}
    />
  );
}