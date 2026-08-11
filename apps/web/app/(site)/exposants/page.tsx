import type { Metadata } from "next";
import Image from "next/image";
import { Store } from "lucide-react";
import type { Edition, Sponsor } from "@fihadj/shared-types";
import { apiGet, apiGetSafe } from "@/lib/api";
import type { PublicExhibitor } from "@/lib/types";
import { Card, Container, EmptyState, Section, SectionHeading } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { CtaBand, SponsorsWall } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Exposants et partenaires",
  description:
    "Le village d'exposition du FI-HADJ réunit agences de voyage, compagnies aériennes, " +
    "institutions financières et structures caritatives.",
};

export default async function ExposantsPage() {
  const [edition, exhibitors, sponsors] = await Promise.all([
    apiGet<Edition>("/editions/current"),
    (await apiGetSafe<PublicExhibitor[]>("/exhibitors/public")) ?? [],
    (await apiGetSafe<Sponsor[]>("/sponsors")) ?? [],
  ]);

  // Regroupement par secteur : un visiteur cherche « une agence de voyage »,
  // pas « la lettre B ».
  const bySector = new Map<string, PublicExhibitor[]>();
  for (const exhibitor of exhibitors) {
    const sector = exhibitor.activitySector || "Autres";
    bySector.set(sector, [...(bySector.get(sector) ?? []), exhibitor]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Village d'exposition"
        title="Exposants et partenaires"
        intro="Plus de 50 stands attendus : opérateurs du pèlerinage, compagnies aériennes, banques et assurances islamiques, ONG et structures de bienfaisance."
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow={`${exhibitors.length} exposant${exhibitors.length > 1 ? "s" : ""} confirmé${exhibitors.length > 1 ? "s" : ""}`}
            title="Qui expose au forum"
            intro="Cette liste s'enrichit à mesure que les stands sont attribués par le Responsable Expositions."
          />
          {exhibitors.length === 0 ? (
            <EmptyState
              title="Aucun exposant confirmé pour l'instant"
              hint="Les exposants apparaissent ici dès l'attribution de leur stand."
            />
          ) : (
            <div className="space-y-10">
              {[...bySector.entries()].map(([sector, group]) => (
                <div key={sector}>
                  <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
                    {sector}
                  </p>
                  <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((exhibitor) => (
                      <Card as="li" key={exhibitor.id} className="flex items-center gap-4">
                        {exhibitor.logoUrl ? (
                          <Image
                            src={exhibitor.logoUrl}
                            alt=""
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-md object-contain"
                          />
                        ) : (
                          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary/10">
                            <Store className="h-6 w-6 text-primary" aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{exhibitor.companyName}</p>
                          {exhibitor.standNumber && (
                            <p className="text-caption text-light-muted dark:text-dark-muted">
                              Stand {exhibitor.standNumber}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {sponsors.length > 0 && (
        <Section tone="alt">
          <Container>
            <SectionHeading eyebrow="Sponsoring" title="Ils soutiennent le forum" />
            <SponsorsWall sponsors={sponsors} />
          </Container>
        </Section>
      )}

      <CtaBand edition={edition} />
    </>
  );
}
