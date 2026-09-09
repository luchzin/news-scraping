import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatDate } from "@/lib/articles";

export default function TrendingList({ articles }: { articles: Article[] }) {
  return (
    <aside>
      <h2 className="border-b-2 border-brandred pb-2 text-sm font-bold uppercase tracking-wide text-brandred">
        Trending
      </h2>
      <ul className="mt-4 space-y-4">
        {articles.map((article) => (
          <li key={article.id} className="flex gap-3">
            {article.cover_image_url && (
              <Image
                src={article.cover_image_url}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 flex-shrink-0 rounded object-cover"
              />
            )}
            <div>
              <Link
                href={`/article/${article.slug}`}
                className="text-sm font-semibold text-inkblue hover:underline"
              >
                {article.title}
              </Link>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatDate(article.published_at)}
              </p>
            </div>
          </li>
        ))}
        {articles.length === 0 && (
          <li className="text-sm text-gray-500 dark:text-gray-400">No articles yet.</li>
        )}
      </ul>
    </aside>
  );
}