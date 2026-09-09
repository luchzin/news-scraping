"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import ArticlePreviewModal from "@/components/ArticlePreviewModal";
import { supabase } from "@/lib/supabase";
import type { Article, ArticleStatus } from "@/lib/types";

type Mode = "auto" | "manual";
type Tab = "pending" | "approved" | "rejected";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function ReviewQueuePage() {
  const [mode, setMode] = useState<Mode>("auto");
  const [tab, setTab] = useState<Tab>("pending");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);
  const [fetchLimit, setFetchLimit] = useState(10);

  // Manual mode form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const statusForTab: Record<Tab, ArticleStatus> = {
    pending: "pending",
    approved: "approved",
    rejected: "rejected",
  };

  async function loadArticles() {
    const { data } = await supabase
      .from("articles")
      .select(
        "id, title, body, social_caption, status, origin, created_at, sources(name), categories(name)",
      )
      .eq("origin", "auto")
      .eq("status", statusForTab[tab])
      .order("created_at", { ascending: false });
    setArticles((data ?? []) as unknown as Article[]);
  }

  useEffect(() => {
    if (mode === "auto") loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tab]);

  async function handleFetchNews() {
    setFetching(true);
    setFetchMessage(null);
    const { data, error } = await supabase.functions.invoke("fetch-and-draft", {
      method: "POST",
      body: { limit: fetchLimit },
    });
    setFetching(false);
    if (error) {
      setFetchMessage(`Error: ${error.message}`);
    } else {
      setFetchMessage(
        `Fetched ${data?.fetched ?? 0}, drafted ${data?.created ?? 0} new, skipped ${data?.skipped ?? 0} (limit: ${data?.limitUsed ?? fetchLimit} per source).`,
      );
      loadArticles();
    }
  }

  async function updateStatus(id: string, status: ArticleStatus) {
    await supabase.from("articles").update({ status }).eq("id", id);
    loadArticles();
  }

  async function deleteArticle(id: string) {
    if (!confirm("Permanently delete this article? This can't be undone.")) return;
    await supabase.from("articles").delete().eq("id", id);
    loadArticles();
  }

  async function handleManualSubmit(status: ArticleStatus) {
    setSaving(true);
    await supabase.from("articles").insert({
      title,
      body,
      origin: "manual",
      status,
    });
    setSaving(false);
    setTitle("");
    setCategory("");
    setSource("");
    setBody("");
  }

  return (
    <AuthGuard>
      <AdminShell
        title="Review Queue"
        subtitle="Approve, edit, or reject before publishing to Website, Telegram, Facebook, and X"
        action={
          mode === "auto" ? (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Per source:
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={fetchLimit}
                  onChange={(e) => setFetchLimit(Number(e.target.value))}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </label>
              <button
                onClick={handleFetchNews}
                disabled={fetching}
                className="rounded-md bg-brandred px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {fetching ? "Fetching…" : "Fetch News"}
              </button>
            </div>
          ) : (
            <button className="rounded-md bg-brandred px-5 py-2 text-sm font-semibold text-white">
              Import
            </button>
          )
        }
      >
        <div className="mb-6 inline-flex overflow-hidden rounded-md border border-gray-300">
          <button
            onClick={() => setMode("auto")}
            className={`px-4 py-2 text-sm font-medium ${
              mode === "auto" ? "bg-brand text-white" : "bg-white text-gray-700"
            }`}
          >
            Auto-Generated
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-2 text-sm font-medium ${
              mode === "manual" ? "bg-brand text-white" : "bg-white text-gray-700"
            }`}
          >
            Manual
          </button>
        </div>

        {fetchMessage && (
          <p className="mb-4 text-sm text-gray-600">{fetchMessage}</p>
        )}

        {mode === "auto" ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex gap-6 border-b border-gray-100 px-5">
              {(["pending", "approved", "rejected"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 py-3 text-sm font-medium capitalize ${
                    tab === t
                      ? "border-brand text-brand"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <ul>
              {articles.map((article) => (
                <li
                  key={article.id}
                  className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
                      CCH
                    </div>
                    <div>
                      <button
                        onClick={() => setSelectedArticle(article)}
                        className="text-left text-sm font-medium text-blue-700 hover:underline"
                      >
                        {article.title}
                      </button>
                      <p className="text-xs text-gray-500">
                        Auto
                        {article.sources?.name ? ` - ${article.sources.name}` : ""}
                        {article.categories?.name ? ` - ${article.categories.name}` : ""}
                        {" - "}
                        {timeAgo(article.created_at)}
                      </p>
                    </div>
                  </div>
                  {tab === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(article.id, "rejected")}
                        className="rounded-md border border-red-300 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-600"
                      >
                        Drop
                      </button>
                      <button
                        onClick={() => updateStatus(article.id, "published")}
                        className="rounded-md border border-blue-500 px-4 py-1.5 text-sm font-medium text-blue-700"
                      >
                        Allow
                      </button>
                    </div>
                  )}
                  {tab === "rejected" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => updateStatus(article.id, "pending")}
                        className="rounded-md border border-blue-500 px-4 py-1.5 text-sm font-medium text-blue-700"
                      >
                        Restore
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {articles.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-gray-500">
                  Nothing here yet.
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Source</label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <label className="mb-1 block text-sm font-medium">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="Write the article…"
              className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleManualSubmit("draft")}
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
              >
                Save as draft
              </button>
              <button
                onClick={() => handleManualSubmit("pending")}
                disabled={saving}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white"
              >
                Submit for review
              </button>
            </div>
          </div>
        )}

        {selectedArticle && (
          <ArticlePreviewModal
            article={{
              ...selectedArticle,
              social_caption:
                (selectedArticle as Article & {
                  social_caption?: string | null;
                }).social_caption ?? "",
            }}
            onClose={() => setSelectedArticle(null)}
            onDrop={(id) => updateStatus(id, "rejected")}
            onAllow={(id) => updateStatus(id, "published")}
            onSaved={loadArticles}
          />
        )}
      </AdminShell>
    </AuthGuard>
  );
}