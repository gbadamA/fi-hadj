import type { Metadata } from "next";
import { apiGet, apiGetSafe } from "@/lib/api";
import type { ArticleSummary, HomeBundle } from "@/lib/types";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { Hero, heroFigures } from "@/components/site/Hero";
import {
  CtaBand,
  ImpactTable,
  MoreLink,
  PrizesGrid,
  ProgramTimeline,
  PromotersSection,
  SponsorsWall,
  SubThemesSection,
  TargetCategoriesSection,
} from "@/components/site/sections";
import { ArticleCards } from "@/components/site/ArticleCards";

export const metadata: Metadata = {
  description:
    "Forum International du Hadj — Abidjan. Étiquette et protocole : solutions durables pour la " +
    "réussite du pèlerinage en Islam. Panels, exposition, dîner-gala et distinctions.",
};

export default async function HomePage() {
  const home = await apiGet<HomeBundle>("/home");
  // Les actualités sont accessoires : leur absence ne doit pas faire tomber
  // l'accueil, d'où la variante tolérante.
  const articles = (await apiGetSafe<ArticleSummary[]>("/articles/published?limit=3")) ?? [];

  const currentProjection = home.impactProjections.find((p) => p.year === home.edition.year);
  const firstDayItems = home.programItems.slice(0, 5);

  return (
    <>
      <Hero edition={home.edition} figures={heroFigures(currentProjection?.onSite)} />

      <PromotersSection promoters={home.promoters} />

      {home.contexte && (
        <Section id="contexte" tone="alt">
          <Container size="narrow">
            <SectionHeading eyebrow="Contexte" title={home.contexte.title} />
            <div className="space-y-4 text-body leading-relaxed text-light-muted dark:text-dark-muted">
              {home.contexte.body
                .split("\n\n")
                .slice(0, 2)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
            <MoreLink href="/forum">Lire le dossier complet du forum</MoreLink>
          </Container>
        </Section>
      )}

      {home.theme && (
        <SubThemesSection themeTitle={home.theme.title} subThemes={home.theme.subThemes} />
      )}

      {firstDayItems.length > 0 && (
        <Section id="programme">
          <Container>
            <SectionHeading
              eyebrow="Programme"
              title="Deux journées de travaux, d'exposition et de protocole"
              intro="Cérémonie d'ouverture, quatre panels, ateliers, village d'exposition et dîner-gala de clôture."
            />
            <ProgramTimeline items={firstDayItems} />
            <MoreLink href="/programme">Voir le programme complet</MoreLink>
          </Container>
        </Section>
      )}

      {home.prizes.length > 0 && (
        <Section id="distinctions" tone="alt">
          <Container>
            <SectionHeading
              eyebrow="Dîner-gala"
              title="Les distinctions du FI-HADJ"
              intro="Le dîner-gala de clôture honore les institutions, entreprises et personnalités dont l'engagement contribue à la réussite du pèlerinage."
            />
            <PrizesGrid prizes={home.prizes.slice(0, 6)} />
            <MoreLink href="/gala">Voir les {home.prizes.length} distinctions</MoreLink>
          </Container>
        </Section>
      )}

      <TargetCategoriesSection categories={home.targetCategories} />

      {home.impactProjections.length > 0 && (
        <Section id="impact">
          <Container>
            <SectionHeading
              eyebrow="Chiffres clés"
              title="Impact attendu du forum"
              intro="Projections de fréquentation, de formation et de création d'emplois pour les quatre prochaines éditions."
            />
            <ImpactTable projections={home.impactProjections} />
          </Container>
        </Section>
      )}

      {home.sponsors.length > 0 && (
        <Section id="partenaires" tone="alt">
          <Container>
            <SectionHeading
              eyebrow="Ils soutiennent le forum"
              title="Sponsors et partenaires"
            />
            <SponsorsWall sponsors={home.sponsors} />
            <MoreLink href="/exposants">Voir aussi les exposants</MoreLink>
          </Container>
        </Section>
      )}

      {articles.length > 0 && (
        <Section id="actualites">
          <Container>
            <SectionHeading eyebrow="Actualités" title="Dernières annonces du Commissariat" />
            <ArticleCards articles={articles} />
            <MoreLink href="/actualites">Toutes les actualités</MoreLink>
          </Container>
        </Section>
      )}

      <CtaBand edition={home.edition} />
    </>
  );
}
