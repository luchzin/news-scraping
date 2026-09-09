"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import type { Admin } from "@/lib/types";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    supabase
      .from("admins")
      .select("id, name, email, status, is_owner, user_id")
      .then(({ data }) => setAdmins((data ?? []) as unknown as Admin[]));
  }, []);

  return (
    <AuthGuard>
      <AdminShell title="Admin" subtitle="Who can fetch, edit, and approve content">
        <div className="rounded-lg border border-gray-200 bg-white">
          <ul>
            {admins.map((admin: any) => (
              <li
                key={admin.id}
                className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
                    CCH
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {admin.name}
                      {admin.user_id === currentUserId ? " (you)" : ""}
                    </p>
                    <p className="text-xs text-gray-500">{admin.email}</p>
                  </div>
                </div>
                <StatusBadge
                  label={admin.status === "active" ? "Active" : admin.status}
                  variant="outline-blue"
                />
              </li>
            ))}
            {admins.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-500">
                No admins found.
              </li>
            )}
          </ul>
        </div>
      </AdminShell>
    </AuthGuard>
  );
}
