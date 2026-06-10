'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Store, Clock, Search, Wallet } from 'lucide-react';

export function GiftCardBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stores';
  const isMainPage = pathname === '/gift-cards';

  const getActiveState = (id: string) => {
    if (isMainPage && activeTab === id) return true;
    return false;
  };

  const navItems = [
    { id: 'stores', label: 'Tiendas', icon: Store, href: '/gift-cards?tab=stores' },
    { id: 'mine', label: 'Mis Gift Cards', icon: Wallet, href: '/gift-cards?tab=mine' },
    { id: 'check', label: 'Saldo', icon: Search, href: '/gift-cards?tab=check' },
    { id: 'history', label: 'Historial', icon: Clock, href: '/gift-cards?tab=history' },
  ];

  return (
    <nav className="gift-card-bottom-nav fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-primary/10 md:hidden z-40 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {navItems.map((item) => {
          const isActive = getActiveState(item.id);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`gift-card-bottom-item flex flex-col items-center gap-0.5 px-2 py-1 transition-all duration-300 ${isActive ? 'gift-card-bottom-active text-primary scale-110' : 'text-muted-foreground'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
