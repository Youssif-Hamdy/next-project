import Link from "next/link";
import Image from "next/image";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PushSubscribe } from "@/components/PushSubscribe";

export default function Home() {
  const quickLinks = [
    {
      href: "/auth/register",
      title: "Register",
      desc: "Create your account and unlock exclusive offers",
      icon: "✨",
      accent: "bg-blue-50 border-blue-100 hover:border-blue-300",
      iconBg: "bg-blue-100",
    },
    {
      href: "/auth/login",
      title: "Login",
      desc: "Continue your shopping journey",
      icon: "🔐",
      accent: "bg-amber-50 border-amber-100 hover:border-amber-300",
      iconBg: "bg-amber-100",
    },
    {
      href: "/products",
      title: "Browse Products",
      desc: "Explore our latest collection",
      icon: "🛍️",
      accent: "bg-emerald-50 border-emerald-100 hover:border-emerald-300",
      iconBg: "bg-emerald-100",
    },
    {
      href: "/checkout",
      title: "Cart & Checkout",
      desc: "Review items and complete payment",
      icon: "🧾",
      accent: "bg-teal-50 border-teal-100 hover:border-teal-300",
      iconBg: "bg-teal-100",
    },
    {
      href: "/dashboard/profile",
      title: "My Account",
      desc: "Manage profile, orders and wishlist",
      icon: "👤",
      accent: "bg-violet-50 border-violet-100 hover:border-violet-300",
      iconBg: "bg-violet-100",
    },
    {
      href: "/admin/dashboard",
      title: "Admin Panel",
      desc: "Control products, users and marketing",
      icon: "⚙️",
      accent: "bg-rose-50 border-rose-100 hover:border-rose-300",
      iconBg: "bg-rose-100",
    },
  ];

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:py-10">

      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute right-0 top-20 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-60 w-60 rounded-full bg-cyan-200/25 blur-3xl" />
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-8 shadow-sm backdrop-blur-sm md:p-12">

        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border-[32px] border-sky-100/60" />
        <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full border-[24px] border-indigo-100/50" />

        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
          Free shipping on orders above $50
        </span>

        <div className="mb-5 w-fit rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm">
          <Image src="/logo.svg" alt="BlueCart logo" width={200} height={56} priority />
        </div>

        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-[2.75rem]">
          Shop smarter with{" "}
          <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
            BlueCart
          </span>
        </h1>

        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500 md:text-base">
          Discover products, add to cart, checkout as guest or member,
          and track your orders — all in one seamless experience.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:scale-95"
          >
            Start shopping
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-95"
          >
            Create account
          </Link>
        </div>
      </section>

      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Quick links
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${item.accent}`}
            >
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${item.iconBg} transition duration-200 group-hover:scale-110`}>
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.desc}</p>
              </div>
              <span className="ml-auto mt-1 shrink-0 text-slate-300 transition duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-lg">
            📬
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Newsletter</h2>
            <p className="text-xs text-slate-500">Get promotions and updates by email.</p>
          </div>
        </div>
        <NewsletterForm />
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <PushSubscribe />
      </section>

    </main>
  );
}