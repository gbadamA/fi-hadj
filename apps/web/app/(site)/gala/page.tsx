import type { Metadata } from "next";
import { Sparkles, Utensils, Users } from "lucide-react";
import type { Edition, Prize } from "@fihadj/shared-types";
import { apiGet } from "@/lib/api";
import { Card, Container, Section, SectionHeading } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { CtaBand, PrizesGrid } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Dîner-gala et distinctions",
  description:
    "Le dîner-gala de clôture du FI-HADJ honore les institutions, compagnies et personnalités " +
    "qui contribuent à la réussite du pèlerinage.",
};

const HIGHLIGHTS = [
  { Icon: Users, title: "300 invités", text: "Corps diplomatique, autorités religieuses, dirigeants d'entreprise et partenaires du forum." },
  { Icon: Utensils, title: "Soirée de clôture", text: "Le gala referme la seconde journée, après la lecture des recommandations issues des panels." },
  { Icon: Sparkles, title: "Remise des distinctions", text: "Chaque distinction salue une contribution concrète à l'organisation ou à l'accompagnement du pèlerinage." },
];

export default async function GalaPage() {
  const [edition, prizes] = await Promise.all([
    apiGet<Edition>("/editions/current"),
    apiGet<Prize[]>("/prizes"),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Soirée de clôture"
        title="Dîner-gala et distinctions"
        intro="Point d'orgue du forum, le dîner-gala réunit les acteurs du pèlerinage autour de la reconnaissance publique de ceux qui le rendent possible."
      />

      <Section>
        <Container>
          <ul className="grid gap-6 md:grid-cols-3">
            {HIGHLIGHTS.map(({ Icon, title, text }) => (
              <Card as="li" key={title}>
                <Icon className="h-6 w-6 text-secondary" aria-hidden />
                <p className="mt-4 font-display text-h3">{title}</p>
                <p className="mt-2 text-body text-light-muted dark:text-dark-muted">{text}</p>
              </Card>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="alt">
        <Container>
          <SectionHeading
            eyebrow={`${prizes.length} distinctions`}
            title="Les récipiendaires"
            intro="Liste des institutions, compagnies et personnalités distinguées lors du dîner-gala. Les intitulés définitifs de chaque prix sont arrêtés par le Commissariat Général."
          />
          <PrizesGrid prizes={prizes} />
        </Container>
      </Section>

      <CtaBand edition={edition} />
    </>
  );
}
