"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  _id: string;
  totalPrice: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: OrderItem[];
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders ?? []));
  }, []);

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Order history</h1>
      {orders.length ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Order ID: {order._id}</p>
              <p className="font-semibold text-slate-900">Total: ${Number(order.totalPrice).toFixed(2)}</p>
              {order.subtotal != null ? (
                <div className="mt-2 text-xs text-slate-600">
                  <p>Subtotal: ${Number(order.subtotal).toFixed(2)}</p>
                  {order.tax != null ? <p>Tax: ${Number(order.tax).toFixed(2)}</p> : null}
                  {order.shipping != null ? <p>Shipping: ${Number(order.shipping).toFixed(2)}</p> : null}
                </div>
              ) : null}
              <p className="text-sm text-slate-700">Status: {order.status}</p>
              {order.paymentMethod ? (
                <p className="text-sm text-slate-600">
                  Payment: {order.paymentMethod}
                  {order.paymentStatus ? ` (${order.paymentStatus})` : ""}
                </p>
              ) : null}
              {order.items?.length ? (
                <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
                  {order.items.map((it, i) => (
                    <li key={i}>
                      {it.name} × {it.quantity} @ ${Number(it.unitPrice).toFixed(2)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No orders yet.</p>
      )}
    </main>
  );
}
