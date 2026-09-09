import Image from "next/image";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import TrendingList from "@/components/TrendingList";
import {
  getArticleBySlug,
  getTrendingArticles,
  formatDate,
  formatViews,
} from "@/lib/articles";

export const revalidate = 60;

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const [article, trending] = await Promise.all([
    getArticleBySlug(params.slug),
    getTrendingArticles(4),
  ]);

  if (!article) notFound();

  const moreNews = trending.filter((a) => a.id !== article.id).slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_1fr]">
      <article>
        <h1 className="font-serif text-2xl font-bold leading-tight text-inkblue dark:text-blue-400 sm:text-3xl md:text-4xl">
          {article.title}
        </h1>

        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {formatViews(article.view_count)}
          {" · "}
          {formatDate(article.published_at)}
          {article.read_time_minutes ? ` · ${article.read_time_minutes} mn read` : ""}
          {" · By Cyber Hub Cambodia"}
        </p>

        {article.cover_image_url && (
          <Image
            src={article.cover_image_url}
            alt={article.title}
            width={900}
            height={500}
            className="mt-6 w-full rounded-lg object-cover"
          />
        )}

        <div className="prose prose-sm dark:prose-invert sm:prose-base lg:prose-lg mt-8 max-w-none whitespace-pre-line text-gray-800 dark:text-gray-200">
          {article.body}
        </div>

        {moreNews.length > 0 && (
          <section className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
            <h2 className="mb-6 text-lg font-bold italic text-gray-700 dark:text-gray-300">
              More Cybersecurity News
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {moreNews.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        )}
      </article>

      <TrendingList articles={trending} />
    </div>
  );
}