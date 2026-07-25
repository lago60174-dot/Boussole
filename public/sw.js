// Service worker de Boussole
// Rôles : (1) recevoir et afficher les notifications push, (2) offrir un
// mode hors-ligne minimal (coquille de l'app + dernière page visitée).

const CACHE_NAME = "boussole-cache-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

// Stratégie réseau-d'abord avec repli hors-ligne pour la navigation HTML.
// Le reste (API Supabase, assets) passe directement par le réseau.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
    )
  );
});

// --- Notifications push -----------------------------------------------------

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Boussole", body: event.data.text() };
  }

  const title = payload.title || "Boussole";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "boussole-notification",
    data: { url: payload.url || "/dashboard" },
    renotify: Boolean(payload.tag),
    // Pattern de vibration distinct (buzz-pause-buzz-pause-buzz), plus
    // "insistant" qu'une vibration simple. Fonctionne sur Android Chrome ;
    // ignoré silencieusement là où ce n'est pas supporté (ex. iOS Safari,
    // qui ne supporte pas la vibration côté web, ni desktop sans matériel
    // vibrant). Aucun navigateur ne permet en revanche de définir un SON
    // personnalisé pour une notification web — ce n'est implémenté nulle
    // part, ce n'est donc pas réglable ici. Pour un son personnalisé, une
    // fois l'app installée, il faut passer par Paramètres du téléphone →
    // Applications → Boussole → Notifications (réglage système, par
    // appareil, pas par le code).
    vibrate: [200, 100, 200, 100, 200],
    // Garde la notification affichée jusqu'à ce qu'elle soit explicitement
    // fermée/cliquée, au lieu de disparaître seule après quelques secondes.
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
