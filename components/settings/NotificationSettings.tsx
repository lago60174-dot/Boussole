"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, sendTestNotification } from "@/lib/actions/push";
import { Button } from "@/components/ui/Button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "subscribed" | "unsubscribed" | "denied";

export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "unsubscribed");
    }
    check();
  }, []);

  function handleSubscribe() {
    setMessage(null);
    startTransition(async () => {
      try {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          setMessage("Clé VAPID absente : complète .env.local (voir README).");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("denied");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const json = sub.toJSON();
        const result = await subscribeToPush(
          { endpoint: json.endpoint!, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } },
          navigator.userAgent
        );
        if (result.error) setMessage(result.error);
        else setStatus("subscribed");
      } catch (err) {
        setMessage("Impossible d'activer les notifications sur cet appareil.");
        console.error(err);
      }
    });
  }

  function handleUnsubscribe() {
    setMessage(null);
    startTransition(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    });
  }

  function handleTest() {
    setMessage(null);
    startTransition(async () => {
      const result = await sendTestNotification();
      setMessage(result.error ?? "Notification de test envoyée.");
    });
  }

  return (
    <div className="rounded-xl border border-line bg-canvas-raised p-4">
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink">
        <Bell size={15} /> Notifications push
      </h3>
      <p className="mb-3 text-xs text-ink-soft">
        Reçois un rappel pour tes tâches et événements directement sur cet appareil, même onglet fermé.
      </p>

      {status === "checking" && <p className="text-xs text-ink-soft">Vérification…</p>}
      {status === "unsupported" && <p className="text-xs text-warning">Non pris en charge sur ce navigateur.</p>}
      {status === "denied" && (
        <p className="text-xs text-danger">
          Notifications bloquées pour ce site. Autorise-les dans les réglages du navigateur pour continuer.
        </p>
      )}

      {(status === "subscribed" || status === "unsubscribed") && (
        <div className="flex flex-wrap gap-2">
          {status === "unsubscribed" ? (
            <Button size="sm" onClick={handleSubscribe} disabled={pending}>
              <Bell size={13} /> Activer sur cet appareil
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={handleUnsubscribe} disabled={pending}>
                <BellOff size={13} /> Désactiver
              </Button>
              <Button size="sm" variant="secondary" onClick={handleTest} disabled={pending}>
                <Send size={13} /> Test
              </Button>
            </>
          )}
        </div>
      )}

      {message && <p className="mt-2 text-xs text-ink-soft">{message}</p>}
    </div>
  );
}
