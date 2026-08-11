import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import type { Edition, OrgChartMember } from "@fihadj/shared-types";
import { apiGet } from "@/lib/api";
import { Card, Container, EmptyState, Section, SectionHeading } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { CtaBand } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Organisation",
  description:
    "Le Commissariat Général du FI-HADJ et ses responsables de commission : logistique, " +
    "communication, partenariats, expositions, panels, événementiel, finances, RH, informatique.",
};

export default async function OrganigrammePage() {
  const [edition, members] = await Promise.all([
    apiGet<Edition>("/editions/current"),
    apiGet<OrgChartMember[]>("/org-chart"),
  ]);

  // Les trois premiers postes forment la direction ; les suivants sont les
  // commissions. Le tri de l'API porte déjà cette hiérarchie via `order`.
  const direction = members.slice(0, 3);
  const commissions = members.slice(3);

  return (
    <>
      <PageHeader
        eyebrow="Commissariat Général"
        title="Qui organise le forum"
        intro="Le FI-HADJ est piloté par un Commissariat Général assisté de deux adjoints et de responsables de commission, chacun titulaire d'un périmètre propre."
      />

      {members.length === 0 ? (
        <Section>
          <Container>
            <EmptyState title="Organigramme non encore publié" />
          </Container>
        </Section>
      ) : (
        <>
          <Section>
            <Container>
              <SectionHeading eyebrow="Direction" title="Le Commissariat Général" />
              <ul className="grid gap-6 md:grid-cols-3">
                {direction.map((member) => (
                  <Card as="li" key={member.id} className="border-t-4 border-t-secondary">
                    <p className="font-display text-h3 leading-snug">{member.position}</p>
                    {member.holderName && (
                      <p className="mt-1 text-caption font-medium text-primary">
                        {member.holderName}
                      </p>
                    )}
                    <MissionList missions={member.missions} />
                  </Card>
                ))}
              </ul>
            </Container>
          </Section>

          <Section tone="alt">
            <Container>
              <SectionHeading
                eyebrow="Commissions"
                title={`${commissions.length} responsables de commission`}
                intro="Chaque responsable dispose, dans le système de gestion du forum, d'un accès limité aux modules qui relèvent de sa fonction."
              />
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {commissions.map((member) => (
                  <Card as="li" key={member.id}>
                    <p className="font-display text-h3 leading-snug">{member.position}</p>
                    {member.holderName && (
                      <p className="mt-1 text-caption font-medium text-primary">
                        {member.holderName}
                      </p>
                    )}
                    <MissionList missions={member.missions} />
                  </Card>
                ))}
              </ul>
            </Container>
          </Section>
        </>
      )}

      <CtaBand edition={edition} />
    </>
  );
}

function MissionList({ missions }: { missions: string[] }) {
  if (missions.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {missions.map((mission) => (
        <li key={mission} className="flex gap-2 text-caption text-light-muted dark:text-dark-muted">
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
          {mission}
        </li>
      ))}
    </ul>
  );
}
