import Link from "next/link";
import Image from "next/image";
import { formatDateLong } from "@fihadj/shared-types";
import type { ArticleSummary } from "@/lib/types";

export function ArticleCards({ articles }: { articles: ArticleSummary[] }) {
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {articles.map((article) => (
        <li key={article.id}>
          <Link
            href={`/actualites/${article.slug}`}
            className="lift block h-full overflow-hidden rounded-md border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
          >
            {article.coverUrl ? (
              <div className="relative aspect-[16/9]">
                <Image
                  src={article.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : (
              // Pas de visuel : un aplat du dégradé signature plutôt qu'un cadre
              // vide ou une image générique importée de nulle part.
              <div className="pattern-islamic aspect-[16/9] bg-diplomatic-deep" aria-hidden />
            )}
            <div className="p-5">
              {article.publishedAt && (
                <p className="text-caption text-light-muted dark:text-dark-muted">
                  {formatDateLong(article.publishedAt)}
                </p>
              )}
              <h3 className="mt-2 font-display text-h3 leading-snug">{article.title}</h3>
              {article.excerpt && (
                <p className="mt-2 text-body text-light-muted dark:text-dark-muted">
                  {article.excerpt}
                </p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
