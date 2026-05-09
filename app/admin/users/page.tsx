"use client";

import { useCallback, useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  userStatus?: string;
  isEmailVerified: boolean;
  deletedAt?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((data) => setUsers(data.users ?? []))
      .catch(() => setError("You must be signed in as admin."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchUser(id: string, body: object) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? "Action failed");
      return;
    }
    setError("");
    load();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100/40">
      <section className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-4 rounded-2xl border border-blue-200 bg-white/90 p-5 shadow-sm">
      <h1 className="mb-2 text-2xl font-bold text-blue-900">User management</h1>
      <p className="text-sm text-blue-700">
        Approve sellers, restrict accounts, or soft-delete users. Restricted and deleted users cannot sign in.
      </p>
      </div>
      {error ? <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-50 text-blue-900">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Role</th>
              <th className="p-2">Status</th>
              <th className="p-2">Verified</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t border-blue-100">
                <td className="p-2">{user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{user.phone}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{user.userStatus ?? "ACTIVE"}</td>
                <td className="p-2">{user.isEmailVerified ? "Yes" : "No"}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                      onClick={() => patchUser(user._id, { action: "approve" })}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600"
                      onClick={() => patchUser(user._id, { action: "restrict" })}
                    >
                      Restrict
                    </button>
                    <button
                      type="button"
                      className="rounded bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-900"
                      onClick={() => patchUser(user._id, { action: "soft_delete" })}
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      className="rounded border border-blue-300 bg-white px-2 py-1 text-xs text-blue-800 hover:bg-blue-50"
                      onClick={() => patchUser(user._id, { action: "restore" })}
                    >
                      Restore
                    </button>
                  </div>
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
