"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getProductsCursor } from "@/app/actions/products";

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