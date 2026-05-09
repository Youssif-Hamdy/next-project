"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      redirect: false,
      identifier: String(form.get("identifier") ?? ""),
      password: String(form.get("password") ?? ""),
      callbackUrl: "/dashboard/profile",
    });

    setLoading(false);
    if (result?.error) {
      setMessage("Invalid credentials.");
      return;
    }

    window.location.href = "/dashboard/profile";
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('/api/assets/auth-bg')" }}
      />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/15 p-7 text-white shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.015] hover:bg-white/20">
          <h1 className="mb-1 text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="mb-6 text-sm text-white/80">Login and continue shopping.</p>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              name="identifier"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white placeholder:text-white/70 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              placeholder="Email or Phone"
              required
            />
            <input
              name="password"
              type="password"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white placeholder:text-white/70 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              placeholder="Password"
              required
            />

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-500 hover:shadow-[0_10px_30px_rgba(14,165,233,0.45)] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            className="mt-3 w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 font-medium transition duration-300 hover:bg-white/20"
            onClick={() => signIn("google", { callbackUrl: "/dashboard/profile" })}
          >
            Continue with Google
          </button>

          {message ? <p className="mt-4 rounded-lg bg-red-500/25 p-2 text-sm">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
