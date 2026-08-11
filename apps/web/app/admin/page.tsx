"use client";

import Link from "next/link";
import {
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TYPE_LABELS,
  SPONSOR_LEVEL_LABELS,
  formatMoney,
  formatNumber,
  type DashboardStats,
} from "@fihadj/shared-types";
import { useAuth } from "@/lib/auth";
import { useEditionResource } from "@/lib/edition";
import { AdminHeader, AdminPage, ErrorBanner, Panel, Spinner, StatCard } from "@/components/admin/shell";
import { BarList, CumulativeChart, Gauge } from "@/components/admin/charts";

const TYPE_COLORS: Record<string, string> = {
  PARTICIPANT: "#2E7CB8",
  EXPOSANT: "#0E9F6E",
  SPONSOR: "#C9A227",
};

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: "#F59E0B",
  VALIDE: "#12B76A",
  REJETE: "#DC2626",
};

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, loading, error } = useEditionResource<DashboardStats>("/stats/dashboard");

  if (loading) return <Spinner />;
  if (error)
    return (
      <AdminPage>
        <ErrorBanner message={error} />
      </AdminPage>
    );
  if (!data) return null;

  const pending =
    data.registrations.byStatus.find((row) => row.status === "EN_ATTENTE")?.count ?? 0;

  return (
    <AdminPage>
      <AdminHeader
        // Nom complet plutôt que le prénom : plusieurs comptes portent un
        // intitulé de fonction (« Responsable Financier »), dont le premier mot
        // seul ne veut rien dire.
        title={`Bonjour, ${user?.fullName ?? ""}`}
        subtitle={
          data.edition
            ? `Édition ${data.edition.year} — ${data.edition.title}`
            : "Aucune édition configurée"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Inscriptions"
          value={formatNumber(data.registrations.total)}
          hint={`${pending} en attente de validation`}
        />
        <StatCard
          label="Remplissage des stands"
          value={`${data.stands.fillRate} %`}
          hint={`${data.stands.assigned} attribués sur ${data.stands.total} · ${data.stands.paid} réglés`}
          tone="gold"
        />
        <StatCard
          label="Solde budgétaire"
          value={formatMoney(data.budget.balance, data.budget.currency)}
          hint={`${formatMoney(data.budget.totalIncome, data.budget.currency)} de recettes`}
          tone={data.budget.balance >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Messages reçus"
          value={formatNumber(data.contacts.total)}
          hint={`${data.contacts.pending} non traités`}
          tone={data.contacts.pending > 0 ? "gold" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel
          title="Évolution des inscriptions"
          actions={
            can("inscriptions") && (
              <Link href="/admin/inscriptions" className="text-caption font-medium text-primary hover:underline">
                Ouvrir le module →
              </Link>
            )
          }
        >
          <CumulativeChart points={data.registrations.timeline} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Par qualité">
            <BarList
              items={data.registrations.byType.map((row) => ({
                label: REGISTRATION_TYPE_LABELS[row.type],
                value: row.count,
                color: TYPE_COLORS[row.type],
              }))}
            />
          </Panel>

          <Panel title="Par statut">
            <BarList
              items={data.registrations.byStatus.map((row) => ({
                label: REGISTRATION_STATUS_LABELS[row.status],
                value: row.count,
                color: STATUS_COLORS[row.status],
              }))}
            />
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {data.impact && (
          <Panel title="Objectif d'impact">
            <Gauge
              label={`Visiteurs sur place attendus en ${data.impact.year}`}
              value={data.impact.actualRegistrations}
              target={data.impact.targetOnSite}
            />
            <p className="mt-4 text-caption text-light-muted dark:text-dark-muted">
              Comparaison des inscriptions enregistrées au tableau de projections du cahier des
              charges. Les visiteurs sans inscription préalable ne sont pas comptés ici.
            </p>
          </Panel>
        )}

        {can("budget") && (
          <Panel title="Budget par poste">
            <BarList
              items={data.budget.byCategory.slice(0, 6).map((row) => ({
                label: `${row.type === "RECETTE" ? "▲" : "▼"} ${row.category}`,
                value: row.amount,
                color: row.type === "RECETTE" ? "#12B76A" : "#DC2626",
              }))}
            />
          </Panel>
        )}

        {can("sponsors") && (
          <Panel title={`Sponsors (${data.sponsors.total})`}>
            {data.sponsors.byLevel.length === 0 ? (
              <p className="text-caption text-light-muted dark:text-dark-muted">
                Aucun sponsor enregistré pour cette édition.
              </p>
            ) : (
              <BarList
                items={data.sponsors.byLevel.map((row) => ({
                  label: SPONSOR_LEVEL_LABELS[row.level],
                  value: row.count,
                  color: "#C9A227",
                }))}
              />
            )}
          </Panel>
        )}
      </div>

      <p className="mt-8 text-caption text-light-muted dark:text-dark-muted">
        Statuts de paiement suivis : {Object.values(PAYMENT_STATUS_LABELS).join(" · ")}.
      </p>
    </AdminPage>
  );
}
