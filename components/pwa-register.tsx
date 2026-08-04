"use client";

import { useEffect } from "react";

// Registra el service worker mínimo requerido para que el navegador (sobre
// todo Chrome/Android) ofrezca instalar la app. Es un beneficio opcional:
// si falla, nunca debe romper el resto de la aplicación.
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
