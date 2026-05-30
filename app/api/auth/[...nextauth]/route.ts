import NextAuth from "next-auth";
import { nextauthConfig } from "@/lib/nextauth.config";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth(nextauthConfig);

// Wrapper con manejo de errores para evitar respuestas HTML durante cold start de Turbopack.
// En Next.js 16+ los params del contexto son una Promise (breaking change).
async function safeHandler(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const url = new URL(req.url);
    const isSessionRoute = url.pathname.endsWith("/session");
    const isLogRoute = url.pathname.endsWith("/_log");

    // El endpoint /_log solo registra errores del cliente: silenciar siempre
    if (isLogRoute) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Llamar al handler original de NextAuth
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (handler as any)(req, ctx);

    // Proteger /session: si por alguna razón devuelve HTML (HTML 404 de cold start)
    // devolver sesión vacía válida en lugar de explotar el cliente
    if (isSessionRoute && response) {
      const contentType = (response as Response).headers?.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        console.warn(
          "[NextAuth] /session devolvió no-JSON durante cold start. Usando sesión vacía."
        );
        return NextResponse.json({}, { status: 200 });
      }
    }

    return response;
  } catch (error) {
    console.error("[NextAuth] Error en handler:", error);

    const url = new URL(req.url);

    // Para /session: devolver sesión vacía (usuario no autenticado) en lugar de 500/HTML
    if (url.pathname.endsWith("/session")) {
      return NextResponse.json({}, { status: 200 });
    }
    // Para /_log: ignorar silenciosamente
    if (url.pathname.endsWith("/_log")) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Servicio de autenticación temporalmente no disponible" },
      { status: 503 }
    );
  }
}

export { safeHandler as GET, safeHandler as POST };