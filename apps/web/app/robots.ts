import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3050";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Le back-office et les pages de vérification de badge exposent des données
      // nominatives : aucune raison qu'un moteur les indexe.
      disallow: ["/admin", "/badge"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
