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

const adminRoutes = [
  '/admin',
  '/admin/',
  '/admin/usuarios',
  '/admin/tiendas',
  '/admin/categorias',
  '/admin/configuracion',
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

function isAdminRoute(pathname: string): boolean {
  for (const route of adminRoutes) {
    if (pathname.startsWith(route)) {
      return true;
    }
  }
  return false;
}

// ============================================
// FUNCIÓN PARA DECODIFICAR EL JWT DE NEXTAUTH
// ============================================
async function getNextAuthSession(request: NextRequest): Promise<{ id: string; role: string } | null> {
  try {
    // NextAuth usa esta cookie para almacenar el JWT
    const sessionToken = request.cookies.get('next-auth.session-token')?.value
      || request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) return null;

    // Importar decode dinámicamente (compatible con Edge Runtime)
    const { decode } = await import('next-auth/jwt');
    
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token) return null;

    return {
      id: (token.id as string) || '',
      role: (token.role as string) || 'seller',
    };
  } catch (error) {
    console.log('[Proxy] Error decoding NextAuth token:', error);
    return null;
  }
}

// ============================================
// PROXY PRINCIPAL
// ============================================
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Proxy] Request: ${pathname}`);

  // 2. Leer cookies de sesión manual
  let userId = request.cookies.get('user_id')?.value;
  let userRole = request.cookies.get('user_role')?.value;

  // 2b. Si no hay cookies manuales, intentar leer la sesión de NextAuth (Google login)
  if (!userId) {
    const nextAuthSession = await getNextAuthSession(request);
    if (nextAuthSession) {
      userId = nextAuthSession.id;
      userRole = nextAuthSession.role;
    }
  }

  // 3. Si es ruta pública...
  if (isPublicRoute(pathname)) {
    // 3a. Si ya está logueado e intenta ir a login/register, redirigir al dashboard
    const authRoutes = ['/auth/login', '/auth/register'];
    if (userId && authRoutes.includes(pathname)) {
      console.log(`[Proxy] Authenticated user ${userId} redirected from ${pathname} to dashboard`);
      let dashboardUrl = '/dashboard';
      if (userRole === 'superadmin') dashboardUrl = '/admin';
      else if (userRole === 'assistant') dashboardUrl = '/assistant';
      
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
    if (userRole !== 'seller' && userRole !== 'superadmin') {
      console.log(`[Proxy] User ${userId} (role: ${userRole}) not authorized for seller route ${pathname}`);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Rutas de asistente
  if (isAssistantRoute(pathname)) {
    if (userRole !== 'assistant' && userRole !== 'superadmin') {
      console.log(`[Proxy] User ${userId} (role: ${userRole}) not authorized for assistant route ${pathname}`);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Rutas de admin
  if (isAdminRoute(pathname)) {
    if (userRole !== 'superadmin') {
      console.log(`[Proxy] User ${userId} (role: ${userRole}) not authorized for admin route ${pathname}`);
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