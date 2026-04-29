"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getUserById, updateUser } from "@/app/actions/admin/users";
import { ImageUpload } from "@/components/upload/image-upload";

const roles = [
  { value: "seller", label: "Vendedor" },
  { value: "assistant", label: "Asistente" },
  { value: "superadmin", label: "Super Administrador" },
];

const videoPlans = [
  { value: "free", label: "Gratis" },
  { value: "video", label: "Video (Bs. 20/mes)" },
  { value: "pro", label: "Pro (Bs. 50/mes)" },
];

export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const data = await getUserById(userId);
      if (!data) {
        toast.error("Usuario no encontrado");
        router.push("/admin/usuarios");
        return;
      }
      setUser(data);
      setAvatarUrl(data.image);
      setIsLoading(false);
    }
    loadUser();
  }, [userId, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (avatarUrl !== undefined) {
      formData.append("image", avatarUrl || "");
    }
    const result = await updateUser(userId, formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(result.message);
      router.push("/admin/usuarios");
    }

    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/usuarios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Usuario</h1>
          <p className="text-muted-foreground mt-1">
            Modifica la información del usuario
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Actualiza los datos del usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={user.name}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={user.phone || ""}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select name="role" defaultValue={user.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoPlan">Plan de video</Label>
                  <Select name="videoPlan" defaultValue={user.videoPlan || "free"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {videoPlans.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <ImageUpload
                    onImagesChange={(urls) => setAvatarUrl(urls[0] || null)}
                    initialImages={user.image ? [user.image] : []}
                    maxImages={1}
                    folder="avatars"
                    label="Avatar del usuario"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/admin/usuarios">
                <Button type="button" variant="outline" disabled={isSaving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}