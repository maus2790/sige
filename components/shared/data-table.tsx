// components/shared/data-table.tsx

"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Download, Printer, Search, Settings2, AlertTriangle, Loader2, Package } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  onPaginationChange: (pageIndex: number) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onLowStockChange?: (value: boolean) => void;
  initialLowStock?: boolean;
  categories?: string[];
  isLoading?: boolean;
  renderMobileCard?: (row: TData) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSearchChange,
  onCategoryChange,
  onLowStockChange,
  initialLowStock = false,
  categories = [],
  isLoading = false,
  renderMobileCard,
  onLoadMore,
  hasMore = false,
}: DataTableProps<TData, TValue>) {
  const observerTarget = React.useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    manualPagination: true,
    pageCount: pageCount,
  });

  // Infinite Scroll Observer for Mobile
  React.useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading]);

  // Export to Excel
  const exportToExcel = () => {
    const exportData = data.map((row: any) => ({
      "ID / SKU": row.sku || "N/A",
      Nombre: row.name,
      Categoría: row.category,
      Precio: row.price,
      "Stock Actual": row.inventory?.stockActual ?? 0,
      "Stock Mínimo": row.inventory?.stockMinimo ?? 0,
      Ubicación: row.inventory?.ubicacion ?? "N/A",
      Estado: row.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "productos_sige.xlsx");
  };

  // Export to PDF (Print)
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = data.map((row: any) => [
      row.sku || "N/A",
      row.name,
      row.category,
      `Bs. ${row.price}`,
      row.inventory?.stockActual ?? 0,
      row.inventory?.ubicacion ?? "N/A",
      row.status
    ]);

    autoTable(doc, {
      head: [["ID/SKU", "Nombre", "Categoría", "Precio", "Stock", "Ubicación", "Estado"]],
      body: tableData,
    });
    doc.save("productos_sige.pdf");
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-2 w-full md:max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                onSearchChange(event.target.value);
              }}
              className="pl-9"
            />
          </div>
          {onCategoryChange && categories.length > 0 && (
            <select
              className="h-9 w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="todos">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
          {onLowStockChange && (
            <Button
              variant={initialLowStock ? "destructive" : "outline"}
              size="sm"
              onClick={() => onLowStockChange(!initialLowStock)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Stock Bajo
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2 flex-1 sm:flex-none">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2 flex-1 sm:flex-none">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none ml-auto">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Columnas</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border bg-card relative shadow-sm overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {/* Mobile View (Cards) */}
        {renderMobileCard && (
          <div className="md:hidden">
            <div className="flex flex-col divide-y divide-border/50">
              {isLoading && data.length === 0 ? (
                // Skeletons para carga inicial móvil
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/3 mt-2" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <div className="flex gap-3">
                      <Skeleton className="h-9 flex-1 rounded-lg" />
                      <Skeleton className="h-9 flex-1 rounded-lg" />
                    </div>
                  </div>
                ))
              ) : table.getRowModel().rows?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <div key={row.id} className="p-4 transition-colors active:bg-muted/50">
                      {renderMobileCard(row.original)}
                    </div>
                  ))}
                  {/* Target para Infinite Scroll */}
                  {hasMore && (
                    <div ref={observerTarget} className="p-4 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                    </div>
                  )}
                </>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center p-8">
                  <Package className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron productos.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop View (Table) */}
        <div className={cn(
          "overflow-x-auto w-full",
          renderMobileCard ? "hidden md:block" : "block"
        )}>
          <Table className="w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        className={cn(
                          "whitespace-nowrap",
                          (header.column.columnDef.meta as any)?.className
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading && data.length === 0 ? (
                // Skeletons para carga inicial escritorio
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className={cn(
                          "whitespace-nowrap",
                          (cell.column.columnDef.meta as any)?.className
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange(table.getState().pagination.pageIndex - 1)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <div className="flex items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPaginationChange(table.getState().pagination.pageIndex + 1)}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
