"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { handleRegister } from "@/app/actions/auth";
import { User, Mail, Lock, UserPlus, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({ name: "", email: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await handleRegister(formData, callbackUrl || undefined);

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      if (result.fields) {
        setFields(result.fields);
      }
      setIsLoading(false);
    }
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <Card className="glass-card border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="space-y-1 pb-3 pt-0">
          <div className="hidden sm:flex justify-center mb-1">
            <div className="p-1.5 bg-primary/10 rounded-full">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center tracking-tight">Crear Cuenta</CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm text-muted-foreground/80">
            Únete a SIGE para comenzar a gestionar tu negocio
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-3 pb-2">
            {error && (
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs sm:text-sm font-medium border border-destructive/20 animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs sm:text-sm font-semibold ml-1">Nombre completo</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre"
                  defaultValue={fields.name}
                  required
                  disabled={isLoading}
                  className="h-11 pl-10 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-semibold ml-1">Email</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  defaultValue={fields.email}
                  required
                  disabled={isLoading}
                  className="h-11 pl-10 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" title="Contraseña" className="text-xs sm:text-sm font-semibold ml-1">Contraseña</Label>
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
                    className="h-11 pl-10 pr-10 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
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
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" title="Confirmar Contraseña" className="text-xs sm:text-sm font-semibold ml-1">Confirmar</Label>
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
                    className="h-11 pl-10 pr-10 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
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
            </div>
            <p className="text-[10px] text-muted-foreground/60 px-1 italic">
              * La contraseña debe tener al menos 6 caracteres.
            </p>

            <div className="flex items-start gap-2 px-1 pt-1">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-background/50 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-muted-foreground leading-snug cursor-pointer select-none">
                Acepto los{" "}
                <Link href="/terms" className="text-primary hover:underline font-semibold">Términos y Condiciones</Link>
                {" "}y la{" "}
                <Link href="/privacy" className="text-primary hover:underline font-semibold">Política de Privacidad</Link>.
              </label>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3.5 pt-1 pb-0">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-11 text-sm font-bold bg-brand-gradient hover:bg-brand-gradient-hover text-white border-none shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98] rounded-xl"
            >
              <span className="flex items-center">
                Registrarse ahora <ArrowRight className="ml-2 w-4 h-4" />
              </span>
            </Button>

            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link 
                  href="/auth/login" 
                  className="text-primary font-bold hover:underline underline-offset-4"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
