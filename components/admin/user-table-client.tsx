"use client";

import { useRouter, usePathname } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { userColumns } from "./user-columns";

interface UserTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialRole: string;
  roles: string[];
}

export function UserTableClient({
  initialData,
  total,
  pageCount,
  initialPage,
  initialSearch,
  initialRole,
  roles,
}: UserTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handlePaginationChange = (pageIndex: number) => {
    const params = new URLSearchParams();
    params.set("page", (pageIndex + 1).toString());
    if (initialSearch) params.set("search", initialSearch);
    if (initialRole && initialRole !== "todos") params.set("role", initialRole);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchChange = (search: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (search) params.set("search", search);
    if (initialRole && initialRole !== "todos") params.set("role", initialRole);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRoleChange = (role: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (initialSearch) params.set("search", initialSearch);
    if (role && role !== "todos") params.set("role", role);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DataTable
      columns={userColumns}
      data={initialData}
      pageCount={pageCount}
      onPaginationChange={handlePaginationChange}
      onSearchChange={handleSearchChange}
      onCategoryChange={handleRoleChange}
      categories={roles}
      isLoading={false}
    />
  );
}