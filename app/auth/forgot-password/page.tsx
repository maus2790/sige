"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { handleForgotPassword } from "@/app/actions/auth";
import { Mail, KeyRound, ArrowLeft, Send } from "lucide-react";

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
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <Card className="glass-card border-white/20 dark:border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="space-y-2 pb-6">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center tracking-tight">Recuperar Acceso</CardTitle>
          <CardDescription className="text-center text-muted-foreground/80">
            Te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-shake">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium border border-green-500/20">
                {success}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">Email registrado</Label>
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
                  disabled={isLoading}
                  className="pl-10 py-6 bg-background/50 border-white/10 focus:bg-background transition-all duration-300 rounded-xl"
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-6 pt-2 pb-8">
            <Button
              type="submit"
              loading={isLoading}
              className="w-full py-6 text-base font-bold bg-brand-gradient hover:bg-brand-gradient-hover text-white border-none shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98] rounded-xl"
            >
              <span className="flex items-center">
                Enviar enlace <Send className="ml-2 w-4 h-4" />
              </span>
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/login" 
                className="text-sm text-muted-foreground hover:text-primary font-medium flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="mr-2 w-4 h-4" /> Volver al inicio de sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}