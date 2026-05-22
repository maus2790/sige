"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProductBackButtonProps {
  storeId?: string | null;
}

export function ProductBackButton({ storeId }: ProductBackButtonProps) {
  const [backUrl, setBackUrl] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      if (from === "store" && storeId) {
        setBackUrl(`/tienda/${storeId}`);
      }
    }
  }, [storeId]);

  return (
    <Link href={backUrl}>
      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors">
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </Button>
    </Link>
  );
}
