'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Info, 
  Gift, 
  Trash2, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserNotifications, markNotificationAsRead, markAllAsRead } from '@/app/actions/notifications';
import { useOneSignal } from '@/components/providers/onesignal-provider';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function NotificationCenter({ themeClassName }: { themeClassName?: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isSubscribed, subscribe } = useOneSignal();
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'gift_card': return <Gift className="h-4 w-4 text-pink-500" />;
      case 'order': return <Check className="h-4 w-4 text-green-500" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="notification-trigger relative rounded-full hover:bg-primary/10 group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 border-2 border-background animate-in zoom-in duration-300">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={cn("notification-menu-content w-80 md:w-96 p-0", themeClassName)} align="end" forceMount>
        <DropdownMenuLabel className="p-4 flex items-center justify-between">
          <span className="text-lg font-bold">Notificaciones</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={handleMarkAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Bell className="h-6 w-6 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No tienes notificaciones aún</p>
            </div>
          ) : (
            <div className="divide-y divide-muted/50">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`notification-item p-4 transition-colors hover:bg-muted/30 relative ${!n.read ? 'bg-primary/5' : ''}`}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm leading-none ${!n.read ? 'font-bold' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      {n.link && (
                        <Link 
                          href={n.link} 
                          className="text-[10px] text-primary font-bold hover:underline inline-block mt-1"
                        >
                          Ver detalles
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        
        {/* Prompt de Suscripción OneSignal */}
        {!isSubscribed ? (
          <div className="notification-subscribe-panel p-4 bg-primary/5 dark:bg-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold">Activar Notificaciones Push</p>
                <p className="text-[10px] text-muted-foreground">Recibe alertas instantáneas en tu dispositivo.</p>
              </div>
            </div>
            <Button className="w-full h-8 text-xs font-bold rounded-lg" onClick={subscribe}>
              Permitir Notificaciones
            </Button>
          </div>
        ) : (
          <div className="p-2 px-4 text-center">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Notificaciones push activadas
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
