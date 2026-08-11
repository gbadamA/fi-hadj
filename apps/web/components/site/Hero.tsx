import { CalendarDays, MapPin } from "lucide-react";
import {
  canRegister,
  formatDateRange,
  formatNumber,
  isEditionPast,
  type Edition,
} from "@fihadj/shared-types";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { Countdown } from "./Countdown";

/**
 * Bannière d'ouverture. Le dégradé signature couvre toute la surface, la trame
 * géométrique l'anime discrètement et un filet doré ferme le bloc — la grammaire
 * de la DA, appliquée une fois pour toutes ici.
 */
export function Hero({
  edition,
  figures,
}: {
  edition: Edition;
  figures: { value: string; label: string }[];
}) {
  const past = isEditionPast(edition);

  return (
    <section className="relative overflow-hidden bg-diplomatic">
      <div className="pattern-islamic absolute inset-0" aria-hidden />
      {/* Voile sombre en bas : garantit le contraste du texte quel que soit
          l'endroit où le dégradé vire vers l'or. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#08203A]/70 via-transparent to-transparent"
        aria-hidden
      />

      <Container size="wide" className="relative py-20 sm:py-28">
        <p className="flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.2em] text-secondary">
          <span className="h-px w-10 bg-secondary" aria-hidden />
          {edition.year} · {edition.title.replace(/^FI-HADJ \d+ — /, "")}
        </p>

        <h1 className="mt-6 max-w-4xl font-display text-[clamp(2rem,5.6vw,3.6rem)] font-bold leading-[1.1] text-white">
          Forum International du Hadj
        </h1>

        <p className="mt-5 max-w-3xl text-[clamp(1rem,2vw,1.3rem)] leading-relaxed text-white/85">
          {edition.theme}
        </p>

        {edition.heroSubtitle && (
          <p className="mt-4 max-w-2xl text-body text-white/70">{edition.heroSubtitle}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 text-body text-white/90">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur">
            <CalendarDays className="h-4 w-4 text-secondary" aria-hidden />
            {formatDateRange(edition.startDate, edition.endDate)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur">
            <MapPin className="h-4 w-4 text-secondary" aria-hidden />
            {edition.venue}, {edition.city}
          </span>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {canRegister(edition) && (
            <ButtonLink href="/inscription" size="lg" variant="secondary">
              S&apos;inscrire au forum
            </ButtonLink>
          )}
          <ButtonLink
            href="/programme"
            size="lg"
            variant="ghost"
            className="border-white/40 text-white hover:border-secondary hover:text-secondary"
          >
            Découvrir le programme
          </ButtonLink>
        </div>

        {/* Le compte à rebours ne s'affiche que si la date est à venir ; sur une
            édition écoulée on annonce le fait plutôt qu'un « J-0 » figé. */}
        <div className="mt-10">
          {past ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-secondary/50 bg-secondary/10 px-4 py-2 text-caption text-secondary">
              Édition {edition.year} clôturée — les actes et distinctions restent consultables.
            </p>
          ) : (
            <Countdown startDate={edition.startDate} />
          )}
        </div>

        {figures.length > 0 && (
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/15 bg-white/10 sm:grid-cols-4">
            {/* `dt` avant `dd` comme l'exige la spécification, mais affiché sous
                le chiffre grâce à `flex-col-reverse` : pas de libellé dupliqué en
                `sr-only`, que les lecteurs d'écran énonceraient deux fois. */}
            {figures.map((figure) => (
              <div
                key={figure.label}
                className="flex flex-col-reverse bg-[#0B2A4A]/40 px-5 py-6 backdrop-blur"
              >
                <dt className="mt-1 text-caption uppercase tracking-wider text-white/70">
                  {figure.label}
                </dt>
                <dd className="font-display text-3xl font-bold text-secondary">{figure.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Container>

      <div className="rule-gold" />
    </section>
  );
}

/** Chiffres clés de la 1ʳᵉ édition, tels qu'annoncés dans le cahier §4. */
export function heroFigures(projectionOnSite?: number): { value: string; label: string }[] {
  return [
    { value: "50+", label: "exposants" },
    {
      value: projectionOnSite ? `${formatNumber(projectionOnSite)}` : "5 000",
      label: "visiteurs attendus",
    },
    { value: "3 000", label: "participants aux cérémonies" },
    { value: "300", label: "invités au dîner-gala" },
  ];
}
