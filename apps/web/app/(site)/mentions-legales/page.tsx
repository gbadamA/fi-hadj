import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGetSafe } from "@/lib/api";
import type { SiteContentBlock } from "@/lib/types";
import { Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { RichText } from "@/components/site/RichText";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: true },
};

export default async function MentionsLegalesPage() {
  const block = await apiGetSafe<SiteContentBlock>("/site-content/mentions-legales");
  if (!block) notFound();

  return (
    <>
      <PageHeader eyebrow="Informations légales" title={block.title} />
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
