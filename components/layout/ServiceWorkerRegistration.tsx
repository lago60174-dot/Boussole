"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (public/sw.js) au chargement de l'app.
 * Nécessaire pour : mode hors-ligne minimal + réception des notifications push.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("Échec d'enregistrement du service worker :", err));
  }, []);

  return null;
}
