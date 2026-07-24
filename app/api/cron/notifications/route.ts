import { createAdminClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push/send";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Appelé toutes les 5 minutes par un cron (voir vercel.json).
 * Cherche les tâches/événements dont le rappel arrive à échéance,
 * envoie une notification push, et marque le rappel comme envoyé.
 *
 * Protégé par un secret partagé (CRON_SECRET) transmis en en-tête
 * Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const safetyFloor = new Date(now.getTime() - 60 * 60 * 1000); // 1h de rattrapage max

  let sent = 0;
  let expired = 0;

  // --- Tâches à échéance ------------------------------------------------
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, user_id, title, due_date, reminder_minutes_before")
    .is("reminder_sent_at", null)
    .not("due_date", "is", null)
    .not("reminder_minutes_before", "is", null)
    .not("status", "in", "(done,cancelled)")
    .gte("due_date", safetyFloor.toISOString());

  const dueTasks = (tasks ?? []).filter((t) => {
    const triggerAt = new Date(t.due_date!).getTime() - t.reminder_minutes_before! * 60_000;
    return triggerAt <= now.getTime();
  });

  // --- Événements à échéance ---------------------------------------------
  const { data: events } = await supabase
    .from("events")
    .select("id, user_id, title, start_at, reminder_minutes_before")
    .is("reminder_sent_at", null)
    .not("reminder_minutes_before", "is", null)
    .gte("start_at", safetyFloor.toISOString());

  const dueEvents = (events ?? []).filter((e) => {
    const triggerAt = new Date(e.start_at).getTime() - e.reminder_minutes_before! * 60_000;
    return triggerAt <= now.getTime();
  });

  if (dueTasks.length === 0 && dueEvents.length === 0) {
    return NextResponse.json({ sent, expired, checked: 0 });
  }

  const userIds = [...new Set([...dueTasks.map((t) => t.user_id), ...dueEvents.map((e) => e.user_id)])];
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  const subsByUser = new Map<string, typeof subs>();
  for (const s of subs ?? []) {
    subsByUser.set(s.user_id, [...(subsByUser.get(s.user_id) ?? []), s]);
  }

  async function notifyUser(userId: string, payload: { title: string; body: string; url: string; tag: string }) {
    const userSubs = subsByUser.get(userId) ?? [];
    for (const sub of userSubs) {
      const result = await sendPushNotification(sub, payload);
      if (result === "ok") sent++;
      if (result === "expired") {
        expired++;
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  for (const task of dueTasks) {
    try {
      await notifyUser(task.user_id, {
        title: "Échéance de tâche",
        body: task.title,
        url: "/tasks",
        tag: `task-${task.id}`,
      });
      await supabase.from("tasks").update({ reminder_sent_at: now.toISOString() }).eq("id", task.id);
    } catch (err) {
      console.error(`Échec de notification pour la tâche ${task.id} :`, err);
    }
  }

  for (const event of dueEvents) {
    try {
      await notifyUser(event.user_id, {
        title: "Événement à venir",
        body: event.title,
        url: "/calendar",
        tag: `event-${event.id}`,
      });
      await supabase.from("events").update({ reminder_sent_at: now.toISOString() }).eq("id", event.id);
    } catch (err) {
      console.error(`Échec de notification pour l'événement ${event.id} :`, err);
    }
  }

  return NextResponse.json({ sent, expired, checked: dueTasks.length + dueEvents.length });
}
