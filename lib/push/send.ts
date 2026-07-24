import webpush, { type PushSubscription } from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Clés VAPID manquantes. Lance `npm run generate-vapid` puis complète .env.local."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Envoie une notification. Retourne "expired" si l'abonnement n'est plus
 * valide côté navigateur (à supprimer en base), sinon "ok" ou "error".
 */
export async function sendPushNotification(
  sub: StoredSubscription,
  payload: PushPayload
): Promise<"ok" | "expired" | "error"> {
  ensureConfigured();

  const subscription: PushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return "ok";
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return "expired";
    }
    console.error("Échec d'envoi push :", err);
    return "error";
  }
}
