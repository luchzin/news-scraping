"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import ToggleSwitch from "@/components/ToggleSwitch";
import AddSourceModal from "@/components/AddSourceModal";
import { supabase } from "@/lib/supabase";
import type { Source } from "@/lib/types";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("sources")
      .select("id, name, type, scope, is_active, feed_url")
      .order("name");
    setSources((data ?? []) as Source[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(source: Source) {
    await supabase
      .from("sources")
      .update({ is_active: !source.is_active })
      .eq("id", source.id);
    load();
  }

  return (
    <AuthGuard>
      <AdminShell
        title="Sources"
        subtitle="Feeds pulled in when Fetch news is clicked"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white"
          >
            Add Sources
          </button>
        }
      >
        <div className="rounded-lg border border-gray-200 bg-white">
          <ul>
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold">{source.name}</p>
                  <p className="text-xs text-gray-500">
                    {source.type} - {source.scope}
                  </p>
                </div>
                <ToggleSwitch checked={source.is_active} onChange={() => toggleActive(source)} />
              </li>
            ))}
            {sources.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-500">
                No sources added yet.
              </li>
            )}
          </ul>
        </div>

        {showModal && (
          <AddSourceModal onClose={() => setShowModal(false)} onAdded={load} />
        )}
      </AdminShell>
    </AuthGuard>
  );
} 