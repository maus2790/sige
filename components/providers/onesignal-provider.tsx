'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useSession } from 'next-auth/react';

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

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
            enable: true,
            displayPredicate: () => true, // Mostrar siempre
            prenotify: true,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'Suscríbete a las notificaciones',
              'tip.state.subscribed': 'Estás suscrito a las notificaciones',
              'tip.state.blocked': 'Has bloqueado las notificaciones',
              'message.prenotify': 'Haz clic para suscribirte a las notificaciones de SIGE',
              'message.action.subscribed': '¡Gracias por suscribirte!',
              'message.action.resubscribed': 'Estás suscrito nuevamente',
              'message.action.unsubscribed': 'Ya no recibirás notificaciones',
              'dialog.main.title': 'Gestionar Notificaciones',
              'dialog.main.button.subscribe': 'SUSCRIBIRSE',
              'dialog.main.button.unsubscribe': 'CANCELAR SUSCRIPCIÓN',
              'dialog.blocked.title': 'Desbloquear Notificaciones',
              'dialog.blocked.message': 'Sigue las instrucciones para permitir las notificaciones:',
              'message.action.subscribing': 'Suscribiendo...'
            }
          },
          allowLocalhostAsSecureOrigin: true, // Para pruebas en localhost
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
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

  // Login a OneSignal cuando cambie la sesión (vincular usuario de SIGE con OneSignal)
  useEffect(() => {
    const loginUser = async () => {
      const userId = (session?.user as any)?.id;
      if (isInitialized && userId) {
        try {
          await OneSignal.login(userId);
          console.log('OneSignal login successful for:', userId);
        } catch (error) {
          console.error('Error in OneSignal login:', error);
        }
      } else if (isInitialized && !userId) {
        // Opcional: logout si la sesión termina
        try {
          await OneSignal.logout();
        } catch (error) {}
      }
    };

    loginUser();
  }, [session, isInitialized]);

  return <>{children}</>;
}
