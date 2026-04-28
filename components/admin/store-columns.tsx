"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, Store as StoreIcon } from "lucide-react";

export const storeColumns: ColumnDef<any>[] = [
  {
    accessorKey: "logoUrl",
    header: "Logo",
    cell: ({ row }) => {
      const logoUrl = row.getValue("logoUrl") as string | undefined;
      const storeName = row.getValue("name") as string;
      return (
        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <StoreIcon className="w-5 h-5 text-muted-foreground" />
          )}
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
        <p className="text-xs text-muted-foreground line-clamp-1">
          {row.original.description || "Sin descripción"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: "Propietario",
    cell: ({ row }) => {
      const user = row.getValue("user") as { name?: string; email?: string };
      return (
        <div>
          <p className="text-sm font-medium">{user?.name || "—"}</p>
          <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Registro",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      if (!date) return "—";
      return new Date(date).toLocaleDateString("es-BO");
    },
  },
  {
    accessorKey: "verified",
    header: "Estado",
    cell: ({ row }) => {
      const verified = row.getValue("verified") as boolean;
      return verified ? (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verificada
        </Badge>
      ) : (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const store = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/tiendas/${store.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      );
    },
  },
];