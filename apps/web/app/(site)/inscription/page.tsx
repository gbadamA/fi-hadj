import type { Metadata } from "next";
import { BadgeCheck, Mail, ShieldCheck } from "lucide-react";
import {
  canRegister,
  formatDateRange,
  type Edition,
  type TargetCategory,
} from "@fihadj/shared-types";
import { apiGet } from "@/lib/api";
import { Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { RegistrationForm } from "@/components/site/RegistrationForm";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Inscrivez-vous au Forum International du Hadj comme participant, exposant ou sponsor. " +
    "Badge envoyé par email après validation.",
};

const STEPS = [
  {
    Icon: Mail,
    title: "1. Vous déposez votre demande",
    text: "Un accusé de réception vous parvient immédiatement, avec votre référence d'inscription.",
  },
  {
    Icon: ShieldCheck,
    title: "2. Le Commissariat examine",
    text: "Chaque demande est étudiée par le responsable concerné selon votre qualité.",
  },
  {
    Icon: BadgeCheck,
    title: "3. Vous recevez votre badge",
    text: "Un badge PDF avec QR code, à imprimer ou à présenter sur téléphone à l'entrée.",
  },
];

export default async function InscriptionPage() {
  const [edition, categories] = await Promise.all([
    apiGet<Edition>("/editions/current"),
    apiGet<TargetCategory[]>("/target-categories"),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Inscription"
        title="Prendre part au FI-HADJ"
        intro={`${formatDateRange(edition.startDate, edition.endDate)} — ${edition.venue}, ${edition.city}.`}
      />

      <Section>
        <Container>
          <ol className="mb-14 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ Icon, title, text }) => (
              <li
                key={title}
                className="rounded-md border-l-4 border-secondary bg-light-surface-alt p-5 dark:bg-dark-surface-alt"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-3 font-medium">{title}</p>
                <p className="mt-1 text-caption text-light-muted dark:text-dark-muted">{text}</p>
              </li>
            ))}
          </ol>

          <RegistrationForm
            categories={categories}
            registrationOpen={canRegister(edition)}
          />
        </Container>
      </Section>
    </>
  );
}
