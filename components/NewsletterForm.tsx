"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMsg(data.message ?? "");
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
        Subscribe
      </button>
      {msg ? <p className="w-full text-sm text-slate-600">{msg}</p> : null}
    </form>
  );
}
