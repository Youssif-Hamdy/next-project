"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function ReturnInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [message, setMessage] = useState("Confirming payment...");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setMessage("Missing session. Return to checkout and try again.");
      return;
    }
    (async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCheckoutSessionId: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "Could not finalize order.");
        return;
      }
      setOrderId(typeof data.orderId === "string" ? data.orderId : null);
      setMessage(data.duplicate ? "Order was already recorded." : "Payment successful. Thank you!");
      try {
        localStorage.removeItem("ecom_cart_v1");
        window.dispatchEvent(new Event("ecom-cart"));
      } catch {
        /* ignore */
      }
    })();
  }, [sessionId]);

  return (
    <main className="mx-auto w-full max-w-lg p-6">
      <h1 className="text-xl font-bold text-slate-900">Checkout result</h1>
      <p className="mt-3 text-slate-700">{message}</p>
      {orderId ? <p className="mt-2 text-sm text-slate-600">Order ID: {orderId}</p> : null}
      <Link href="/products" className="mt-6 inline-block text-blue-600 underline">
        Continue shopping
      </Link>
    </main>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading...</main>}>
      <ReturnInner />
    </Suspense>
  );
}
