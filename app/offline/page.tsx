import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <CardTitle className="text-2xl">Sin conexión</CardTitle>
          <CardDescription>
            Parece que no tienes conexión a internet
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Verifica tu conexión y vuelve a intentarlo.</p>
          <p className="mt-2">Una vez que recuperes la conexión, podrás usar todas las funciones de SIGE Marketplace.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">Intentar de nuevo</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}