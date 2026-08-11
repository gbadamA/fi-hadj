import type { MetadataRoute } from "next";
import { apiGetSafe } from "@/lib/api";
import type { ArticleSummary } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3050";

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/forum", priority: 0.9 },
  { path: "/programme", priority: 0.9 },
  { path: "/inscription", priority: 0.9 },
  { path: "/gala", priority: 0.8 },
  { path: "/exposants", priority: 0.8 },
  { path: "/organigramme", priority: 0.6 },
  { path: "/actualites", priority: 0.7 },
  { path: "/contact", priority: 0.6 },
  { path: "/mentions-legales", priority: 0.2 },
  { path: "/confidentialite", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = (await apiGetSafe<ArticleSummary[]>("/articles/published")) ?? [];
  const now = new Date();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE}${route.path}`,
      lastModified: now,
      priority: route.priority,
    })),
    ...articles.map((article) => ({
      url: `${SITE}/actualites/${article.slug}`,
      lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
      priority: 0.5,
    })),
  ];
}
