"use client";

import { FormEvent, useState } from "react";

export default function AdminMarketingPage() {
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const [pushMsg, setPushMsg] = useState("");

  async function sendNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/newsletter", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: form.get("subject"),
        html: form.get("html"),
      }),
    });
    const data = await res.json();
    setNewsletterMsg(data.message ?? JSON.stringify(data));
  }

  async function sendPush(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        body: form.get("body"),
        url: form.get("url") || "/",
      }),
    });
    const data = await res.json();
    setPushMsg(data.message ?? JSON.stringify(data));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100/40">
      <section className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <div className="rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-900">Marketing</h1>
        <p className="mt-1 text-sm text-blue-700">
          Email requires SMTP env vars. Push requires VAPID keys and a registered service worker.
        </p>
      </div>

      <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-blue-900">Email newsletter broadcast</h2>
        <form onSubmit={sendNewsletter} className="mt-3 space-y-2">
          <input name="subject" className="w-full rounded-lg border border-blue-200 p-2.5" placeholder="Subject" required />
          <textarea
            name="html"
            className="h-32 w-full rounded-lg border border-blue-200 p-2.5"
            placeholder="HTML body"
            required
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Send to all subscribers
          </button>
        </form>
        {newsletterMsg ? <p className="mt-2 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-800">{newsletterMsg}</p> : null}
      </section>

      <section className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-blue-900">Push notification broadcast</h2>
        <form onSubmit={sendPush} className="mt-3 space-y-2">
          <input name="title" className="w-full rounded-lg border border-blue-200 p-2.5" placeholder="Title" required />
          <textarea name="body" className="h-24 w-full rounded-lg border border-blue-200 p-2.5" placeholder="Body" required />
          <input name="url" className="w-full rounded-lg border border-blue-200 p-2.5" placeholder="Open URL (optional)" />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Push to subscribed browsers
          </button>
        </form>
        {pushMsg ? <p className="mt-2 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-800">{pushMsg}</p> : null}
      </section>
      </section>
    </main>
  );
}
