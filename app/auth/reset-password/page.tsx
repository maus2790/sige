"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { handleResetPassword } from "@/app/actions/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setError("No se proporcionó un token de recuperación");
    }
  }, [token]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    if (!token) {
      setError("Token inválido");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await handleResetPassword(formData, token);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    }
    // Si no hay error, la acción redirige automáticamente al login
  }

  if (!isTokenValid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Enlace inválido</CardTitle>
          <CardDescription className="text-center">
            El enlace de recuperación no es válido o ha expirado
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/auth/forgot-password" className="w-full">
            <Button className="w-full">Solicitar nuevo enlace</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Restablecer Contraseña</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu nueva contraseña
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
          </Button>
          <div className="text-sm text-center">
            <Link href="/auth/login" className="text-muted-foreground hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}