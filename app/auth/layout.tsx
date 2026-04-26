//app/auth/layout.tsx
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
      <div className="w-full max-w-md mx-4">
        <Suspense fallback={<div className="text-center text-muted-foreground">Cargando...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}