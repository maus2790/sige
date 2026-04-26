"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <CardTitle className="text-2xl">Acceso No Autorizado</CardTitle>
          <CardDescription>
            No tienes permisos para acceder a esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Esta área está restringida para usuarios con roles específicos.</p>
          <p className="mt-2">Si crees que esto es un error, contacta al administrador.</p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}