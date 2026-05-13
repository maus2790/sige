'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Send, Inbox, Gift, Search, Wallet } from 'lucide-react';

export function GiftCardBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'sent';
  const isBuyPage = pathname === '/gift-cards/buy';
  const isMainPage = pathname === '/gift-cards';

  const getActiveState = (id: string) => {
    if (id === 'buy') return isBuyPage;
    if (isMainPage && activeTab === id) return true;
    return false;
  };

  const navItems = [
    { id: 'sent', label: 'Enviados', icon: Send, href: '/gift-cards?tab=sent' },
    { id: 'received', label: 'Recibidos', icon: Inbox, href: '/gift-cards?tab=received' },
    { id: 'buy', label: 'Regalar', icon: Gift, href: '/gift-cards/buy', isMain: true },
    { id: 'check', label: 'Saldo', icon: Search, href: '/gift-cards?tab=check' },
    { id: 'saved', label: 'Guardados', icon: Wallet, href: '/gift-cards?tab=saved' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-primary/10 md:hidden z-40 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
        {navItems.map((item) => {
          const isActive = getActiveState(item.id);
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <Link key={item.id} href={item.href} className="relative -top-5 flex items-center justify-center">
                <div className={`w-14 h-14 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl active:scale-90 transition-all border-4 border-background flex items-center justify-center group ${isActive ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                  <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`}
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
