"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssistantPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel del Asistente</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, {user?.name || "Asistente"}</CardTitle>
            <CardDescription>
              Aquí podrás gestionar verificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Email: {user?.email}</p>
            <p>Rol: {user?.role}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes</CardTitle>
            <CardDescription>Verifica pagos de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Próximamente: Listado de pagos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Verificaciones</CardTitle>
            <CardDescription>Revisa solicitudes pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Próximamente: Listado de verificaciones</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}