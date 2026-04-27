"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ProductToastHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");

    if (created === "true") toast.success("Producto creado exitosamente");
    if (updated === "true") toast.success("Producto actualizado exitosamente");
    if (deleted === "true") toast.success("Producto eliminado exitosamente");
  }, [searchParams]);

  return null;
}
