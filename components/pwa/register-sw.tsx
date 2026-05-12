"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js?v=2")
          .then((registration) => {
            console.log("✅ Service Worker registrado: ", registration);
            // Forzar actualización inmediata para evitar quedarse con el caché viejo
            registration.update();
          })
          .catch((error) => {
            console.log("❌ Error al registrar Service Worker: ", error);
          });
      });
    }
  }, []);

  return null;
}