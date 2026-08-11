import type { Metadata } from "next";
import { apiGetSafe } from "@/lib/api";
import type { ArticleSummary } from "@/lib/types";
import { Container, EmptyState, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { ArticleCards } from "@/components/site/ArticleCards";

export const metadata: Metadata = {
  title: "Actualités",
  description: "Annonces et communiqués du Commissariat Général du FI-HADJ.",
};

export default async function ActualitesPage() {
  const articles = (await apiGetSafe<ArticleSummary[]>("/articles/published")) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Communiqués"
        title="Actualités du forum"
        intro="Annonces officielles, appels à candidature et informations pratiques publiées par le Commissariat Général."
      />
      <Section>
        <Container>
          {articles.length === 0 ? (
            <EmptyState
              title="Aucune actualité publiée pour l'instant"
              hint="Les communiqués du Commissariat Général paraîtront sur cette page."
            />
          ) : (
            <ArticleCards articles={articles} />
          )}
        </Container>
      </Section>
    </>
  );
}
