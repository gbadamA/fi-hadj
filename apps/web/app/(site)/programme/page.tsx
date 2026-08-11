import type { Metadata } from "next";
import { formatDateRange, type Edition, type ProgramItem } from "@fihadj/shared-types";
import { apiGet } from "@/lib/api";
import { Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { CtaBand, ProgramTimeline } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Programme",
  description:
    "Cérémonie d'ouverture, quatre panels, ateliers, village d'exposition et dîner-gala : " +
    "le déroulé complet des deux journées du FI-HADJ.",
};

export default async function ProgrammePage() {
  const [edition, items] = await Promise.all([
    apiGet<Edition>("/editions/current"),
    apiGet<ProgramItem[]>("/program-items"),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Deux journées"
        title="Programme du forum"
        intro={`${formatDateRange(edition.startDate, edition.endDate)} — ${edition.venue}, ${edition.city}. Horaires susceptibles d'ajustement jusqu'à l'ouverture.`}
      />
      <Section>
        <Container>
          <ProgramTimeline items={items} />
        </Container>
      </Section>
      <CtaBand edition={edition} />
    </>
  );
}
