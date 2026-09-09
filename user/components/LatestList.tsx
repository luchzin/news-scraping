import Link from "next/link";
import type { Article } from "@/lib/articles";

export default function LatestList({ articles }: { articles: Article[] }) {
  return (
    <aside>
      <h2 className="border-b-2 border-brandred pb-2 text-sm font-bold uppercase tracking-wide text-brandred">
        Latest
      </h2>
      <ul className="mt-4 space-y-5">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/article/${article.slug}`}
              className="font-medium text-inkblue hover:underline"
            >
              {article.title}
            </Link>
            {article.excerpt && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{article.excerpt}</p>
            )}
          </li>
        ))}
        {articles.length === 0 && (
          <li className="text-sm text-gray-500 dark:text-gray-400">No articles yet.</li>
        )}
      </ul>
    </aside>
  );
}