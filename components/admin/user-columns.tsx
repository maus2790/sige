"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Store } from "lucide-react";
import Link from "next/link";

export const userColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
        seller: { label: "Vendedor", variant: "default" },
        assistant: { label: "Asistente", variant: "secondary" },
        superadmin: { label: "Super Admin", variant: "destructive" },
      };
      const config = roleConfig[role] || { label: role, variant: "outline" };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => row.getValue("phone") || "—",
  },
  {
    accessorKey: "videoPlan",
    header: "Plan de video",
    cell: ({ row }) => {
      const plan = row.getValue("videoPlan") as string;
      const planConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
        free: { label: "Gratis", variant: "outline" },
        video: { label: "Video", variant: "default" },
        pro: { label: "Pro", variant: "secondary" },
      };
      const config = planConfig[plan] || { label: plan, variant: "outline" };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "store",
    header: "Tienda",
    cell: ({ row }) => {
      const store = row.getValue("store") as { name: string; verified: boolean } | null;
      const role = row.getValue("role") as string;
      
      if (role !== "seller") return <span className="text-muted-foreground">—</span>;
      if (!store) return <span className="text-muted-foreground">Sin tienda</span>;
      
      return (
        <div className="flex items-center gap-2">
          <Store className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm">{store.name}</span>
          {store.verified ? (
            <Badge variant="default" className="text-xs bg-green-100 text-green-700">Verificada</Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">Pendiente</Badge>
          )}
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
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/usuarios/${user.id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      );
    },
  },
];