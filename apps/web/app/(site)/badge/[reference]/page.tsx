import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { REGISTRATION_STATUS_LABELS, REGISTRATION_TYPE_LABELS } from "@fihadj/shared-types";
import { apiGetSafe } from "@/lib/api";
import type { BadgeVerification } from "@/lib/types";
import { Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";

export const metadata: Metadata = {
  title: "Vérification de badge",
  // Une page qui expose un nom de porteur n'a rien à faire dans un index public.
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ reference: string }> };

/**
 * Cible du QR code imprimé sur le badge. Le poste de contrôle scanne, ouvre
 * cette page et voit immédiatement si le badge est valide et à qui il appartient.
 *
 * ⚠️ `revalidate: false` — un badge révoqué ne doit jamais être servi depuis un
 * cache : la réponse est calculée à chaque scan.
 */
export default async function BadgeVerificationPage({ params }: PageProps) {
  const { reference } = await params;
  const result = await apiGetSafe<BadgeVerification>(
    `/registrations/verify/${encodeURIComponent(reference)}`,
    { revalidate: false },
  );

  return (
    <>
      <PageHeader eyebrow="Contrôle d'accès" title="Vérification de badge" />
      <Section>
        <Container size="narrow">
          {!result ? (
            <div className="rounded-md border border-danger/40 bg-danger/10 p-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-danger" aria-hidden />
              <p className="mt-4 font-display text-h2">Référence inconnue</p>
              <p className="mt-2 text-body text-light-muted dark:text-dark-muted">
                Aucune inscription ne correspond à «&nbsp;{reference}&nbsp;». Vérifiez la saisie ou
                adressez la personne à l&apos;accueil.
              </p>
            </div>
          ) : (
            <div
              className={`rounded-md border p-8 text-center ${
                result.valid
                  ? "border-success/40 bg-success/10"
                  : "border-warning/40 bg-warning/10"
              }`}
            >
              {result.valid ? (
                <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
              ) : (
                <XCircle className="mx-auto h-12 w-12 text-warning" aria-hidden />
              )}
              <p className="mt-4 font-display text-h1">
                {result.valid ? "Badge valide" : "Badge non valide"}
              </p>
              <p className="mt-1 text-body text-light-muted dark:text-dark-muted">
                Inscription {REGISTRATION_STATUS_LABELS[result.status as never]}
              </p>

              <dl className="mx-auto mt-8 max-w-sm space-y-3 text-left">
                <Row label="Référence" value={result.reference} mono />
                <Row label="Porteur" value={result.holder} />
                {result.organization && <Row label="Organisation" value={result.organization} />}
                <Row label="Qualité" value={REGISTRATION_TYPE_LABELS[result.type as never]} />
                <Row label="Édition" value={result.edition.title} />
              </dl>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-light-border pb-2 dark:border-dark-border">
      <dt className="text-caption text-light-muted dark:text-dark-muted">{label}</dt>
      <dd className={`text-body font-medium ${mono ? "font-mono tracking-wider" : ""}`}>{value}</dd>
    </div>
  );
}
