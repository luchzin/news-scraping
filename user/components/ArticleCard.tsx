import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/articles";
import { formatDate, formatViews } from "@/lib/articles";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-700 sm:flex-row">
      {article.cover_image_url && (
        <Image
          src={article.cover_image_url}
          alt=""
          width={160}
          height={110}
          className="h-44 w-full flex-shrink-0 rounded object-cover sm:h-28 sm:w-40"
        />
      )}
      <div>
        <Link
          href={`/article/${article.slug}`}
          className="text-base font-bold text-inkblue hover:underline dark:text-blue-400 sm:text-lg"
        >
          {article.title}
        </Link>
        {article.excerpt && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{article.excerpt}</p>
        )}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {article.read_time_minutes ? `${article.read_time_minutes} mn read` : ""}
          {" · By Cyber Hub Cambodia · "}
          {formatViews(article.view_count)}
          {" · "}
          {formatDate(article.published_at)}
        </p>
      </div>
    </article>
  );
}