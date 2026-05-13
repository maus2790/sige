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
        queryFn: ({ pageParam }) =>
            getProductsCursor(pageParam, limit, category, search),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    });
}

interface UseStoreInfiniteScrollProps {
    storeId: string;
    limit?: number;
    initialData?: any;
    search?: string;
}

export function useStoreInfiniteScroll({
    storeId,
    limit = 20,
    initialData,
    search,
}: UseStoreInfiniteScrollProps) {
    return useInfiniteQuery({
        queryKey: ["store-products", storeId, search],
        queryFn: ({ pageParam = 1 }) =>
            getStoreProducts(storeId, pageParam as number, limit, search),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return (lastPage as any[]).length === limit ? allPages.length + 1 : undefined;
        },
        initialData: initialData ? { pages: [initialData], pageParams: [1] } : undefined,
    });
}