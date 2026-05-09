"use client";

import { FormEvent, useEffect, useState } from "react";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Category {
  _id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    void loadProducts();
    void loadCategories();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: form.get("name"),
      description: form.get("description"),
      category: form.get("category"),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      images: String(form.get("images") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMessage(data.message ?? "Done.");
    if (res.ok) {
      formElement.reset();
      loadProducts();
    }
  }

  async function removeProduct(id: string) {
    if (!confirm("Soft-delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const data = await res.json();
    setMessage(data.message ?? "");
    if (res.ok) loadProducts();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100/40">
      <section className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-blue-900">Product management</h1>
        <p className="mt-1 text-sm text-blue-700">Add products and manage existing inventory.</p>
      </div>

      <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 gap-2 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <input name="name" className="rounded-lg border border-blue-200 p-2.5" placeholder="Product name" required />
        <select name="category" className="rounded-lg border border-blue-200 p-2.5" required defaultValue="">
          <option value="" disabled>
            Select category
          </option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="price" type="number" className="rounded-lg border border-blue-200 p-2.5" placeholder="Price" required />
        <input name="stock" type="number" className="rounded-lg border border-blue-200 p-2.5" placeholder="Stock" required />
        <input
          name="images"
          className="rounded-lg border border-blue-200 p-2.5 md:col-span-2"
          placeholder="Image URLs (comma separated)"
        />
        <textarea
          name="description"
          className="rounded-lg border border-blue-200 p-2.5 md:col-span-2"
          placeholder="Description"
          required
        />
        <button type="submit" className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Add product
        </button>
      </form>

      {message ? <p className="mb-4 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-800">{message}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
              <th className="p-2">Stock</th>
              <th className="p-2"> </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t border-blue-100">
                <td className="p-2">{product.name}</td>
                <td className="p-2">{product.category}</td>
                <td className="p-2">${product.price}</td>
                <td className="p-2">{product.stock}</td>
                <td className="p-2">
                  <button
                    type="button"
                    className="rounded-lg bg-red-50 px-3 py-1 text-red-700 hover:bg-red-100"
                    onClick={() => removeProduct(product._id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>
    </main>
  );
}
