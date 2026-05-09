"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("?inStock=true");

  useEffect(() => {
    fetch(`/api/products${query}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
      });
  }, [query]);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const searchParams = new URLSearchParams();
    const search = String(form.get("search") ?? "");
    const category = String(form.get("category") ?? "");
    const minPrice = String(form.get("minPrice") ?? "");
    const maxPrice = String(form.get("maxPrice") ?? "");
    const inStock = form.get("inStock") === "on";

    if (search) searchParams.set("search", search);
    if (category) searchParams.set("category", category);
    if (minPrice) searchParams.set("minPrice", minPrice);
    if (maxPrice) searchParams.set("maxPrice", maxPrice);
    if (inStock) searchParams.set("inStock", "true");

    setQuery(`?${searchParams.toString()}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/api/assets/products-bg')" }}
      />
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl p-6 md:p-8 animate-float-in">
        <div className="mb-6 rounded-2xl border border-white/30 bg-white/10 p-5 shadow-2xl backdrop-blur-lg">
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-blue-100">Search, filter, and discover the best items.</p>
        </div>

        <form
          onSubmit={onFilter}
          className="glass-panel mb-6 grid grid-cols-1 gap-2 rounded-2xl p-4 md:grid-cols-5"
        >
          <input
            name="search"
            className="rounded-xl border border-white/30 bg-white/10 p-2.5 text-white placeholder:text-blue-100 outline-none transition duration-300 focus:border-cyan-200 focus:shadow-[0_0_18px_rgba(56,189,248,0.4)]"
            placeholder="Search by name"
          />
          <select
            name="category"
            className="rounded-xl border border-white/30 bg-white/10 p-2.5 text-white outline-none transition duration-300 focus:border-cyan-200"
          >
            <option className="text-black" value="">
              All categories
            </option>
            {categories.map((category) => (
              <option className="text-black" value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            name="minPrice"
            type="number"
            className="rounded-xl border border-white/30 bg-white/10 p-2.5 text-white placeholder:text-blue-100 outline-none transition duration-300 focus:border-cyan-200"
            placeholder="Min price"
          />
          <input
            name="maxPrice"
            type="number"
            className="rounded-xl border border-white/30 bg-white/10 p-2.5 text-white placeholder:text-blue-100 outline-none transition duration-300 focus:border-cyan-200"
            placeholder="Max price"
          />
          <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-blue-50">
            <input name="inStock" type="checkbox" defaultChecked /> In stock only
          </label>
          <button className="w-fit rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-400 hover:shadow-[0_12px_26px_rgba(59,130,246,0.5)] md:col-span-5">
            Apply Filters
          </button>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.map((product) => (
            <article
              key={product._id}
              className="group rounded-2xl border border-white/30 bg-white/12 p-4 shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/20 hover:shadow-[0_18px_35px_rgba(15,23,42,0.5)]"
            >
              <h2 className="font-semibold text-lg">{product.name}</h2>
              <p className="mt-1 text-sm text-blue-100">{product.description}</p>
              <p className="mt-3 text-sm">Category: {product.category}</p>
              <p className="text-sm">Price: ${product.price}</p>
              <p className="text-sm">Stock: {product.stock}</p>
              <Link
                className="mt-3 inline-block rounded-lg border border-cyan-300/60 px-3 py-1.5 text-sm text-cyan-100 transition duration-300 group-hover:bg-cyan-300/20"
                href={`/products/${product._id}`}
              >
                View details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
