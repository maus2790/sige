"use client";

import { useState, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { handleLogin } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
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
    setIsPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Verificar credenciales y establecer cookies personalizadas (para compatibilidad)
    const result = await handleLogin(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsPending(false);
      return;
    }

    // 2. Iniciar sesión en NextAuth para unificar la sesión y que la Navbar se actualice
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.error("Error al sincronizar sesión");
      setIsPending(false);
      return;
    }

    toast.success("¡Bienvenido de nuevo!");
    
    // Redirigir según el rol del usuario devuelto por handleLogin
    const role = result.user?.role;
    let targetPath = "/dashboard";
    
    if (role === "superadmin") targetPath = "/admin";
    else if (role === "assistant") targetPath = "/assistant";
    
    window.location.href = targetPath;
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
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton />

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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Acceder
    </Button>
  );
}