import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";
import { apiGetSafe } from "@/lib/api";
import type { SiteContentBlock } from "@/lib/types";
import { Card, Container, Section } from "@/components/ui/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter le Commissariat Général du Forum International du Hadj, à Abidjan.",
};

const PHONES = ["+225 27 22 29 42 98", "+225 05 05 70 70 00", "+225 01 41 87 75 23"];

export default async function ContactPage() {
  // Les coordonnées viennent du back-office (bloc « contact »), pas d'une
  // constante : le secrétariat doit pouvoir corriger un numéro sans déploiement.
  const block = await apiGetSafe<SiteContentBlock>("/site-content/contact");

  return (
    <>
      <PageHeader
        eyebrow="Nous écrire"
        title="Contacter le Commissariat Général"
        intro="Une question sur l'inscription, l'exposition, le partenariat ou l'accréditation presse ? Le secrétariat vous répond."
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
            <div>
              <h2 className="mb-6 font-display text-h2">Formulaire de contact</h2>
              <ContactForm />
            </div>

            <aside className="space-y-5">
              <Card>
                <h2 className="font-display text-h3">Coordonnées</h2>
                <ul className="mt-4 space-y-3 text-body text-light-muted dark:text-dark-muted">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      Palais de la Culture de Treichville
                      <br />
                      Abidjan, Côte d&apos;Ivoire
                    </span>
                  </li>
                  {PHONES.map((phone) => (
                    <li key={phone} className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-primary">
                        {phone}
                      </a>
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Du lundi au vendredi, de 8h à 17h (GMT)
                  </li>
                </ul>
              </Card>

              {block && (
                <Card>
                  <h2 className="font-display text-h3">{block.title}</h2>
                  <div className="mt-3 space-y-2 whitespace-pre-line text-caption text-light-muted dark:text-dark-muted">
                    {block.body}
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
