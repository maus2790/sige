//app/auth/layout.tsx
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background for premium feel */}
      <div className="absolute inset-0 bg-brand-gradient opacity-5 blur-3xl -z-10 animate-float" />
      
      <div className="w-full max-w-md mx-auto z-10">
        <Suspense fallback={<div className="text-center text-muted-foreground">Cargando...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}