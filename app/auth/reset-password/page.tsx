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
import { Lock, Eye, EyeOff, RefreshCcw, ArrowLeft, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  }

  if (!isTokenValid) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <Card className="glass-card border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center tracking-tight">Enlace Inválido</CardTitle>
            <CardDescription className="text-center text-muted-foreground/80">
              El enlace de recuperación no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full py-6 font-bold bg-brand-gradient hover:bg-brand-gradient-hover text-white rounded-xl shadow-lg shadow-primary/25">
                Solicitar nuevo enlace
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <Card className="glass-card border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <RefreshCcw className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center tracking-tight">Nueva Contraseña</CardTitle>
          <CardDescription className="text-center text-muted-foreground/80">
            Establece tu nueva contraseña de acceso
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password" title="Nueva Contraseña" className="text-sm font-semibold ml-1">Nueva Contraseña</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 py-6 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 px-1 italic">
                * Mínimo 6 caracteres.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" title="Confirmar Nueva Contraseña" className="text-sm font-semibold ml-1">Confirmar Nueva Contraseña</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pl-10 pr-10 py-6 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-6 pt-2 pb-8">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full py-6 text-base font-bold bg-brand-gradient hover:bg-brand-gradient-hover text-white border-none shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98] rounded-xl"
            >
              Restablecer Contraseña
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="mr-2 w-4 h-4" /> Volver al inicio
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}