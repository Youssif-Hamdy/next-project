"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formElement = event.currentTarget;

    const form = new FormData(formElement);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      role: form.get("role"),
    };

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setMessage(data.message ?? "Registration failed.");
      return;
    }

    setMessage("Registered successfully. Redirecting to email verification...");
    formElement.reset();
    const nextVerifyUrl = typeof data.verifyUrl === "string" ? data.verifyUrl : "";
    setVerifyUrl(nextVerifyUrl);

    if (nextVerifyUrl) {
      window.location.assign(nextVerifyUrl);
      setTimeout(() => {
        window.location.href = nextVerifyUrl;
      }, 500);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('/api/assets/auth-bg')" }}
      />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-white/30 bg-white/15 p-7 text-white shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.015] hover:bg-white/20">
          <h1 className="mb-1 text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="mb-6 text-sm text-white/80">Join and start your shopping journey.</p>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              name="name"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white placeholder:text-white/70 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              placeholder="Name"
              required
            />
            <input
              name="email"
              type="email"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white placeholder:text-white/70 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              placeholder="Email"
              required
            />
            <input
              name="phone"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white placeholder:text-white/70 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              placeholder="Phone"
              required
            />
            <input
              name="password"
              type="password"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white placeholder:text-white/70 outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20 focus:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
              placeholder="Password"
              required
            />
            <select
              name="role"
              className="w-full rounded-xl border border-white/35 bg-white/10 p-3 text-white outline-none transition duration-300 focus:border-cyan-300 focus:bg-white/20"
              defaultValue="CUSTOMER"
            >
              <option className="text-black" value="CUSTOMER">
                Customer
              </option>
              <option className="text-black" value="SELLER">
                Seller (requires admin approval to list products)
              </option>
            </select>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-3 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-fuchsia-400 hover:to-purple-500 hover:shadow-[0_10px_30px_rgba(168,85,247,0.45)] disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 font-medium transition duration-300 hover:bg-white/20"
            onClick={() => signIn("google", { callbackUrl: "/dashboard/profile" })}
          >
            Continue with Google
          </button>

          {message ? <p className="mt-4 rounded-lg bg-white/20 p-2 text-sm">{message}</p> : null}
          {verifyUrl ? (
            <button
              type="button"
              onClick={() => window.location.assign(verifyUrl)}
              className="mt-3 w-full rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium transition duration-300 hover:bg-white/20"
            >
              Open verification page
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
