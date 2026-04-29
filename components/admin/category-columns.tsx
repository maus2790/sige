"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export const categoryColumns: ColumnDef<any>[] = [
  {
    accessorKey: "icon",
    header: "Icono",
    cell: ({ row }) => {
      const icon = row.getValue("icon") as string | undefined;
      return (
        <div className="text-2xl w-10 h-10 flex items-center justify-center bg-muted rounded-lg">
          {icon || "📁"}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue("name")}</p>
        <p className="text-xs text-muted-foreground">
          Slug: {row.original.slug}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "productsCount",
    header: "Productos",
    cell: ({ row }) => {
      const count = row.getValue("productsCount") as number;
      return (
        <Badge variant={count > 0 ? "default" : "secondary"}>
          {count} producto{count !== 1 ? "s" : ""}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const category = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/categorias/${category.id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      );
    },
  },
];