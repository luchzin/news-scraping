"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type PreviewArticle = {
  id: string;
  title: string;
  body: string;
  social_caption: string | null;
  status: string;
};

export default function ArticlePreviewModal({
  article,
  onClose,
  onDrop,
  onAllow,
  onSaved,
}: {
  article: PreviewArticle;
  onClose: () => void;
  onDrop: (id: string) => void;
  onAllow: (id: string) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [body, setBody] = useState(article.body);
  const [socialCaption, setSocialCaption] = useState(article.social_caption ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty =
    title !== article.title ||
    body !== article.body ||
    socialCaption !== (article.social_caption ?? "");

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("articles")
      .update({ title, body, social_caption: socialCaption })
      .eq("id", article.id);
    setSaving(false);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-b border-transparent text-lg font-semibold focus:border-gray-300 focus:outline-none"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Social caption
        </label>
        <textarea
          value={socialCaption}
          onChange={(e) => setSocialCaption(e.target.value)}
          rows={2}
          className="mb-4 w-full rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium text-gray-500">
          Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="mb-4 w-full rounded-md border border-gray-200 p-3 text-sm leading-relaxed text-gray-800 focus:border-gray-300 focus:outline-none"
        />

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-500">
            {saving ? "Saving…" : saved ? "Saved ✓" : isDirty ? "Unsaved changes" : ""}
          </div>
          <div className="flex gap-3">
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Save Changes
              </button>
            )}
            {article.status === "pending" && (
              <>
                <button
                  onClick={() => {
                    onDrop(article.id);
                    onClose();
                  }}
                  className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600"
                >
                  Drop
                </button>
                <button
                  onClick={() => {
                    onAllow(article.id);
                    onClose();
                  }}
                  className="rounded-md border border-blue-500 px-4 py-2 text-sm font-medium text-blue-700"
                >
                  Allow
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}