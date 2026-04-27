"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { columns } from "./product-columns";

interface ProductsTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  categories: string[];
}

export function ProductsTableClient({
  initialData,
  pageCount,
  initialPage,
  initialSearch,
  initialCategory,
  categories,
}: ProductsTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = (params: Record<string, string | number | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "") {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    }

    return newSearchParams.toString();
  };

  const handlePaginationChange = (pageIndex: number) => {
    const queryString = createQueryString({ page: pageIndex + 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleSearchChange = (value: string) => {
    const queryString = createQueryString({ search: value, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  const handleCategoryChange = (value: string) => {
    const queryString = createQueryString({ category: value, page: 1 });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  };

  return (
    <DataTable
      columns={columns}
      data={initialData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleCategoryChange}
      categories={categories}
      isLoading={isPending}
    />
  );
}
