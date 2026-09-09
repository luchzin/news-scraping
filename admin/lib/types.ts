export type ArticleStatus = "draft" | "pending" | "approved" | "rejected" | "published";
export type ArticleOrigin = "auto" | "manual";

export type Article = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  body: string;
  status: ArticleStatus;
  origin: ArticleOrigin;
  scope: string | null;
  created_at: string;
  published_at: string | null;
  sources: { name: string } | null;
  categories: { name: string } | null;
};

export type Source = {
  id: string;
  name: string;
  type: string;
  scope: string;
  is_active: boolean;
  feed_url: string | null;
};

export type Channel = {
  id: string;
  type: string;
  display_name: string;
  handle_or_url: string | null;
  status: string;
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  status: string;
  is_owner: boolean;
};
