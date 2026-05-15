"use client";


import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Store,
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  X,
  ChevronDown,
  Download,
  Plus,
  Gift,
  Sparkles,
  Navigation
} from "lucide-react";

import { usePWAInstall } from "@/hooks/use-pwa-install";
import { QuickPublishModal } from "@/components/productos/quick-publish-modal";
import { NotificationCenter } from "./notification-center";
import { useCart } from "@/hooks/use-cart";


import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { handleLogout } from "@/app/actions/auth";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface NavbarProps {
  categories: Category[];
  myStoreId?: string | null;
}

export function Navbar({ categories, myStoreId }: NavbarProps) {
  const { data: session, status } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const cart = useCart();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const handler = (e: any) => {
      setEditingProduct(e.detail || null);
      setIsPublishOpen(true);
    };
    window.addEventListener('open-publish-modal', handler as any);
    return () => window.removeEventListener('open-publish-modal', handler as any);
  }, []);

  const activeUser = session?.user;
  const isLoading = status === "loading";

  const getDashboardPath = () => {
    if (!activeUser) return "/dashboard";
    const role = (activeUser as any).role;
    if (role === "superadmin") return "/admin";
    if (role === "assistant") return "/assistant";
    return "/dashboard";
  };

  const dashboardPath = getDashboardPath();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const onLogout = async () => {
    await handleLogout();
    await signOut({ callbackUrl: "/" });
  };

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link 
              href={
                pathname.startsWith("/gift-cards") ? "/gift-cards" : 
                pathname.startsWith("/dashboard") ? "/dashboard" :
                pathname.startsWith("/admin") ? "/admin" :
                pathname.startsWith("/assistant") ? "/assistant" :
                pathname.startsWith("/profile") ? "/profile" :
                myStoreId && pathname.startsWith(`/tienda/${myStoreId}`) ? `/tienda/${myStoreId}` : 
                "/"
              } 
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform duration-300">
                {pathname.startsWith("/gift-cards") ? (
                  <Gift className="w-6 h-6 text-white" />
                ) : pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/assistant") ? (
                  <LayoutDashboard className="w-6 h-6 text-white" />
                ) : pathname.startsWith("/profile") ? (
                  <User className="w-6 h-6 text-white" />
                ) : pathname.startsWith("/tienda") ? (
                  <Store className="w-6 h-6 text-white" />
                ) : (
                  <ShoppingCart className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-brand-gradient tracking-tighter uppercase leading-none">
                  SIGE
                </span>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80 leading-none mt-0.5">
                  {pathname.startsWith("/gift-cards") 
                    ? "Gift Cards" 
                    : pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/assistant")
                    ? "Dashboard"
                    : pathname.startsWith("/profile")
                    ? "Mi Perfil"
                    : myStoreId && pathname === `/tienda/${myStoreId}`
                    ? "Mi Tienda"
                    : pathname.startsWith("/tienda/")
                    ? "Explorar Tienda"
                    : "Market - Shop"}
                </span>
              </div>
            </Link>
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : (
              <>
                {/* Mercado Link Desktop */}
                {activeUser && pathname !== "/" && (
                  <Link href="/" className="hidden lg:block text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                    Market - Shop
                  </Link>
                )}

                {activeUser && pathname !== "/mapa" && (
                  <Link href="/mapa" className="hidden lg:block text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                    Explorar Mapa
                  </Link>
                )}

                {activeUser && !pathname.startsWith("/gift-cards") && (
                  <Link href="/gift-cards" className="hidden lg:block text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                    Gift Cards
                  </Link>
                )}

                {activeUser && myStoreId && pathname !== `/tienda/${myStoreId}` && (
                  <Link href={`/tienda/${myStoreId}`} className="hidden lg:block text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                    Mi Tienda
                  </Link>
                )}

                {/* Dashboard Link Desktop (Solo si no está ya en un dashboard) */}
                {!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin") && !pathname.startsWith("/assistant") && activeUser && (
                  <Link href={dashboardPath} className="hidden lg:block text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-3">
                    Dashboard
                  </Link>
                )}





                {/* Centro de Notificaciones */}
                {activeUser && (
                  <NotificationCenter />
                )}

                {/* Carrito Link Desktop */}
                <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer hidden md:flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                  {mounted && cart.getTotalItems() > 0 && (
                    <Badge className="absolute top-0 right-0 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-none animate-in zoom-in duration-300 pointer-events-none">
                      {cart.getTotalItems()}
                    </Badge>
                  )}
                </Link>

                {activeUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full border">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activeUser.image || ""} alt={activeUser.name || "User"} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(activeUser.name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{activeUser.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {activeUser.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Perfil</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      
                      {pathname !== "/" && (
                        <DropdownMenuItem asChild>
                          <Link href="/" className="cursor-pointer flex items-center">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            <span>Market - Shop</span>
                          </Link>
                        </DropdownMenuItem>
                      )}


                      {!pathname.startsWith("/gift-cards") && (
                        <DropdownMenuItem asChild>
                          <Link href="/gift-cards" className="cursor-pointer flex items-center">
                            <Gift className="mr-2 h-4 w-4" />
                            <span>Mis Gift Cards</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {pathname !== "/mapa" && (
                        <DropdownMenuItem asChild>
                          <Link href="/mapa" className="cursor-pointer flex items-center">
                            <Navigation className="mr-2 h-4 w-4" />
                            <span>Explorar Mapa</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      {myStoreId && pathname !== `/tienda/${myStoreId}` && (
                        <DropdownMenuItem asChild>
                          <Link href={`/tienda/${myStoreId}`} className="cursor-pointer flex items-center">
                            <Store className="mr-2 h-4 w-4" />
                            <span>Mi Tienda</span>
                          </Link>
                        </DropdownMenuItem>
                      )}


                      {!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin") && !pathname.startsWith("/assistant") && (
                        <DropdownMenuItem asChild>
                          <Link href={dashboardPath} className="cursor-pointer flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {isInstallable && !isInstalled && (
                        <>
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center sm:hidden text-primary font-medium"
                            onClick={installApp}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            <span>Instalar App</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="sm:hidden" />
                        </>
                      )}

                      <DropdownMenuItem
                        className="cursor-pointer flex items-center"
                        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                      >
                        {mounted && resolvedTheme === "dark" ? (
                          <Sun className="mr-2 h-4 w-4" />
                        ) : (
                          <Moon className="mr-2 h-4 w-4" />
                        )}
                        <span>{mounted && resolvedTheme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="cursor-pointer flex items-center text-red-600 focus:text-red-600 dark:text-red-500 dark:focus:text-red-500"
                        onClick={onLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/auth/login">
                      <Button variant="gradient" className="rounded-full px-6">
                        Entrar
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <QuickPublishModal 
        categories={categories}
        open={isPublishOpen}
        onOpenChange={setIsPublishOpen}
        productToEdit={editingProduct}
      />
    </>
  );
}
