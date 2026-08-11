import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/primitives";

const PHONES = ["+225 27 22 29 42 98", "+225 05 05 70 70 00", "+225 01 41 87 75 23"];

const SITE_LINKS = [
  { href: "/forum", label: "Le forum" },
  { href: "/programme", label: "Programme" },
  { href: "/gala", label: "Dîner-gala et distinctions" },
  { href: "/exposants", label: "Exposants et partenaires" },
  { href: "/organigramme", label: "Commissariat Général" },
  { href: "/actualites", label: "Actualités" },
];

const LEGAL_LINKS = [
  { href: "/inscription", label: "S'inscrire" },
  { href: "/contact", label: "Contact" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/admin", label: "Espace organisateurs" },
];

export function Footer() {
  return (
    <footer className="border-t border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface print:hidden">
      <div className="rule-gold" />
      <Container size="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-h2">FI-HADJ</p>
            <p className="mt-3 text-body text-light-muted dark:text-dark-muted">
              Forum International du Hadj — une initiative conjointe de SESAP et de la CDIDES,
              pour l&apos;étiquette, le protocole et la diplomatie économique au service du
              pèlerinage.
            </p>
          </div>

          <nav aria-label="Pages du site">
            <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
              Le forum
            </p>
            <ul className="mt-4 space-y-2">
              {SITE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-body text-light-muted transition hover:text-primary dark:text-dark-muted"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Informations pratiques">
            <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
              Informations
            </p>
            <ul className="mt-4 space-y-2">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-body text-light-muted transition hover:text-primary dark:text-dark-muted"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <address className="not-italic">
            <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
              Commissariat Général
            </p>
            <ul className="mt-4 space-y-3 text-body text-light-muted dark:text-dark-muted">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Palais de la Culture de Treichville
                <br />
                Abidjan, Côte d&apos;Ivoire
              </li>
              {PHONES.map((phone) => (
                <li key={phone} className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="transition hover:text-primary">
                    {phone}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <Link href="/contact" className="transition hover:text-primary">
                  Formulaire de contact
                </Link>
              </li>
            </ul>
          </address>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-light-border pt-6 text-caption text-light-muted sm:flex-row sm:items-center sm:justify-between dark:border-dark-border dark:text-dark-muted">
          <p>© {new Date().getFullYear()} FI-HADJ — SESAP &amp; CDIDES. Tous droits réservés.</p>
          <p>Abidjan · Côte d&apos;Ivoire</p>
        </div>
      </Container>
    </footer>
  );
}
