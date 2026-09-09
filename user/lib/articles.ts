import { supabase } from "./supabase";

export type Article = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  read_time_minutes: number | null;
  view_count: number;
  published_at: string | null;
  categories: { name: string; slug: string } | null;
};

const ARTICLE_FIELDS = `
  id, title, slug, excerpt, body, cover_image_url,
  read_time_minutes, view_count, published_at,
  categories ( name, slug )
`;

export async function getLatestArticles(limit = 5): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getLatestArticles failed:", error);
    return [];
  }
  return (data ?? []) as unknown as Article[];
}

export async function getTrendingArticles(limit = 4): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getTrendingArticles failed:", error);
    return [];
  }
  return (data ?? []) as unknown as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getArticleBySlug failed:", error);
    return null;
  }
  return data as unknown as Article | null;
}

export async function getArticlesByCategorySlug(
  categorySlug: string,
  limit = 20,
): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .eq("categories.slug", categorySlug)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getArticlesByCategorySlug failed:", error);
    return [];
  }
  return ((data ?? []) as unknown as Article[]).filter((a) => a.categories?.slug === categorySlug);
}

export async function getCategoryName(categorySlug: string): Promise<string | null> {
  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", categorySlug)
    .maybeSingle();
  return data?.name ?? null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatViews(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k views`;
  return `${count} views`;
}

export async function searchArticles(query: string, limit = 20): Promise<Article[]> {
  const safeQuery = query.replace(/[%,]/g, "");
  if (!safeQuery.trim()) return [];

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .or(`title.ilike.%${safeQuery}%,excerpt.ilike.%${safeQuery}%,body.ilike.%${safeQuery}%`)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("searchArticles failed:", error);
    return [];
  }
  return (data ?? []) as unknown as Article[];
}