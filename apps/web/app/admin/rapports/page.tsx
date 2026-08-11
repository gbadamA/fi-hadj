"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TYPE_LABELS,
  SPONSOR_LEVEL_LABELS,
  formatDateRange,
  formatMoney,
  formatNumber,
  type DashboardStats,
  type Edition,
} from "@fihadj/shared-types";
import { downloadFromApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Button } from "@/components/ui/primitives";
import { AdminHeader, AdminPage, ErrorBanner, Panel, Spinner } from "@/components/admin/shell";

const EXPORTS = [
  { module: "inscriptions", path: "/registrations/export", file: "inscriptions.csv", label: "Inscriptions", hint: "Toutes les demandes avec statut, paiement et catégorie." },
  { module: "exposants", path: "/exhibitors/export", file: "exposants.csv", label: "Exposants et stands", hint: "Emplacements, montants facturés et encaissés." },
  { module: "budget", path: "/budget/export", file: "budget.csv", label: "Budget", hint: "Recettes et dépenses ligne à ligne." },
] as const;

export default function RapportsPage() {
  const { edition, withEdition } = useEdition();
  const stats = useEditionResource<DashboardStats>("/stats/dashboard");
  const { can } = useAuth();
  const [printing, setPrinting] = useState(false);

  function print() {
    setPrinting(true);
    // Laisser React peindre l'état « impression » avant d'ouvrir la boîte de
    // dialogue, sinon la page imprimée ne reflète pas ce qu'on voit à l'écran.
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Rapports et exports"
        subtitle="Fichiers destinés à Excel (séparateur « ; », UTF-8) et bilan imprimable de l'édition."
        actions={
          <Button size="sm" variant="ghost" onClick={print} disabled={printing}>
            <Printer className="h-4 w-4" aria-hidden /> Imprimer le bilan
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3 print:hidden">
        {EXPORTS.filter((entry) => can(entry.module)).map((entry) => (
          <Panel key={entry.path} title={entry.label}>
            <p className="mb-4 text-caption text-light-muted dark:text-dark-muted">{entry.hint}</p>
            <Button size="sm" onClick={() => void downloadFromApi(withEdition(entry.path), entry.file)}>
              <Download className="h-4 w-4" aria-hidden /> Télécharger
            </Button>
          </Panel>
        ))}
        {EXPORTS.filter((entry) => can(entry.module)).length === 0 && (
          <Panel>
            <p className="flex items-center gap-2 text-caption text-light-muted dark:text-dark-muted">
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Votre rôle ne donne accès à aucun export.
            </p>
          </Panel>
        )}
      </div>

      {stats.loading && <Spinner />}
      {stats.error && <ErrorBanner message={stats.error} />}

      {stats.data && (
        <article className="rounded-md border border-light-border bg-light-surface p-8 dark:border-dark-border dark:bg-dark-surface print:border-0 print:p-0">
          <header className="border-b border-light-border pb-6 dark:border-dark-border">
            <p className="text-caption uppercase tracking-widest text-secondary">
              Bilan d&apos;édition
            </p>
            <h2 className="mt-2 font-display text-h1">
              {stats.data.edition?.title ?? "FI-HADJ"}
            </h2>
            {edition && (
              <p className="mt-1 text-body text-light-muted dark:text-dark-muted">
                {formatDateRange(edition.startDate, edition.endDate)} — {edition.venue}, {edition.city}
              </p>
            )}
          </header>

          <Block title="Participation">
            <Line label="Inscriptions enregistrées" value={formatNumber(stats.data.registrations.total)} />
            {stats.data.registrations.byType.map((row) => (
              <Line
                key={row.type}
                label={REGISTRATION_TYPE_LABELS[row.type]}
                value={formatNumber(row.count)}
                indent
              />
            ))}
            {stats.data.registrations.byStatus.map((row) => (
              <Line
                key={row.status}
                label={REGISTRATION_STATUS_LABELS[row.status]}
                value={formatNumber(row.count)}
                indent
              />
            ))}
          </Block>

          <Block title="Exposition">
            <Line label="Fiches exposants" value={formatNumber(stats.data.stands.total)} />
            <Line label="Stands attribués" value={formatNumber(stats.data.stands.assigned)} indent />
            <Line label="Stands réglés" value={formatNumber(stats.data.stands.paid)} indent />
            <Line label="Taux de remplissage" value={`${stats.data.stands.fillRate} %`} indent />
          </Block>

          {can("budget") && (
            <Block title="Budget">
              <Line label="Recettes" value={formatMoney(stats.data.budget.totalIncome, stats.data.budget.currency)} />
              <Line label="Dépenses" value={formatMoney(stats.data.budget.totalExpense, stats.data.budget.currency)} />
              <Line
                label="Solde"
                value={formatMoney(stats.data.budget.balance, stats.data.budget.currency)}
                strong
              />
            </Block>
          )}

          <Block title="Partenariats">
            <Line label="Sponsors" value={formatNumber(stats.data.sponsors.total)} />
            {stats.data.sponsors.byLevel.map((row) => (
              <Line
                key={row.level}
                label={SPONSOR_LEVEL_LABELS[row.level]}
                value={formatNumber(row.count)}
                indent
              />
            ))}
          </Block>

          {stats.data.impact && (
            <Block title="Comparaison à l'objectif d'impact">
              <Line
                label={`Objectif de visiteurs sur place (${stats.data.impact.year})`}
                value={formatNumber(stats.data.impact.targetOnSite)}
              />
              <Line
                label="Inscriptions enregistrées"
                value={formatNumber(stats.data.impact.actualRegistrations)}
              />
              <Line
                label="Taux d'atteinte"
                value={`${Math.round((stats.data.impact.actualRegistrations / stats.data.impact.targetOnSite) * 100)} %`}
                strong
              />
            </Block>
          )}

          <footer className="mt-8 border-t border-light-border pt-4 text-caption text-light-muted dark:border-dark-border dark:text-dark-muted">
            Bilan établi le {new Date().toLocaleDateString("fr-FR")} — Commissariat Général du
            FI-HADJ, SESAP &amp; CDIDES.
          </footer>
        </article>
      )}
    </AdminPage>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h3 className="mb-3 font-display text-h3 text-primary">{title}</h3>
      <dl className="space-y-1">{children}</dl>
    </section>
  );
}

function Line({
  label,
  value,
  indent,
  strong,
}: {
  label: string;
  value: string;
  indent?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-dotted border-light-border py-1.5 dark:border-dark-border ${
        indent ? "pl-5" : ""
      }`}
    >
      <dt className={indent ? "text-caption text-light-muted dark:text-dark-muted" : "text-body"}>
        {label}
      </dt>
      <dd className={`tabular-nums ${strong ? "font-display text-h3 font-bold" : "font-medium"}`}>
        {value}
      </dd>
    </div>
  );
}
