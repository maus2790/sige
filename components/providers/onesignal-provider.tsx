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
        await OneSignal.init({
          appId: appId,
          notifyButton: {
            enable: false,
            prenotify: false,
            showCredit: false,
            text: {} as any,
          },
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
        });

        const pushEnabled = await OneSignal.Notifications.permission;
        setIsSubscribed(pushEnabled);

        OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
          setIsSubscribed(permission);
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Error inicializando OneSignal:', error);
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
