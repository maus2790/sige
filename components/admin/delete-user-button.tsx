"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "@/app/actions/admin/users";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  className?: string;
}

export function DeleteUserButton({ userId, userName, className }: DeleteUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function onDelete() {
    setIsLoading(true);
    try {
      const result = await deleteUser(userId);
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else {
        toast.success("Usuario eliminado exitosamente");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el usuario");
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("text-destructive hover:text-destructive hover:bg-destructive/10", className)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Eliminarás permanentemente al usuario
            <strong> {userName}</strong> y todos sus datos asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
