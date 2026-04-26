"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { handleForgotPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const result = await handleForgotPassword(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
      toast.success(result.success);
    }

    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Recuperar Contraseña</CardTitle>
        <CardDescription className="text-center">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm">
              {success}
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
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