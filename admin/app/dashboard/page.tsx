"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AdminShell from "@/components/AdminShell";
import StatusBadge, { badgeForArticleStatus } from "@/components/StatusBadge";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/lib/types";

type Counts = {
  pending_review: number;
  published: number;
  rejected: number;
  active_sources: number;
  channels_connected: number;
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<Article[]>([]);

  useEffect(() => {
    supabase
      .from("v_dashboard_counts")
      .select("*")
      .single()
      .then(({ data }) => setCounts(data as Counts));

    supabase
      .from("articles")
      .select("id, title, status, origin, created_at, sources(name), categories(name)")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent((data ?? []) as unknown as Article[]));
  }, []);

  const cards = [
    { label: "Pending review", value: counts?.pending_review },
    { label: "Published", value: counts?.published },
    { label: "Rejected", value: counts?.rejected },
    { label: "Active sources", value: counts?.active_sources },
    { label: "Channel Connected", value: counts?.channels_connected },
  ];

  return (
    <AuthGuard>
      <AdminShell title="Dashboard" subtitle="Overview of Cambodia Cyber Hub">
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-gray-200 bg-white p-5 text-center"
            >
              <p className="text-2xl font-bold">{card.value ?? "—"}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold">Recent activity</h2>
            <a href="/all-articles" className="text-sm text-blue-700">
              View all
            </a>
          </div>
          <ul>
            {recent.map((article) => {
              const badge = badgeForArticleStatus(article.status);
              return (
                <li
                  key={article.id}
                  className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">
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
                  <StatusBadge label={badge.label} variant={badge.variant} />
                </li>
              );
            })}
            {recent.length === 0 && (
              <li className="px-5 py-6 text-sm text-gray-500">No activity yet.</li>
            )}
          </ul>
        </div>
      </AdminShell>
    </AuthGuard>
  );
}
