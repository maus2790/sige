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
  Navigation,
  RefreshCw
} from "lucide-react";

import { toast } from "sonner";
import { refreshMarketFeed } from "@/app/actions/products";
import { refreshStoreFeed } from "@/app/actions/storefront";
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
import { cn } from "@/lib/utils";

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleHeaderRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (pathname.startsWith("/tienda/")) {
        const storeId = pathname.split("/")[2];
        if (storeId) {
          await refreshStoreFeed(storeId);
          toast.success("Catálogo de tienda actualizado.");
        }
      } else {
        await refreshMarketFeed();
        toast.success("Feed de mercado actualizado.");
      }
      
      // Dispatch a custom event to notify child components (InfiniteFeed / StoreFeed)
      window.dispatchEvent(new CustomEvent("sige-refresh-feed"));
      
      router.refresh();
    } catch (error) {
      toast.error("Error al actualizar el feed");
    } finally {
      setIsRefreshing(false);
    }
  };

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
      <header className="sticky top-0 z-50 w-full glass border-b shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_15px_rgba(37,99,235,0.15)] transition-all duration-300">
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
                <Link 
                  href="/" 
                  className={cn(
                    "hidden lg:block text-sm font-bold transition-colors px-4 py-2 rounded-full",
                    pathname === "/" 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  )}
                >
                  Mercado
                </Link>

                {activeUser && myStoreId && (
                  <Link 
                    href={`/tienda/${myStoreId}`} 
                    className={cn(
                      "hidden lg:block text-sm font-bold transition-colors px-4 py-2 rounded-full",
                      pathname === `/tienda/${myStoreId}`
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                  >
                    Mi Tienda
                  </Link>
                )}

                <Link 
                  href="/mapa" 
                  className={cn(
                    "hidden lg:block text-sm font-bold transition-colors px-4 py-2 rounded-full",
                    pathname === "/mapa" 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-primary hover:bg-muted"
                  )}
                >
                  Mapa
                </Link>

                {activeUser && (
                  <Link 
                    href="/gift-cards" 
                    className={cn(
                      "hidden lg:block text-sm font-bold transition-colors px-4 py-2 rounded-full",
                      pathname.startsWith("/gift-cards") 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                  >
                    Gift Cards
                  </Link>
                )}

                {activeUser && (
                  <Link 
                    href={dashboardPath} 
                    className={cn(
                      "hidden lg:block text-sm font-bold transition-colors px-4 py-2 rounded-full",
                      (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/assistant"))
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                  >
                    Dashboard
                  </Link>
                )}





                {/* Botón de Actualizar (Sólo Móvil en Mercado y Tienda) */}
                {mounted && (pathname === "/" || pathname.startsWith("/tienda/")) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleHeaderRefresh}
                    disabled={isRefreshing}
                    className="relative rounded-full hover:bg-primary/10 group lg:hidden shrink-0"
                  >
                    <RefreshCw className={cn(
                      "w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors",
                      isRefreshing && "animate-spin text-primary"
                    )} />
                  </Button>
                )}

                {/* Centro de Notificaciones */}
                {activeUser && (
                  <NotificationCenter />
                )}

                {/* Carrito Link */}
                <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center justify-center">
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
                      <DropdownMenuItem asChild className={cn("cursor-pointer", pathname === "/profile" && "bg-primary/10 text-primary font-bold")}>
                        <Link href="/profile" className="flex items-center w-full">
                          <User className="mr-2 h-4 w-4" />
                          <span>Perfil</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem asChild className={cn("cursor-pointer", pathname === "/" && "bg-primary/10 text-primary font-bold")}>
                        <Link href="/" className="flex items-center w-full">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Mercado</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className={cn("cursor-pointer", pathname.startsWith("/gift-cards") && "bg-primary/10 text-primary font-bold")}>
                        <Link href="/gift-cards" className="flex items-center w-full">
                          <Gift className="mr-2 h-4 w-4" />
                          <span>Gift Cards</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild className={cn("cursor-pointer", pathname === "/mapa" && "bg-primary/10 text-primary font-bold")}>
                        <Link href="/mapa" className="flex items-center w-full">
                          <Navigation className="mr-2 h-4 w-4" />
                          <span>Mapa</span>
                        </Link>
                      </DropdownMenuItem>

                      {myStoreId && (
                        <DropdownMenuItem asChild className={cn("cursor-pointer", pathname === `/tienda/${myStoreId}` && "bg-primary/10 text-primary font-bold")}>
                          <Link href={`/tienda/${myStoreId}`} className="flex items-center w-full">
                            <Store className="mr-2 h-4 w-4" />
                            <span>Mi Tienda</span>
                          </Link>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem asChild className={cn("cursor-pointer", (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/assistant")) && "bg-primary/10 text-primary font-bold")}>
                        <Link href={dashboardPath} className="flex items-center w-full">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>

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
