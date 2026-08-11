"use client";

import { CalendarRange, TriangleAlert } from "lucide-react";
import { formatDateRange } from "@fihadj/shared-types";
import { useEdition } from "@/lib/edition";

/** Menu déroulant du menu latéral : sur quelle édition travaille-t-on ? */
export function EditionSwitcher() {
  const { editions, editionId, setEditionId, loading } = useEdition();

  if (loading || editions.length === 0) return null;

  return (
    <div className="mb-6">
      <label
        htmlFor="admin-edition"
        className="mb-1.5 flex items-center gap-1.5 text-caption font-medium uppercase tracking-wider text-light-muted dark:text-dark-muted"
      >
        <CalendarRange className="h-3.5 w-3.5" aria-hidden />
        Édition de travail
      </label>
      <select
        id="admin-edition"
        value={editionId ?? ""}
        onChange={(event) => setEditionId(event.target.value)}
        className="w-full rounded-md border border-light-border bg-light-surface px-3 py-2 text-body transition focus:border-primary focus:outline-none dark:border-dark-border dark:bg-dark-surface"
      >
        {editions.map((edition) => (
          <option key={edition.id} value={edition.id}>
            {edition.year}
            {edition.isCurrent ? " — publiée" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Bandeau d'avertissement affiché dès qu'on travaille sur une édition qui n'est
 * PAS celle publiée. Sans lui, on peut modifier 2026 en croyant corriger le site
 * en ligne — ou l'inverse, ce qui est pire.
 */
export function EditionBanner() {
  const { edition, isCurrent, loading } = useEdition();
  if (loading || !edition || isCurrent) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning/40 bg-warning/10 px-5 py-3 text-caption sm:px-8 print:hidden"
    >
      <TriangleAlert className="h-4 w-4 shrink-0 text-warning" aria-hidden />
      <span className="font-medium">
        Vous travaillez sur l&apos;édition {edition.year}, qui n&apos;est pas celle publiée.
      </span>
      <span className="text-light-muted dark:text-dark-muted">
        {formatDateRange(edition.startDate, edition.endDate)} · vos modifications n&apos;apparaîtront
        sur le site public qu&apos;après bascule depuis « Éditions ».
      </span>
    </div>
  );
}
