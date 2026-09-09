import ArticleCard from "@/components/ArticleCard";
import { getArticlesByCategorySlug, getCategoryName } from "@/lib/articles";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const [articles, categoryName] = await Promise.all([
    getArticlesByCategorySlug(params.slug),
    getCategoryName(params.slug),
  ]);

  const title = categoryName ?? params.slug.replace(/-/g, " ");

  return (
    <div>
      <h1 className="mb-6 border-b-2 border-brandred pb-2 text-2xl font-bold capitalize text-gray-900 dark:text-gray-100">
        {title}
      </h1>

      <div className="space-y-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
        {articles.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            No articles in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}