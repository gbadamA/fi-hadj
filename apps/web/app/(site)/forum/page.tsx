import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import type { HomeBundle } from "@/lib/types";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import {
  CtaBand,
  ImpactTable,
  ObjectivesSection,
  PromotersSection,
  SubThemesSection,
  TargetCategoriesSection,
} from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Le forum",
  description:
    "Contexte, objectifs, résultats attendus, thème et sous-thèmes du Forum International du Hadj.",
};

export default async function ForumPage() {
  const home = await apiGet<HomeBundle>("/home");

  return (
    <>
      <PageHeader
        eyebrow="Le dossier du forum"
        title="Pourquoi un Forum International du Hadj"
        intro="Le protocole et l'étiquette ne sont pas des ornements : ce sont les conditions pratiques d'un pèlerinage sûr, digne et bien organisé."
      />

      {home.contexte && (
        <Section id="contexte">
          <Container size="narrow">
            <SectionHeading eyebrow="Contexte et justification" title={home.contexte.title} />
            <div className="space-y-4 text-body leading-relaxed text-light-muted dark:text-dark-muted">
              {home.contexte.body.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <ObjectivesSection
        objectives={home.objectives}
        expectedResults={home.expectedResults}
      />

      {home.theme && (
        <SubThemesSection themeTitle={home.theme.title} subThemes={home.theme.subThemes} />
      )}

      <TargetCategoriesSection categories={home.targetCategories} />

      {home.impactProjections.length > 0 && (
        <Section id="impact">
          <Container>
            <SectionHeading
              eyebrow="Chiffres clés"
              title="Impact attendu, édition après édition"
              intro="Fréquentation sur place et en ligne, personnes formées, emplois directs et indirects."
            />
            <ImpactTable projections={home.impactProjections} />
          </Container>
        </Section>
      )}

      <PromotersSection promoters={home.promoters} />

      <CtaBand edition={home.edition} />
    </>
  );
}
