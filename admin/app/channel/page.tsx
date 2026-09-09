"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import StatusBadge, { badgeForChannelStatus } from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import type { Channel } from "@/lib/types";

export default function ChannelPage() {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    supabase
      .from("channels")
      .select("id, type, display_name, handle_or_url, status")
      .then(({ data }) => setChannels((data ?? []) as Channel[]));
  }, []);

  return (
    <AuthGuard>
      <AdminShell title="Channel" subtitle="Connection status for each publishing channel">
        <div className="rounded-lg border border-gray-200 bg-white">
          <ul>
            {channels.map((channel) => {
              const badge = badgeForChannelStatus(channel.status);
              return (
                <li
                  key={channel.id}
                  className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold">{channel.display_name}</p>
                    <p className="text-xs text-gray-500">{channel.handle_or_url}</p>
                  </div>
                  <StatusBadge label={badge.label} variant={badge.variant} />
                </li>
              );
            })}
            {channels.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-500">
                No channels configured yet.
              </li>
            )}
          </ul>
        </div>
      </AdminShell>
    </AuthGuard>
  );
}
