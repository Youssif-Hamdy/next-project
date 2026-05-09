import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100/40">
      <section className="mx-auto w-full max-w-4xl p-6">
        <div className="mb-6 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-blue-900">Admin dashboard</h1>
          <p className="text-sm text-blue-700">
            Promote a user to ADMIN in MongoDB when bootstrapping the first admin account. Sellers stay pending until
            you approve them from User management.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href="/admin/users"
            className="rounded-xl border border-blue-200 bg-white p-4 text-blue-900 shadow-sm hover:bg-blue-50"
          >
            Users - approve, restrict, archive
          </Link>
          <Link
            href="/admin/products"
            className="rounded-xl border border-blue-200 bg-white p-4 text-blue-900 shadow-sm hover:bg-blue-50"
          >
            Products - create and manage listings
          </Link>
          <Link
            href="/admin/categories"
            className="rounded-xl border border-blue-200 bg-white p-4 text-blue-900 shadow-sm hover:bg-blue-50"
          >
            Categories
          </Link>
          <Link
            href="/admin/marketing"
            className="rounded-xl border border-blue-200 bg-white p-4 text-blue-900 shadow-sm hover:bg-blue-50"
          >
            Email and push broadcasts
          </Link>
        </div>
      </section>
    </main>
  );
}
