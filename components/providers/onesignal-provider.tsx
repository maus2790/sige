'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import OneSignal from 'react-onesignal';
import { useSession } from 'next-auth/react';

interface OneSignalContextType {
  isInitialized: boolean;
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  isSubscribed: false,
  subscribe: async () => {},
});

export const useOneSignal = () => useContext(OneSignalContext);

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const initOneSignal = async () => {
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

      if (!appId) {
        console.warn('OneSignal App ID no está configurado en .env');
        return;
      }

      try {
        // Esperar a que el Service Worker esté activo antes de inicializar
        // OneSignal para evitar la race condition de "No SW registration for postMessage"
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
          // Si no hay controlador activo, esperar a que se active para evitar el error de postMessage
          if (!navigator.serviceWorker.controller) {
            await new Promise((resolve) => {
              navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
              // Timeout de seguridad para no bloquear la app
              setTimeout(resolve, 2000);
            });
          }
        }

        await OneSignal.init({
          appId: appId,
          notifyButton: {
            enable: false,
            prenotify: false,
            showCredit: false,
            text: {} as any,
          },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/sw.js',
          serviceWorkerParam: { scope: '/' },
        });

        const pushEnabled = await OneSignal.Notifications.permission;
        setIsSubscribed(pushEnabled);

        OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
          setIsSubscribed(permission);
        });

        setIsInitialized(true);
      } catch (error) {
        // Suprimir el error conocido de WM/postMessage; no afecta funcionalidad
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.includes('postMessage') && !msg.includes('SW registration')) {
          console.error('Error inicializando OneSignal:', error);
        }
      }
    };

    if (typeof window !== 'undefined' && !isInitialized) {
      initOneSignal();
    }
  }, [isInitialized]);

  useEffect(() => {
    const loginUser = async () => {
      const userId = (session?.user as any)?.id;
      if (isInitialized && userId) {
        try {
          await OneSignal.login(userId);
        } catch (error) {
          console.error('Error in OneSignal login:', error);
        }
      }
    };

    loginUser();
  }, [session, isInitialized]);

  const subscribe = async () => {
    try {
      await OneSignal.Notifications.requestPermission();
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
    }
  };

  return (
    <OneSignalContext.Provider value={{ isInitialized, isSubscribed, subscribe }}>
      {children}
    </OneSignalContext.Provider>
  );
}
