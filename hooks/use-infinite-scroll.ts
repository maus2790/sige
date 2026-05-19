"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getProductsCursor } from "@/app/actions/products";
import { getStoreProducts } from "@/app/actions/storefront";

interface UseInfiniteScrollProps {
    category?: string;
    search?: string;
    limit?: number;
}

export function useInfiniteScroll({
    category,
    search,
    limit = 12,
}: UseInfiniteScrollProps) {
    return useInfiniteQuery({
        queryKey: ["products", category, search],
        queryFn: ({ pageParam = 1 }) =>
            getProductsCursor(pageParam as number, limit, category, search),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return (lastPage.items as any[]).length > 0 ? allPages.length + 1 : undefined;
        },
    });
}

interface UseStoreInfiniteScrollProps {
    storeId: string;
    limit?: number;
    initialData?: any;
    search?: string;
    category?: string;
}

export function useStoreInfiniteScroll({
    storeId,
    limit = 20,
    initialData,
    search,
    category,
}: UseStoreInfiniteScrollProps) {
    return useInfiniteQuery({
        queryKey: ["store-products", storeId, search, category],
        queryFn: ({ pageParam = 1 }) =>
            getStoreProducts(storeId, pageParam as number, limit, search, category),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return (lastPage as any[]).length > 0 ? allPages.length + 1 : undefined;
        },
        initialData: (initialData && !search && !category) ? { pages: [initialData], pageParams: [1] } : undefined,
        // Treat initialData as fresh for 60s — prevents React Query from immediately
        // background-refetching when the server already served up-to-date cached data.
        initialDataUpdatedAt: Date.now(),
        staleTime: 60 * 1000,
    });
}