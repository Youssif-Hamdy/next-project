"use client";

import { FormEvent, useEffect, useState } from "react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  role?: string;
  userStatus?: string;
  walletBalance?: number;
  address?: Record<string, string>;
  paymentDetails?: Record<string, string>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setProfile(data.user));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setMessage("");

    const payload = {
      name: String(form.get("name") ?? ""),
      address: {
        street: String(form.get("street") ?? ""),
        city: String(form.get("city") ?? ""),
        country: String(form.get("country") ?? ""),
        zipCode: String(form.get("zipCode") ?? ""),
      },
      paymentDetails: {
        cardHolderName: String(form.get("cardHolderName") ?? ""),
        cardLast4: String(form.get("cardLast4") ?? ""),
      },
    };

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(data.message ?? "Saved.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_20%,#60A5FA_0%,#2563EB_45%,#0B1220_100%)] p-6 text-white">
      <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-36 h-44 w-44 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl" />

      <section className="mx-auto w-full max-w-4xl animate-float-in">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight drop-shadow-sm">Profile Management</h1>
          <p className="mt-1 text-sm text-blue-100">Update your identity, shipping address, and payment details.</p>
        </header>

        {profile ? (
          <form onSubmit={onSubmit} className="glass-panel animate-pulse-glow rounded-3xl p-6 shadow-2xl transition duration-500 hover:shadow-[0_20px_60px_rgba(15,23,42,0.55)]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-blue-100">Full Name</span>
                <input
                  name="name"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  defaultValue={profile.name}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-blue-100">Email</span>
                <input
                  className="w-full rounded-xl border border-white/30 bg-white/10 p-3 text-blue-50/90"
                  value={profile.email}
                  readOnly
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-blue-100">Phone</span>
                <input
                  className="w-full rounded-xl border border-white/30 bg-white/10 p-3 text-blue-50/90"
                  value={profile.phone}
                  readOnly
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-blue-100">Wallet balance (for checkout)</span>
                <input
                  className="w-full rounded-xl border border-white/30 bg-white/10 p-3 text-blue-50/90"
                  value={`$${Number(profile.walletBalance ?? 0).toFixed(2)}`}
                  readOnly
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-blue-100">Street</span>
                <input
                  name="street"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  defaultValue={profile.address?.street ?? ""}
                  placeholder="Street address"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-blue-100">City</span>
                <input
                  name="city"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  defaultValue={profile.address?.city ?? ""}
                  placeholder="City"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-blue-100">Country</span>
                <input
                  name="country"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  defaultValue={profile.address?.country ?? ""}
                  placeholder="Country"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm text-blue-100">ZIP Code</span>
                <input
                  name="zipCode"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  defaultValue={profile.address?.zipCode ?? ""}
                  placeholder="ZIP Code"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-blue-100">Card Holder</span>
                <input
                  name="cardHolderName"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  defaultValue={profile.paymentDetails?.cardHolderName ?? ""}
                  placeholder="Card holder name"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-blue-100">Card Last 4</span>
                <input
                  name="cardLast4"
                  className="w-full rounded-xl border border-white/30 bg-white/15 p-3 text-white outline-none transition duration-300 placeholder:text-blue-100 focus:border-cyan-200 focus:bg-white/25 focus:shadow-[0_0_22px_rgba(96,165,250,0.45)]"
                  maxLength={4}
                  defaultValue={profile.paymentDetails?.cardLast4 ?? ""}
                  placeholder="1234"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-400 hover:shadow-[0_10px_32px_rgba(59,130,246,0.55)] disabled:opacity-65"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              {message ? <p className="rounded-lg bg-white/20 px-3 py-2 text-sm text-blue-50">{message}</p> : null}
            </div>
          </form>
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-blue-100 animate-float-in">Loading profile...</div>
        )}
      </section>
    </main>
  );
}
