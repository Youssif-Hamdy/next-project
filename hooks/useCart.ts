"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "ecom_cart_v1";

export type CartItem = { productId: string; name: string; price: number; quantity: number };

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event("ecom-cart"));
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const q = item.quantity ?? 1;
      const cur = read();
      const i = cur.findIndex((x) => x.productId === item.productId);
      let next: CartItem[];
      if (i >= 0) {
        next = [...cur];
        next[i] = { ...next[i], quantity: next[i].quantity + q };
      } else {
        next = [...cur, { productId: item.productId, name: item.name, price: item.price, quantity: q }];
      }
      persist(next);
    },
    [persist]
  );

  const removeItem = useCallback(
    (productId: string) => {
      persist(read().filter((x) => x.productId !== productId));
    },
    [persist]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        persist(read().filter((x) => x.productId !== productId));
        return;
      }
      const cur = read();
      persist(cur.map((x) => (x.productId === productId ? { ...x, quantity } : x)));
    },
    [persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const summary = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return { subtotal, count };
  }, [items]);

  return { items, addItem, removeItem, setQuantity, clear, summary };
}
