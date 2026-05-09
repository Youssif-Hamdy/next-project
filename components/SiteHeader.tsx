"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function refresh() {
      try {
        const raw = localStorage.getItem("ecom_cart_v1");
        if (!raw) {
          setCartCount(0);
          return;
        }
        const parsed = JSON.parse(raw) as { quantity?: number }[];
        const n = Array.isArray(parsed) ? parsed.reduce((s, i) => s + (i.quantity ?? 0), 0) : 0;
        setCartCount(n);
      } catch {
        setCartCount(0);
      }
    }
    refresh();
    window.addEventListener("ecom-cart", refresh);
    return () => window.removeEventListener("ecom-cart", refresh);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          BlueCart
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <Link href="/products" className="rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900">
            Products
          </Link>
          <Link href="/checkout" className="rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900">
            Cart{cartCount ? ` (${cartCount})` : ""}
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/dashboard/profile"
                className="rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
              {session.user.role === "ADMIN" ? (
                <Link
                  href="/admin/dashboard"
                  className="rounded-md bg-slate-900 px-2.5 py-1.5 font-medium text-white hover:bg-slate-800"
                >
                  Admin
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-md px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900">
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md bg-slate-900 px-2.5 py-1.5 font-medium text-white hover:bg-slate-800"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
