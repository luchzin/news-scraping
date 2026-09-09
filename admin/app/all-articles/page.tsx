"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import StatusBadge, { badgeForArticleStatus } from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AllArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function load() {
    const { data } = await supabase
      .from("articles")
      .select("id, title, status, origin, created_at, sources(name), categories(name)")
      .order("created_at", { ascending: false });
    setArticles((data ?? []) as unknown as Article[]);
    setSelectedIds(new Set()); // clear selection whenever the list refreshes
  }

  useEffect(() => {
    load();
  }, []);

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map((a) => a.id)));
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm("Permanently delete this article? This can't be undone.")) return;
    await supabase.from("articles").delete().eq("id", id);
    load();
  }

  async function restoreArticle(id: string) {
    await supabase.from("articles").update({ status: "pending" }).eq("id", id);
    load();
  }

  async function bulkDelete() {
    const count = selectedIds.size;
    if (!confirm(`Permanently delete ${count} article${count === 1 ? "" : "s"}? This can't be undone.`)) return;
    await supabase.from("articles").delete().in("id", Array.from(selectedIds));
    load();
  }

  async function bulkRestore() {
    await supabase
      .from("articles")
      .update({ status: "pending" })
      .in("id", Array.from(selectedIds));
    load();
  }

  const allSelected = articles.length > 0 && selectedIds.size === articles.length;

  return (
    <AuthGuard>
      <AdminShell title="All articles" subtitle="Every article across the site">
        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size} selected
            </span>
            <button
              onClick={bulkRestore}
              className="rounded-md border border-blue-500 bg-white px-3 py-1.5 text-sm font-medium text-blue-700"
            >
              Restore selected
            </button>
            <button
              onClick={bulkDelete}
              className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600"
            >
              Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-500 hover:underline"
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4"
            />
            <span className="text-xs font-medium text-gray-500">Select all</span>
          </div>

          <ul>
            {articles.map((article) => {
              const badge = badgeForArticleStatus(article.status);
              const checked = selectedIds.has(article.id);
              return (
                <li
                  key={article.id}
                  className={`flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-0 ${
                    checked ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(article.id)}
                      className="h-4 w-4 flex-shrink-0"
                    />
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
                      CCH
                    </div>
                    <div>
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-gray-500">
                        {article.origin === "auto" ? "Auto" : "Manual"}
                        {article.sources?.name ? ` - ${article.sources.name}` : ""}
                        {article.categories?.name ? ` - ${article.categories.name}` : ""}
                        {" - "}
                        {timeAgo(article.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-3">
                    <StatusBadge label={badge.label} variant={badge.variant} />
                    {article.status === "rejected" && (
                      <button
                        onClick={() => restoreArticle(article.id)}
                        className="rounded-md border border-blue-500 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
            {articles.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-500">
                No articles yet.
              </li>
            )}
          </ul>
        </div>
      </AdminShell>
    </AuthGuard>
  );
}