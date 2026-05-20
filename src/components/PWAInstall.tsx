"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PWAInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      (window.navigator as unknown as { standalone?: boolean }).standalone
    ) {
      setInstalled(true);
    }
    setDismissed(localStorage.getItem("pwa-dismissed") === "1");
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (!deferred && !isIOS) return null;

  return (
    <div className="fixed inset-x-2 bottom-2 z-40 mx-auto max-w-md rounded-lg border border-wili-blue/30 bg-white p-3 shadow-lg">
      <div className="flex items-start gap-3">
        <img src="/wappen.svg" alt="" className="h-10 w-auto" />
        <div className="flex-1 text-sm">
          <div className="font-semibold text-wili-bluedark">
            Schulbus Wiliberg installieren
          </div>
          {isIOS && !deferred ? (
            <p className="text-wili-ink/70">
              Im Safari über{" "}
              <strong>Teilen → Zum Home-Bildschirm</strong> hinzufügen.
            </p>
          ) : (
            <p className="text-wili-ink/70">
              Als App auf dem Handy installieren – funktioniert auch teilweise
              ohne Internet.
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => {
            localStorage.setItem("pwa-dismissed", "1");
            setDismissed(true);
          }}
          className="text-xs text-wili-ink/60 hover:underline"
        >
          später
        </button>
        {deferred && (
          <button
            onClick={async () => {
              await deferred.prompt();
              await deferred.userChoice;
              setDeferred(null);
            }}
            className="btn-primary py-1 px-3 text-sm"
          >
            Installieren
          </button>
        )}
      </div>
    </div>
  );
}
