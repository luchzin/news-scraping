import ArticleCard from "@/components/ArticleCard";
import { searchArticles } from "@/lib/articles";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q ?? "";
  const articles = query ? await searchArticles(query) : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {query ? (
          <>
            Search results for <span className="text-inkblue dark:text-blue-400">"{query}"</span>
          </>
        ) : (
          "Search"
        )}
      </h1>

      <div className="space-y-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
        {query && articles.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            No articles matched "{query}".
          </p>
        )}
        {!query && (
          <p className="text-gray-500 dark:text-gray-400">
            Type something into the search box above to get started.
          </p>
        )}
      </div>
    </div>
  );
}