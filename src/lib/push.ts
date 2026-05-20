import webpush from "web-push";
import { prisma } from "./db";

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT ?? "mailto:kanzlei@wiliberg.ch";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

async function sendTo(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  if (!configure()) return { ok: false, reason: "not-configured" as const };
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return { ok: true as const };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      // Abonnement abgelaufen → entfernen
      await prisma.pushSubscription
        .deleteMany({ where: { endpoint: subscription.endpoint } })
        .catch(() => {});
    } else {
      console.error("Push-Fehler:", e);
    }
    return { ok: false as const, status };
  }
}

export async function pushToUser(userId: string, payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(subs.map((s) => sendTo(s, payload)));
}

export async function pushToAdmins(payload: PushPayload) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: admins.map((a) => a.id) } },
  });
  await Promise.all(subs.map((s) => sendTo(s, payload)));
}

export async function pushToAllParents(payload: PushPayload) {
  const parents = await prisma.user.findMany({ where: { role: "PARENT" } });
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: parents.map((p) => p.id) } },
  });
  await Promise.all(subs.map((s) => sendTo(s, payload)));
}
