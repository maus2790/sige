"use client";


import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  Store,
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  X,
  ChevronDown,
  ShoppingCart
} from "lucide-react";

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
import { useEffect, useState } from "react";
import { getCurrentUser, handleLogout } from "@/app/actions/auth";

export function Navbar() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [customUser, setCustomUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    setMounted(true);

    const fetchAuth = async () => {
      try {
        const user = await getCurrentUser();
        setCustomUser(user);
      } catch (error) {
        console.error("Error fetching custom user", error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchAuth();
  }, []);

  const activeUser = session?.user || customUser;
  const isLoading = status === "loading" || isLoadingAuth;

  // Función para obtener la ruta del dashboard correcta según el rol
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
    await signOut({ redirect: false });
    await handleLogout();
  };

  // Ocultar el Navbar en las rutas de autenticación
  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full glass transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform duration-300">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-brand-gradient tracking-tighter">SIGE</span>
          </Link>
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : activeUser ? (
            <>
              {/* Notificaciones */}
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeUser.image || activeUser.image_url || ""} alt={activeUser.name || "User"} />
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer flex items-center">
                      <Store className="mr-2 h-4 w-4" />
                      <span>Tienda</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={dashboardPath} className="cursor-pointer flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer flex items-center"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {mounted && theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    <span>{mounted && theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
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
            </>
          ) : pathname === "/" ? (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="gradient" className="rounded-full px-6">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="hidden sm:flex">
                  Registrarse
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
