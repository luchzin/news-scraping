"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddSourceModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("rss");
  const [scope, setScope] = useState("international");
  const [feedUrl, setFeedUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("sources").insert({
      name,
      type,
      scope,
      feed_url: feedUrl || null,
      is_active: true,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onAdded();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Add Source</h2>

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Hacker News"
            className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="rss">rss</option>
                <option value="advisory_api">advisory_api</option>
                <option value="manual">manual</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="national">national</option>
                <option value="international">international</option>
              </select>
            </div>
          </div>

          <label className="mb-1 block text-sm font-medium">Feed URL</label>
          <input
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="https://example.com/feed"
            className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}