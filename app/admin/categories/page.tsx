"use client";

import { FormEvent, useEffect, useState } from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
      }),
    });
    const data = await res.json();
    setMessage(data.message ?? "");
    if (res.ok) {
      formElement.reset();
      load();
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    setMessage(data.message ?? "");
    if (res.ok) load();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100/40">
      <section className="mx-auto w-full max-w-3xl p-6">
        <div className="mb-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-900">Categories</h1>
          <p className="mt-1 text-sm text-blue-700">Create and manage product categories.</p>
        </div>

        <form onSubmit={onCreate} className="mb-6 grid gap-2 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
          <input
            name="name"
            className="rounded-lg border border-blue-200 p-2.5 outline-none focus:border-blue-400"
            placeholder="Name"
            required
          />
          <input
            name="description"
            className="rounded-lg border border-blue-200 p-2.5 outline-none focus:border-blue-400"
            placeholder="Description"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add category"}
          </button>
        </form>

        {message ? <p className="mb-3 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-800">{message}</p> : null}

        <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c._id}
            className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 shadow-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{c.name}</p>
              <p className="text-xs text-blue-700">{c.slug}</p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-red-50 px-3 py-1 text-sm text-red-700 hover:bg-red-100"
              onClick={() => remove(c._id)}
            >
              Delete
            </button>
          </li>
        ))}
        </ul>
      </section>
    </main>
  );
}
