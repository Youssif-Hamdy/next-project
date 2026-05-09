"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  rating?: number;
  images?: string[];
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data.product);
        setReviews(data.reviews ?? []);
      });
  }, [id]);

  async function addReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: id,
        rating: Number(form.get("rating")),
        comment: String(form.get("comment") ?? ""),
      }),
    });
    const data = await res.json();
    setMessage(data.message ?? "Done.");
  }

  async function addToList(type: "wishlist" | "favorites") {
    if (!id) return;
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, type }),
    });
    const data = await res.json();
    setMessage(data.message ?? "Done.");
  }

  function addToCart() {
    if (!product) return;
    const q = Math.min(Math.max(1, qty), product.stock);
    if (product.stock < 1) {
      setMessage("Out of stock.");
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: q,
    });
    setMessage("Added to cart.");
  }

  if (!product) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6">
        <div className="animate-float-in rounded-2xl border border-white/30 bg-white/15 p-6 text-white shadow-2xl backdrop-blur-md">
          Loading product...
        </div>
      </main>
    );
  }

  const hero = product.images?.[0];
  const safeStock = Math.max(0, product.stock);
  const isInStock = safeStock > 0;

  return (
    <main className="relative mx-auto w-full max-w-5xl p-4 md:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-12 top-4 h-64 w-64 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      </div>

      <section className="animate-float-in overflow-hidden rounded-3xl border border-white/30 bg-white/15 shadow-2xl backdrop-blur-md">
        {hero ? (
          <img
            src={hero}
            alt={product.name}
            className="aspect-video w-full object-cover transition duration-500 hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-video w-full bg-slate-200/60" />
        )}

        <div className="grid gap-6 p-5 md:grid-cols-3 md:p-7">
          <div className="md:col-span-2">
            <p className="mb-2 inline-flex rounded-full border border-cyan-200/50 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
              {product.category}
            </p>
            <h1 className="text-2xl font-black text-white md:text-3xl">{product.name}</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100">{product.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-blue-50">⭐ Rating: {product.rating ?? 0}</span>
              <span className="rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-blue-50">
                📦 Stock: {safeStock}
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/25 bg-white/10 p-4">
            <p className="text-xs text-blue-100">Price</p>
            <p className="text-3xl font-black text-white">${product.price.toFixed(2)}</p>
            <p className={`mt-2 text-xs ${isInStock ? "text-emerald-300" : "text-red-300"}`}>
              {isInStock ? "In stock" : "Out of stock"}
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-2">
              <span className="text-sm text-blue-100">Qty</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, safeStock)}
                className="w-20 rounded-lg border border-white/35 bg-white/15 px-2 py-1.5 text-sm text-white outline-none transition placeholder:text-blue-100 focus:border-cyan-300"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
            </div>

            <button
              type="button"
              disabled={!isInStock}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-400 hover:shadow-[0_12px_28px_rgba(56,189,248,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={addToCart}
            >
              🛒 Add to cart
            </button>

            <Link
              href="/checkout"
              className="mt-2 inline-flex w-full justify-center rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-sm font-medium text-white transition duration-300 hover:bg-white/20"
            >
              View checkout
            </Link>
          </aside>
        </div>
      </section>

      <section className="animate-float-in mt-5 rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white">Save for later</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm text-white transition duration-300 hover:bg-white/20"
            onClick={() => addToList("wishlist")}
          >
            💝 Add to wishlist
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/35 bg-white/10 px-3 py-2 text-sm text-white transition duration-300 hover:bg-white/20"
            onClick={() => addToList("favorites")}
          >
            ⭐ Add to favorites
          </button>
        </div>
      </section>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <form onSubmit={addReview} className="animate-float-in rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white">Write a review</h2>
          <div className="mt-3 space-y-2">
            <select
              name="rating"
              className="w-full rounded-lg border border-white/35 bg-white/10 p-2 text-white outline-none transition focus:border-cyan-300"
              defaultValue="5"
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v} className="text-slate-900">
                  {v}
                </option>
              ))}
            </select>
            <textarea
              name="comment"
              className="min-h-28 w-full rounded-lg border border-white/35 bg-white/10 p-2 text-white placeholder:text-blue-100 outline-none transition focus:border-cyan-300"
              placeholder="Review comment"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Submit review
            </button>
          </div>
        </form>

        <section className="animate-float-in rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur-md">
          <h2 className="mb-2 text-lg font-semibold text-white">Reviews</h2>
          {reviews.length ? (
            <ul className="space-y-2">
              {reviews.map((review) => (
                <li key={review._id} className="rounded-xl border border-white/25 bg-white/10 p-3">
                  <p className="text-sm font-medium text-blue-100">Rating: {review.rating}/5</p>
                  <p className="mt-1 text-sm text-white">{review.comment}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-blue-100">No reviews yet.</p>
          )}
        </section>
      </section>

      {message ? (
        <p className="animate-float-in mt-4 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-sm text-white shadow-md backdrop-blur-md">
          {message}
        </p>
      ) : null}
    </main>
  );
}
