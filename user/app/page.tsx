import ArticleCard from "@/components/ArticleCard";
import LatestList from "@/components/LatestList";
import TrendingList from "@/components/TrendingList";
import { getLatestArticles, getTrendingArticles } from "@/lib/articles";

export const revalidate = 60; // re-fetch published articles at most once a minute

export default async function HomePage() {
  const [latest, trending] = await Promise.all([
    getLatestArticles(5),
    getTrendingArticles(4),
  ]);

  // The main feed reuses the latest articles for now; once you have enough
  // published content you may want a separate "feed" query with its own
  // pagination instead of reusing the sidebar list.
  const feed = latest;

  return (
    <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1fr_2fr_1fr]">
      <div className="order-2 lg:order-none">
        <LatestList articles={latest} />
      </div>

      <section className="order-1 space-y-6 lg:order-none">
        {feed.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
        {feed.length === 0 && (
          <p className="text-gray-500">
            No published articles yet — once you approve something in the
            Review Queue, it'll show up here.
          </p>
        )}
      </section>

      <div className="order-3 lg:order-none">
        <TrendingList articles={trending} />
      </div>
    </div>
  );
}
