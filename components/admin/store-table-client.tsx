"use client";

import { useRouter, usePathname } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { storeColumns } from "./store-columns";

interface StoreTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialVerified: string;
}

export function StoreTableClient({
  initialData,
  total,
  pageCount,
  initialPage,
  initialSearch,
  initialVerified,
}: StoreTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handlePaginationChange = (pageIndex: number) => {
    const params = new URLSearchParams();
    params.set("page", (pageIndex + 1).toString());
    if (initialSearch) params.set("search", initialSearch);
    if (initialVerified && initialVerified !== "todos") params.set("verified", initialVerified);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (search) params.set("search", search);
    if (initialVerified && initialVerified !== "todos") params.set("verified", initialVerified);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleVerifiedChange = (verified: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (initialSearch) params.set("search", initialSearch);
    if (verified && verified !== "todos") params.set("verified", verified);
    router.push(`${pathname}?${params.toString()}`);
  };

  const verifiedOptions = [
    { value: "todos", label: "Todos los estados" },
    { value: "verified", label: "Verificadas" },
    { value: "pending", label: "Pendientes" },
  ];

  return (
    <DataTable
      columns={storeColumns}
      data={initialData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleVerifiedChange}
      categories={verifiedOptions.map(opt => opt.label)}
      isLoading={false}
    />
  );
}