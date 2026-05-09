"use client";

import { useEffect, useState } from "react";

export default function WishlistPage() {
  const [data, setData] = useState<{ wishlist: string[]; favorites: string[] }>({
    wishlist: [],
    favorites: [],
  });

  useEffect(() => {
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((res) => setData({ wishlist: res.wishlist ?? [], favorites: res.favorites ?? [] }));
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Wishlist & Favorites</h1>
      <div className="space-y-4">
        <section>
          <h2 className="font-semibold">Wishlist</h2>
          {data.wishlist.length ? (
            <ul className="list-disc ml-6">{data.wishlist.map((id) => <li key={id}>{id}</li>)}</ul>
          ) : (
            <p className="text-sm text-gray-500">No products in wishlist.</p>
          )}
        </section>
        <section>
          <h2 className="font-semibold">Favorites</h2>
          {data.favorites.length ? (
            <ul className="list-disc ml-6">{data.favorites.map((id) => <li key={id}>{id}</li>)}</ul>
          ) : (
            <p className="text-sm text-gray-500">No favorite products.</p>
          )}
        </section>
      </div>
    </main>
  );
}
