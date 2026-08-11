import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatDateLong } from "@fihadj/shared-types";
import { apiGetSafe } from "@/lib/api";
import { Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { RichText } from "@/components/site/RichText";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  publishedAt: string | null;
  author: { fullName: string } | null;
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await apiGetSafe<Article>(`/articles/slug/${slug}`);
  if (!article) return { title: "Article introuvable" };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      ...(article.coverUrl && { images: [{ url: article.coverUrl }] }),
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await apiGetSafe<Article>(`/articles/slug/${slug}`);
  if (!article) notFound();

  return (
    <>
      <PageHeader
        eyebrow={article.publishedAt ? formatDateLong(article.publishedAt) : "Communiqué"}
        title={article.title}
        intro={article.excerpt ?? undefined}
      />
      <Section>
        <Container size="narrow">
          <Link
            href="/actualites"
            className="mb-8 inline-flex items-center gap-2 text-caption font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Toutes les actualités
          </Link>

          {article.coverUrl && (
            <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-md">
              <Image
                src={article.coverUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <RichText
            body={article.content}
            className="text-body leading-relaxed text-light-muted dark:text-dark-muted"
          />

          {article.author && (
            <p className="mt-10 border-t border-light-border pt-6 text-caption text-light-muted dark:border-dark-border dark:text-dark-muted">
              Publié par {article.author.fullName} — Commissariat Général du FI-HADJ
            </p>
          )}
        </Container>
      </Section>
    </>
  );
}
