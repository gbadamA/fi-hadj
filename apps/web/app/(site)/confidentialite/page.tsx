import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGetSafe } from "@/lib/api";
import type { SiteContentBlock } from "@/lib/types";
import { Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { RichText } from "@/components/site/RichText";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false, follow: true },
};

export default async function ConfidentialitePage() {
  const block = await apiGetSafe<SiteContentBlock>("/site-content/confidentialite");
  if (!block) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Protection des données"
        title={block.title}
        intro="Les formulaires du site collectent des données personnelles. Voici lesquelles, pourquoi, pour combien de temps, et comment les faire supprimer."
      />
      <Section>
        <Container size="narrow">
          <RichText
            body={block.body}
            className="text-body text-light-muted dark:text-dark-muted"
          />
        </Container>
      </Section>
    </>
  );
}
