"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { subscribePushAction, unsubscribePushAction } from "@/app/actions/notifications";
import { isOrderSoundEnabled, playOrderSound, setOrderSoundEnabled } from "@/lib/order-sound";

type PushSupport = "checking" | "unsupported" | "ios-install" | "ok";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

function detectSupport(): PushSupport {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isIOS && !isStandalone) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return "ok";
}

export function NotificationSettings() {
  const [open, setOpen] = useState(false);
  const [support, setSupport] = useState<PushSupport>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const s = detectSupport();
    setSupport(s);
    setSoundOn(isOrderSoundEnabled());
    if (s !== "ok") return;
    setDenied(Notification.permission === "denied");
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then(setSubscription)
      .catch((err) => console.error("Service worker registration failed:", err));
  }, []);

  async function enablePush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus({ tone: "error", text: "Les notifications push ne sont pas encore configurées sur le serveur." });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDenied(permission === "denied");
        setStatus({ tone: "error", text: "Autorisez les notifications pour Setlou dans votre navigateur." });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey.trim()),
      });
      const json = sub.toJSON();
      const result = await subscribePushAction({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      if (!result.ok) {
        await sub.unsubscribe();
        setStatus({ tone: "error", text: result.error });
        return;
      }
      setSubscription(sub);
      if (result.data.testSent) {
        setStatus({ tone: "ok", text: "Notifications activées. Une notification de test vient d'être envoyée." });
        toast.success("Notifications activées sur cet appareil.");
      } else {
        setStatus({ tone: "warn", text: "Appareil enregistré, mais la notification de test n'a pas pu partir. Vérifiez les clés VAPID du serveur." });
      }
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setStatus({ tone: "error", text: "Impossible d'activer les notifications sur cet appareil." });
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    if (!subscription) return;
    setBusy(true);
    try {
      await unsubscribePushAction(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      setStatus(null);
      toast.success("Notifications désactivées sur cet appareil.");
    } finally {
      setBusy(false);
    }
  }

  function toggleSound(checked: boolean) {
    setSoundOn(checked);
    setOrderSoundEnabled(checked);
    if (checked) playOrderSound();
  }

  const pushOn = Boolean(subscription);

  return (
    <>
      <Button variant="outline" size="lg" className={`relative ${pushOn ? "border-green-600 text-green-700 dark:text-green-400" : ""}`} onClick={() => setOpen(true)}>
        {pushOn ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        <span className="hidden sm:inline">Notifications</span>
        {support === "ok" && !pushOn && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications de commande</DialogTitle>
            <DialogDescription>
              Soyez prévenu dès qu&apos;un client commande sur votre boutique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-3">
                {pushOn ? <BellRing className="h-5 w-5 text-green-600 mt-0.5" /> : <BellOff className="h-5 w-5 text-muted-foreground mt-0.5" />}
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    Notifications sur cet appareil
                    {pushOn && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        Activées
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Même quand Setlou est fermé, comme une notification WhatsApp.
                  </p>
                </div>
              </div>

              {support === "ios-install" && (
                <p className="text-xs text-muted-foreground">
                  Sur iPhone : touchez <strong>Partager</strong> puis <strong>Sur l&apos;écran d&apos;accueil</strong>, ouvrez Setlou depuis l&apos;icône, puis revenez ici.
                </p>
              )}
              {support === "unsupported" && (
                <p className="text-xs text-muted-foreground">
                  Ce navigateur ne prend pas en charge les notifications. Essayez Chrome.
                </p>
              )}
              {support === "ok" && denied && !pushOn && (
                <p className="text-xs text-amber-600">
                  Les notifications sont bloquées pour Setlou. Autorisez-les dans les réglages du navigateur (icône à gauche de l&apos;adresse), puis réessayez.
                </p>
              )}
              {status && (
                <p className={`text-xs ${status.tone === "ok" ? "text-green-600" : status.tone === "warn" ? "text-amber-600" : "text-red-600"}`}>
                  {status.text}
                </p>
              )}
              {support === "ok" && (
                pushOn ? (
                  <Button variant="outline" className="w-full" disabled={busy} onClick={disablePush}>
                    Désactiver sur cet appareil
                  </Button>
                ) : (
                  <Button className="w-full" disabled={busy} onClick={enablePush}>
                    {busy ? "Activation..." : "Activer les notifications"}
                  </Button>
                )
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Son « cha-ching »</p>
                  <p className="text-xs text-muted-foreground">Quand Setlou est ouvert sur cet appareil.</p>
                </div>
              </div>
              <Switch checked={soundOn} onCheckedChange={toggleSound} aria-label="Son des nouvelles commandes" />
            </div>

            <Button variant="ghost" className="w-full" onClick={() => playOrderSound()}>
              Écouter le son
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
