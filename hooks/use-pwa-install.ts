"use client";

import { useState, useEffect } from "react";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    const checkInstalled = () => {
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstalled(true);
      }
    };
    
    checkInstalled();

    const displayModeChangeListener = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    window.matchMedia("(display-mode: standalone)").addEventListener("change", displayModeChangeListener);

    // Escuchar el evento que permite la instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.matchMedia("(display-mode: standalone)").removeEventListener("change", displayModeChangeListener);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, isInstalled, installApp };
}
