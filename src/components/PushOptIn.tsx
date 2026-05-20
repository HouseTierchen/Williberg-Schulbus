"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(b64: string) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushOptIn() {
  const [state, setState] = useState<
    "loading" | "unsupported" | "denied" | "off" | "on"
  >("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  if (state === "loading" || state === "unsupported") return null;

  async function enable() {
    setWorking(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const res = await fetch("/api/push/public-key");
      const { publicKey } = (await res.json()) as { publicKey: string | null };
      if (!publicKey) {
        alert("Push ist auf dem Server nicht konfiguriert.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(json),
      });
      setState("on");
    } finally {
      setWorking(false);
    }
  }

  async function disable() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setWorking(false);
    }
  }

  if (state === "denied") {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Benachrichtigungen sind im Browser blockiert. Bitte in den
        Browser-Einstellungen für diese Seite erlauben.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded border border-wili-blue/30 bg-wili-bluelight/40 p-3 text-sm">
      <div>
        <strong className="text-wili-bluedark">Benachrichtigungen</strong>
        <div className="text-wili-ink/70">
          {state === "on"
            ? "Sie erhalten Push-Nachrichten zu Spezialwochen, Krankmeldungen u.a."
            : "Aktivieren, um über Krankmeldungen und Plan-Änderungen informiert zu werden."}
        </div>
      </div>
      {state === "on" ? (
        <button
          onClick={disable}
          disabled={working}
          className="btn-secondary py-1 px-3 text-sm"
        >
          Deaktivieren
        </button>
      ) : (
        <button
          onClick={enable}
          disabled={working}
          className="btn-primary py-1 px-3 text-sm"
        >
          Aktivieren
        </button>
      )}
    </div>
  );
}
