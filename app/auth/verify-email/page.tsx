"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setMessage("Missing token.");
        return;
      }

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setMessage(data.message ?? "Done.");
    }
    void verify();
  }, [token]);

  return (
    <main className="mx-auto w-full max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Email Verification</h1>
      <p>{message}</p>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="p-6">Loading...</main>}>
      <VerifyInner />
    </Suspense>
  );
}
