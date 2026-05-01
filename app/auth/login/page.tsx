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
import { Loader2, Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
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

    const result = await handleLogin(formData);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      setIsPending(false);
      return;
    }

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
    
    const role = result.user?.role;
    const callbackUrl = searchParams.get("callbackUrl");
    
    if (callbackUrl) {
      window.location.href = callbackUrl;
      return;
    }

    let targetPath = "/dashboard";
    if (role === "superadmin") targetPath = "/admin";
    else if (role === "assistant") targetPath = "/assistant";
    
    window.location.href = targetPath;
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <Card className="glass-card border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center tracking-tight">Bienvenido</CardTitle>
          <CardDescription className="text-center text-muted-foreground/80">
            Ingresa tus credenciales para acceder al panel
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
              <Label htmlFor="email" className="text-sm font-semibold ml-1">Email</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={isPending}
                  className="pl-10 py-6 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="Contraseña" className="text-sm font-semibold">Contraseña</Label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
                  disabled={isPending}
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
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-6 pt-2 pb-8">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full py-6 text-base font-bold bg-brand-gradient hover:bg-brand-gradient-hover text-white border-none shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98] rounded-xl"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center">
                  Iniciar Sesión <ArrowRight className="ml-2 w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  o accede con
                </span>
              </div>
            </div>

            <GoogleSignInButton callbackUrl={searchParams.get("callbackUrl") || undefined} />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link 
                  href={`/auth/register${searchParams.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}` : ""}`} 
                  className="text-primary font-bold hover:underline underline-offset-4"
                >
                  Regístrate gratis
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
