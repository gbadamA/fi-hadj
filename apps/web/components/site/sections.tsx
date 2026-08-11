import Link from "next/link";
import { Award, Building2, CheckCircle2, Clock, MapPin, Target, Users } from "lucide-react";
import {
  PROGRAM_ITEM_TYPE_LABELS,
  SPONSOR_LEVEL_LABELS,
  canRegister,
  formatDateLong,
  formatNumber,
  isEditionPast,
  type Edition,
  type ImpactProjection,
  type ObjectiveType,
  type Prize,
  type ProgramItem,
  type ProgramItemType,
  type Promoter,
  type Sponsor,
  type SponsorLevel,
  type SubTheme,
  type TargetCategory,
} from "@fihadj/shared-types";
import { Badge, ButtonLink, Card, Container, EmptyState, Section, SectionHeading } from "@/components/ui/primitives";

/** Couleur de chaque sous-thème — clés miroir de `panelColors` des design tokens. */
const PANEL_COLORS: Record<string, string> = {
  organisation: "#0F3D6B",
  interculturalite: "#2E7CB8",
  fluxSanitaire: "#0E9F6E",
  diplomatieEconomique: "#C9A227",
};

export function panelColor(colorKey: string | null | undefined, fallbackIndex = 0): string {
  if (colorKey && PANEL_COLORS[colorKey]) return PANEL_COLORS[colorKey] as string;
  const values = Object.values(PANEL_COLORS);
  return values[fallbackIndex % values.length] as string;
}

/* ─────────────────────────── Promoteurs ─────────────────────────── */

export function PromotersSection({ promoters }: { promoters: Promoter[] }) {
  if (promoters.length === 0) return null;
  return (
    <Section id="promoteurs">
      <Container>
        <SectionHeading
          eyebrow="Les promoteurs"
          title="Deux institutions au service du protocole et de la diplomatie"
          intro="Le FI-HADJ est porté conjointement par une société spécialisée dans le cérémonial de haut niveau et par une chambre de diplomatie islamique."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {promoters.map((promoter) => (
            <Card key={promoter.id} className="flex flex-col">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-diplomatic font-display text-lg font-bold text-white">
                  {promoter.acronym.slice(0, 2)}
                </span>
                <div>
                  <p className="font-display text-h3">{promoter.acronym}</p>
                  <p className="text-caption text-light-muted dark:text-dark-muted">
                    {promoter.name}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-body text-light-muted dark:text-dark-muted">
                {promoter.description}
              </p>
              {promoter.websiteUrl && (
                <a
                  href={promoter.websiteUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 text-caption font-medium text-primary hover:underline"
                >
                  Site institutionnel ↗
                </a>
              )}
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── Thème & sous-thèmes ─────────────────────────── */

export function SubThemesSection({
  themeTitle,
  subThemes,
}: {
  themeTitle: string;
  subThemes: SubTheme[];
}) {
  if (subThemes.length === 0) return null;
  return (
    <Section id="sous-themes" tone="alt">
      <Container>
        <SectionHeading
          eyebrow="Thème de l'édition"
          title={themeTitle}
          intro="Le thème général se décline en quatre panels, chacun confié à des intervenants du secteur public, du secteur privé et du monde religieux."
        />
        <ol className="grid gap-6 md:grid-cols-2">
          {subThemes.map((subTheme, index) => {
            const color = panelColor(subTheme.colorKey, index);
            return (
              <Card as="li" key={subTheme.id} className="relative overflow-hidden pl-8">
                {/* Liseré de couleur : identifie le panel d'un coup d'œil, ici
                    comme dans le programme et le back-office. */}
                <span
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-display text-3xl font-bold leading-none"
                    style={{ color }}
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-display text-h3 leading-snug">{subTheme.title}</h3>
                </div>
                {subTheme.description && (
                  <p className="mt-4 text-body text-light-muted dark:text-dark-muted">
                    {subTheme.description}
                  </p>
                )}
              </Card>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── Objectifs & résultats ─────────────────────────── */

export function ObjectivesSection({
  objectives,
  expectedResults,
}: {
  objectives: { id: string; type: ObjectiveType; text: string }[];
  expectedResults: { id: string; text: string }[];
}) {
  const general = objectives.filter((o) => o.type === "GENERAL");
  const specific = objectives.filter((o) => o.type === "SPECIFIQUE");
  if (objectives.length === 0 && expectedResults.length === 0) return null;

  return (
    <Section id="objectifs">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Objectifs" title="Ce que le forum cherche à produire" />
            {general.map((objective) => (
              <blockquote
                key={objective.id}
                className="mb-8 border-l-4 border-secondary bg-secondary/5 py-4 pl-5 pr-4"
              >
                <p className="font-display text-[1.1rem] leading-relaxed">{objective.text}</p>
                <cite className="mt-2 block text-caption not-italic text-light-muted dark:text-dark-muted">
                  Objectif général
                </cite>
              </blockquote>
            ))}
            <ul className="space-y-3">
              {specific.map((objective) => (
                <li key={objective.id} className="flex gap-3">
                  <Target className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-body text-light-muted dark:text-dark-muted">
                    {objective.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading eyebrow="Résultats attendus" title="À quoi on mesurera la réussite" />
            <ul className="space-y-4">
              {expectedResults.map((result) => (
                <li
                  key={result.id}
                  className="lift flex gap-3 rounded-md border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-surface"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                  <span className="text-body">{result.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── Programme ─────────────────────────── */

const TYPE_TONE: Record<ProgramItemType, string> = {
  CEREMONIE: "#0F3D6B",
  PANEL: "#2E7CB8",
  ATELIER: "#0E9F6E",
  EXPOSITION: "#7C3AED",
  GALA: "#C9A227",
  PAUSE: "#5A6B7D",
};

export function ProgramTimeline({ items }: { items: ProgramItem[] }) {
  if (items.length === 0) {
    return <EmptyState title="Programme en cours de finalisation" hint="Il sera publié ici dès sa validation par le Commissariat Général." />;
  }

  // Regroupement par journée : le forum tient sur deux jours, chacun mérite son
  // propre en-tête daté plutôt qu'une liste continue de 13 créneaux.
  const days = new Map<string, ProgramItem[]>();
  for (const item of items) {
    const key = String(item.day).slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), item]);
  }

  return (
    <div className="space-y-12">
      {[...days.entries()].map(([day, dayItems], dayIndex) => (
        <div key={day}>
          <h3 className="flex items-center gap-3 font-display text-h2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-caption font-bold text-white">
              J{dayIndex + 1}
            </span>
            {formatDateLong(day)}
          </h3>

          <ol className="mt-6 border-l border-light-border pl-6 dark:border-dark-border">
            {dayItems.map((item) => {
              const tone = TYPE_TONE[item.type as ProgramItemType];
              return (
                <li key={item.id} className="relative pb-8 last:pb-0">
                  <span
                    className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-light-bg dark:ring-dark-bg"
                    style={{ backgroundColor: tone }}
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold tabular-nums text-primary">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {item.startTime} – {item.endTime}
                    </span>
                    <Badge color={tone}>{PROGRAM_ITEM_TYPE_LABELS[item.type as ProgramItemType]}</Badge>
                  </div>
                  <h4 className="mt-2 font-display text-h3 leading-snug">{item.title}</h4>
                  {item.description && (
                    <p className="mt-2 max-w-2xl text-body text-light-muted dark:text-dark-muted">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-caption text-light-muted dark:text-dark-muted">
                    {item.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {item.location}
                      </span>
                    )}
                    {item.speakers.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {item.speakers.join(" · ")}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Distinctions du gala ─────────────────────────── */

export function PrizesGrid({ prizes }: { prizes: Prize[] }) {
  if (prizes.length === 0) {
    return <EmptyState title="Distinctions non encore publiées" />;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {prizes.map((prize) => (
        <li
          key={prize.id}
          className="lift rounded-md border border-secondary/35 bg-light-surface p-5 dark:bg-dark-surface"
        >
          <Award className="h-5 w-5 text-secondary" aria-hidden />
          <p className="mt-3 font-display text-h3 leading-snug">{prize.name}</p>
          {prize.description && (
            <p className="mt-1 text-caption text-light-muted dark:text-dark-muted">
              {prize.description}
            </p>
          )}
          {prize.laureate && (
            <p className="mt-3 text-caption">
              <span className="text-light-muted dark:text-dark-muted">Lauréat · </span>
              <span className="font-medium">{prize.laureate}</span>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────── Cibles ─────────────────────────── */

export function TargetCategoriesSection({ categories }: { categories: TargetCategory[] }) {
  if (categories.length === 0) return null;
  return (
    <Section id="cibles" tone="alt">
      <Container>
        <SectionHeading
          eyebrow="À qui s'adresse le forum"
          title={`${categories.length} catégories de participants`}
          intro="Du pèlerin à l'ambassade, du tour-opérateur au chercheur : le FI-HADJ réunit tous ceux dont l'action conditionne la réussite du pèlerinage."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card as="li" key={category.id}>
              <p className="font-display text-h3 leading-snug">{category.name}</p>
              {category.description && (
                <p className="mt-2 text-caption text-light-muted dark:text-dark-muted">
                  {category.description}
                </p>
              )}
              {category.subCategories.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {category.subCategories.map((sub) => (
                    <li
                      key={sub}
                      className="rounded-full bg-light-surface-alt px-2.5 py-1 text-[11px] text-light-muted dark:bg-dark-surface-alt dark:text-dark-muted"
                    >
                      {sub}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ─────────────────────────── Impact ─────────────────────────── */

export function ImpactTable({ projections }: { projections: ImpactProjection[] }) {
  if (projections.length === 0) return null;
  const columns: [keyof ImpactProjection, string][] = [
    ["onSite", "Sur place"],
    ["online", "En ligne"],
    ["trained", "Personnes formées"],
    ["directJobs", "Emplois directs"],
    ["indirectJobs", "Emplois indirects"],
  ];

  return (
    <div className="overflow-x-auto scroll-slim rounded-md border border-light-border dark:border-dark-border">
      <table className="w-full min-w-[640px] border-collapse text-body">
        <caption className="sr-only">
          Projections d&apos;impact du FI-HADJ de {projections[0]?.year} à{" "}
          {projections[projections.length - 1]?.year}
        </caption>
        <thead>
          <tr className="bg-diplomatic-deep text-left text-white">
            <th scope="col" className="px-4 py-3 font-medium">
              Année
            </th>
            {columns.map(([key, label]) => (
              <th key={String(key)} scope="col" className="px-4 py-3 text-right font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projections.map((projection, index) => (
            <tr
              key={projection.id}
              className={
                index % 2 === 1
                  ? "bg-light-surface-alt dark:bg-dark-surface-alt"
                  : "bg-light-surface dark:bg-dark-surface"
              }
            >
              <th scope="row" className="px-4 py-3 text-left font-display font-bold text-primary">
                {projection.year}
              </th>
              {columns.map(([key]) => (
                <td key={String(key)} className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(projection[key] as number)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────── Sponsors ─────────────────────────── */

export function SponsorsWall({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null;

  const byLevel = new Map<SponsorLevel, Sponsor[]>();
  for (const sponsor of sponsors) {
    const level = sponsor.level as SponsorLevel;
    byLevel.set(level, [...(byLevel.get(level) ?? []), sponsor]);
  }

  return (
    <div className="space-y-8">
      {[...byLevel.entries()].map(([level, group]) => (
        <div key={level}>
          <p className="text-caption font-semibold uppercase tracking-widest text-secondary">
            {SPONSOR_LEVEL_LABELS[level]}
          </p>
          <ul className="mt-4 flex flex-wrap gap-4">
            {group.map((sponsor) => {
              const content = (
                <>
                  <Building2 className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-medium">{sponsor.name}</span>
                </>
              );
              return (
                <li key={sponsor.id}>
                  {sponsor.websiteUrl ? (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="lift inline-flex items-center gap-2.5 rounded-md border border-light-border bg-light-surface px-5 py-3 dark:border-dark-border dark:bg-dark-surface"
                    >
                      {content}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2.5 rounded-md border border-light-border bg-light-surface px-5 py-3 dark:border-dark-border dark:bg-dark-surface">
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Appel à l'action ─────────────────────────── */

export function CtaBand({ edition }: { edition: Edition }) {
  // Même règle que le hero et la page d'inscription : l'édition doit avoir ses
  // inscriptions ouvertes ET ne pas être passée. Le bandeau invitait auparavant
  // à s'inscrire sur la seule foi de l'interrupteur, si bien qu'en republiant
  // l'édition 2025 la page annonçait « clôturée » en haut et « inscrivez-vous » en bas.
  const open = canRegister(edition);
  const past = isEditionPast(edition);

  return (
    <section className="relative overflow-hidden bg-diplomatic-deep">
      <div className="pattern-islamic absolute inset-0" aria-hidden />
      <Container className="relative py-16 text-center">
        <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.2rem)] font-bold text-white">
          {past
            ? `Le forum ${edition.year} s'est tenu`
            : "Prenez place au Forum International du Hadj"}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-body text-white/80">
          {past
            ? "Le programme, les panels et les distinctions de cette édition restent consultables. La prochaine édition sera annoncée sur cette page."
            : "Participant, exposant ou partenaire : trois parcours d'inscription, une seule adresse. Votre badge vous parvient par email dès la validation de votre demande."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {open && (
            <ButtonLink href="/inscription" size="lg" variant="secondary">
              Déposer une demande d&apos;inscription
            </ButtonLink>
          )}
          {!open && !past && (
            <span className="rounded-full border border-white/30 px-5 py-3 text-body text-white/80">
              Les inscriptions ne sont pas encore ouvertes.
            </span>
          )}
          {past && (
            <ButtonLink href="/programme" size="lg" variant="secondary">
              Revoir le programme
            </ButtonLink>
          )}
          <ButtonLink
            href="/contact"
            size="lg"
            variant="ghost"
            className="border-white/40 text-white hover:border-secondary hover:text-secondary"
          >
            Contacter le Commissariat
          </ButtonLink>
        </div>
      </Container>
      <div className="rule-gold" />
    </section>
  );
}

/* ─────────────────────────── Aperçu → page dédiée ─────────────────────────── */

export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-8 inline-flex items-center gap-2 text-body font-medium text-primary hover:underline"
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}
