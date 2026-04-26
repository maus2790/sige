//proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// RUTAS PÚBLICAS (no requieren autenticación)
// ============================================
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/favicon.ico',
  '/manifest.json',
  '/productos',
  '/productos/',
  '/tiendas',
  '/tiendas/',
  '/search',
  '/categories',
  '/categories/',
];

// Rutas que comienzan con estos patrones (públicas)
const publicPatterns = [
  '/productos/',
  '/tiendas/',
  '/categories/',
];

// ============================================
// RUTAS PROTEGIDAS POR ROL
// ============================================
const sellerRoutes = [
  '/dashboard',
  '/dashboard/',
  '/dashboard/productos',
  '/dashboard/inventario',
  '/dashboard/pedidos',
  '/dashboard/analytics',
  '/dashboard/configuracion',
];

const assistantRoutes = [
  '/assistant',
  '/assistant/',
  '/assistant/verificaciones',
  '/assistant/pagos-pendientes',
  '/assistant/tiendas',
];

// ============================================
// FUNCIÓN PARA VERIFICAR SI UNA RUTA ES PÚBLICA
// ============================================
function isPublicRoute(pathname: string): boolean {
  // Permitir archivos estáticos comunes (con extensiones)
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf'];
  if (staticExtensions.some(ext => pathname.endsWith(ext))) {
    return true;
  }

  // Verificar rutas exactas
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Verificar patrones públicos
  for (const pattern of publicPatterns) {
    if (pathname.startsWith(pattern)) {
      return true;
    }
  }

  return false;
}

// ============================================
// FUNCIÓN PARA VERIFICAR SI UNA RUTA ES DE VENDEDOR
// ============================================
function isSellerRoute(pathname: string): boolean {
  for (const route of sellerRoutes) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }
  return false;
}

// ============================================
// FUNCIÓN PARA VERIFICAR SI UNA RUTA ES DE ASISTENTE
// ============================================
function isAssistantRoute(pathname: string): boolean {
  for (const route of assistantRoutes) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }
  return false;
}

// ============================================
// PROXY PRINCIPAL
// ============================================
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Proxy] Request: ${pathname}`);

  // 2. Leer cookies de sesión (ahora unificadas para manual y Google)
  const userId = request.cookies.get('user_id')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // 3. Si es ruta pública...
  if (isPublicRoute(pathname)) {
    // 3a. Si ya está logueado e intenta ir a login/register, redirigir al dashboard
    const authRoutes = ['/auth/login', '/auth/register'];
    if (userId && authRoutes.includes(pathname)) {
      console.log(`[Proxy] Authenticated user ${userId} redirected from ${pathname} to dashboard`);
      const dashboardUrl = userRole === 'assistant' ? '/assistant' : '/dashboard';
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    console.log(`[Proxy] Public route: ${pathname}`);
    return NextResponse.next();
  }

  // 4. Si NO es ruta pública y NO hay sesión, redirigir a login
  if (!userId) {
    console.log(`[Proxy] No session found, redirecting to login from ${pathname}`);
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Verificar roles según la ruta solicitada
  const unauthorizedUrl = new URL('/unauthorized', request.url);

  // Rutas de vendedor
  if (isSellerRoute(pathname)) {
    if (userRole !== 'seller') {
      console.log(`[Proxy] User ${userId} (role: ${userRole}) not authorized for seller route ${pathname}`);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Rutas de asistente
  if (isAssistantRoute(pathname)) {
    if (userRole !== 'assistant') {
      console.log(`[Proxy] User ${userId} (role: ${userRole}) not authorized for assistant route ${pathname}`);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Permitir acceso
  return NextResponse.next();
}

// ============================================
// CONFIGURACIÓN DEL MATCHER
// ============================================
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory (public assets)
     * - api routes (API endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};