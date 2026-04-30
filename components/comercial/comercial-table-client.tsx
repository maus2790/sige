// components/comercial/comercial-table-client.tsx

"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Eye, EyeOff, MoreHorizontal, Banknote } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { EditComercialDialog } from "./edit-comercial-dialog";
import { ProductImageGallery } from "@/components/products/product-image-gallery";

interface ComercialTableClientProps {
  initialData: any[];
  total: number;
  pageCount: number;
  initialPage: number;
  initialSearch: string;
  initialCategory: string;
  categories: string[];
}

export function ComercialTableClient({
  initialData,
  total,
  pageCount,
  initialPage,
  initialSearch,
  initialCategory,
  categories,
}: ComercialTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);

  function updateFilters(newSearch?: string, newCategory?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch !== undefined) {
      if (newSearch) params.set("search", newSearch);
      else params.delete("search");
    }
    if (newCategory !== undefined) {
      if (newCategory && newCategory !== "todos") params.set("category", newCategory);
      else params.delete("category");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilters(search)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={(val) => {
            setCategory(val);
            updateFilters(search, val);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => updateFilters(search, category)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>P. Adquisición</TableHead>
              <TableHead>P. Venta</TableHead>
              <TableHead>P. Oferta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProductImageGallery
                      images={item.imageUrls || []}
                      productName={item.name}
                      className="w-10 h-10 shrink-0 shadow-sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{item.category}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  Bs. {item.comercialConfig?.precioAdquisicion?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell className="font-bold">
                  Bs. {item.comercialConfig?.precioVenta?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {item.comercialConfig?.precioOferta ? (
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                        Bs. {item.comercialConfig.precioOferta.toFixed(2)}
                        {item.comercialConfig.ofertaPorcentaje > 0 && ` (${item.comercialConfig.ofertaPorcentaje}% OFF)`}
                      </Badge>
                      {item.comercialConfig.fechaFinOferta && (
                        <span className="text-[10px] text-muted-foreground">
                          Expira en {Math.max(0, Math.ceil((new Date(item.comercialConfig.fechaFinOferta).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días
                        </span>
                      )}
                      {item.comercialConfig.limiteCompra && (
                        <span className="text-[10px] text-muted-foreground">
                          Límite: {item.comercialConfig.limiteCompra} unid.
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {item.comercialConfig?.isPublished ? (
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                      <Eye className="h-3 w-3" /> Público
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1">
                      <EyeOff className="h-3 w-3" /> Oculto
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <EditComercialDialog 
                    product={item}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {initialData.length} de {total} productos
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={initialPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", (initialPage - 1).toString());
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={initialPage >= pageCount}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("page", (initialPage + 1).toString());
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
