"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSubscribe() {
  const [msg, setMsg] = useState("");

  async function onClick() {
    setMsg("");
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!pub) {
      setMsg("Set NEXT_PUBLIC_VAPID_PUBLIC_KEY to enable browser push.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMsg("Push is not supported in this browser.");
      return;
    }
    try {
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pub),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys) {
        setMsg("Could not create subscription.");
        return;
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: { endpoint: json.endpoint, keys: json.keys },
        }),
      });
      const data = await res.json();
      setMsg(data.message ?? (res.ok ? "Subscribed." : "Failed."));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Subscription failed.");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-900">Promo push (optional)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Enable notifications for deals. Requires VAPID keys on the server and in NEXT_PUBLIC_VAPID_PUBLIC_KEY.
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
      >
        Enable notifications
      </button>
      {msg ? <p className="mt-2 text-sm text-slate-700">{msg}</p> : null}
    </div>
  );
}
