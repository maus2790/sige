"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { handleLogin } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mostrar mensajes según los parámetros de URL
    const registered = searchParams.get("registered");
    const reset = searchParams.get("reset");

    if (registered === "true") {
      toast.success("¡Registro exitoso! Ahora puedes iniciar sesión");
    }
    if (reset === "true") {
      toast.success("Contraseña restablecida. Inicia sesión con tu nueva contraseña");
    }
  }, [searchParams]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await handleLogin(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsLoading(false);
    }
    // Si no hay error, la acción redirige automáticamente
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder a tu cuenta
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>

          {/* Separador */}
          <div className="relative my-2 w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>

          {/* Botón de Google */}
          <GoogleSignInButton />

          <div className="text-sm text-center space-y-2">
            <Link href="/auth/forgot-password" className="text-primary hover:underline block">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link href="/auth/register" className="text-muted-foreground hover:underline block">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}