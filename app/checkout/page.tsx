"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { computeOrderTotals } from "@/lib/order-pricing";
import { useCart } from "@/hooks/useCart";

type PaymentChoice = "COD" | "PAYPAL" | "WALLET" | "CARD_STRIPE";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const { items, setQuantity, removeItem, clear, summary } = useCart();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [payment, setPayment] = useState<PaymentChoice>("COD");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const pricing = useMemo(() => computeOrderTotals(summary.subtotal), [summary.subtotal]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!items.length) {
      setMessage("Your cart is empty.");
      return;
    }
    if (!session?.user) {
      if (!guestName.trim() || !guestEmail.trim()) {
        setMessage("Please enter your name and email for guest checkout.");
        return;
      }
    }
    if (payment === "WALLET" && !session?.user) {
      setMessage("Wallet is only available when logged in.");
      return;
    }

    setLoading(true);
    try {
      if (payment === "CARD_STRIPE") {
        const draftRes = await fetch("/api/checkout/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            guestName: session?.user ? undefined : guestName,
            guestEmail: session?.user ? undefined : guestEmail,
          }),
        });
        const draftData = await draftRes.json();
        if (!draftRes.ok) {
          setMessage(draftData.message ?? "Could not start checkout.");
          setLoading(false);
          return;
        }
        const stripeRes = await fetch("/api/stripe/checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draftId: draftData.draftId }),
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok || !stripeData.url) {
          setMessage(stripeData.message ?? "Stripe is not available. Set STRIPE_SECRET_KEY.");
          setLoading(false);
          return;
        }
        window.location.href = stripeData.url;
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: payment,
          guestName: session?.user ? undefined : guestName,
          guestEmail: session?.user ? undefined : guestEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "Order failed.");
        setLoading(false);
        return;
      }
      clear();
      setMessage(`Order placed successfully. Order ID: ${data.orderId}`);
    } catch {
      setMessage("Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <main className="relative mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-4 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <section className="animate-float-in mb-6 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-sky-100/70 via-white to-indigo-100/70 p-6 shadow-xl shadow-sky-100/60 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">🛒 Checkout</h1>
            <p className="mt-1 text-sm text-slate-600">
              Confirm your items, choose a payment method, and finish your order in seconds.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            {summary.count} item{summary.count === 1 ? "" : "s"} in cart
          </div>
        </div>
      </section>

      <p className="text-sm text-slate-600">
        Guest checkout is available. Card payments use Stripe Checkout when configured.
      </p>

      {items.length === 0 ? (
        <section className="animate-float-in mt-6 rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg">
          <p className="text-lg font-semibold text-slate-900">Your cart is empty</p>
          <p className="mt-2 text-sm text-slate-600">Start adding products and come back to checkout.</p>
          <Link
            href="/products"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
          >
            Browse products
          </Link>
        </section>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="animate-float-in rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span>📦</span>
              Cart items
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-1.5">
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-sky-400"
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      onClick={() => removeItem(item.productId)}
                    >
                      🗑 Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="animate-float-in rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md lg:sticky lg:top-24 lg:h-fit">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span>💳</span>
              Order summary
            </h2>
            <dl className="mt-3 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>${pricing.subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax (8%)</dt>
                <dd>${pricing.tax.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping {pricing.subtotal >= 50 ? "(free over $50)" : ""}</dt>
                <dd>${pricing.shipping.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <dt>Total</dt>
                <dd>${pricing.total.toFixed(2)}</dd>
              </div>
            </dl>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Processing..." : payment === "CARD_STRIPE" ? "Continue to Stripe" : "Place order"}
            </button>
          </section>

          <div className="space-y-6 lg:col-span-2">
            {!session?.user ? (
              <section className="animate-float-in rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <span>🧑</span>
                  Guest details
                </h2>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                    placeholder="Full name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-400"
                    placeholder="Email"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              </section>
            ) : null}

            <section className="animate-float-in rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-md">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span>💰</span>
                Payment method
              </h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-800 md:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                  <input type="radio" name="pay" checked={payment === "COD"} onChange={() => setPayment("COD")} />
                  Cash on delivery
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                  <input type="radio" name="pay" checked={payment === "PAYPAL"} onChange={() => setPayment("PAYPAL")} />
                  PayPal (manual confirmation)
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                  <input
                    type="radio"
                    name="pay"
                    checked={payment === "WALLET"}
                    onChange={() => setPayment("WALLET")}
                    disabled={!session?.user}
                  />
                  Wallet balance {session?.user ? "" : "(login required)"}
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                  <input
                    type="radio"
                    name="pay"
                    checked={payment === "CARD_STRIPE"}
                    onChange={() => setPayment("CARD_STRIPE")}
                  />
                  Credit / debit card (Stripe)
                </label>
              </div>
            </section>
          </div>
        </form>
      )}

      {message ? (
        <p className="animate-float-in mt-4 rounded-xl border border-slate-200 bg-white/95 p-3 text-sm font-medium text-slate-800 shadow-sm">
          {message}
        </p>
      ) : null}
    </main>
  );
}
