"use client";

import { useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import {
  BUDGET_ENTRY_TYPES,
  BUDGET_ENTRY_TYPE_LABELS,
  formatDateShort,
  formatMoney,
  type BudgetEntry,
  type BudgetEntryType,
  type BudgetSummary,
} from "@fihadj/shared-types";
import { api, downloadFromApi, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner, StatCard, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";
import { BarList } from "@/components/admin/charts";

export default function BudgetPage() {
  const { withEdition, editionPayload } = useEdition();
  const entries = useEditionResource<BudgetEntry[]>("/budget-entries");
  const summary = useEditionResource<BudgetSummary>("/budget/summary");
  const [editing, setEditing] = useState<BudgetEntry | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  async function refresh(message: string) {
    setBanner(message);
    await Promise.all([entries.reload(), summary.reload()]);
  }

  async function remove(entry: BudgetEntry) {
    setError(null);
    try {
      await api.delete(`/budget-entries/${entry.id}`);
      await refresh("Ligne de budget supprimée.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Budget"
        subtitle="Recettes, dépenses et solde de l'édition — réservé au Responsable Financier et à la direction."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => void downloadFromApi(withEdition("/budget/export"), "budget.csv")}>
              <Download className="h-4 w-4" aria-hidden /> Exporter
            </Button>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" aria-hidden /> Nouvelle ligne
            </Button>
          </>
        }
      />

      {banner && (
        <div className="mb-4">
          <FormAlert tone="success" title={banner} />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {summary.loading && <Spinner />}
      {summary.error && <ErrorBanner message={summary.error} />}

      {summary.data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Recettes"
              value={formatMoney(summary.data.totalIncome, summary.data.currency)}
              tone="success"
            />
            <StatCard
              label="Dépenses"
              value={formatMoney(summary.data.totalExpense, summary.data.currency)}
              tone="danger"
            />
            <StatCard
              label="Solde"
              value={formatMoney(summary.data.balance, summary.data.currency)}
              tone={summary.data.balance >= 0 ? "gold" : "danger"}
              hint={summary.data.balance >= 0 ? "Excédent prévisionnel" : "Déficit à combler"}
            />
          </div>

          {summary.data.byCategory.length > 0 && (
            <Panel title="Ventilation par poste" className="mb-6">
              <BarList
                items={summary.data.byCategory.map((row) => ({
                  label: `${row.type === "RECETTE" ? "▲" : "▼"} ${row.category}`,
                  value: row.amount,
                  color: row.type === "RECETTE" ? "#12B76A" : "#DC2626",
                }))}
              />
            </Panel>
          )}
        </>
      )}

      {entries.loading && <Spinner />}
      {entries.error && <ErrorBanner message={entries.error} />}

      {entries.data && (
        <DataTable
          rows={entries.data}
          keyOf={(row) => row.id}
          minWidth={860}
          empty="Aucune écriture pour cette édition."
          columns={[
            { header: "Date", cell: (row) => formatDateShort(row.date) },
            {
              header: "Nature",
              cell: (row) => (
                <Badge color={row.type === "RECETTE" ? "#12B76A" : "#DC2626"}>
                  {BUDGET_ENTRY_TYPE_LABELS[row.type]}
                </Badge>
              ),
            },
            { header: "Poste", cell: (row) => row.category },
            { header: "Libellé", cell: (row) => <span className="font-medium">{row.label}</span> },
            {
              header: "Montant",
              align: "right",
              cell: (row) => (
                <span className={row.type === "RECETTE" ? "text-success" : "text-danger"}>
                  {row.type === "RECETTE" ? "+" : "−"} {formatMoney(Number(row.amount), row.currency)}
                </span>
              ),
            },
            {
              header: "Saisi par",
              cell: (row) => (
                <span className="text-caption text-light-muted dark:text-dark-muted">
                  {row.createdBy?.fullName ?? "—"}
                </span>
              ),
            },
            {
              header: "Actions",
              align: "right",
              cell: (row) => (
                <RowActions>
                  <IconButton title="Modifier" onClick={() => setEditing(row)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    title="Supprimer"
                    tone="danger"
                    onClick={() => confirm(`Supprimer « ${row.label} » ?`, () => void remove(row))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      )}

      {editing && (
        <EntryModal
          entry={editing === "new" ? null : editing}
          editionPayload={editionPayload()}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            await refresh(message);
          }}
        />
      )}

      {dialog}
    </AdminPage>
  );
}

function EntryModal({
  entry,
  editionPayload,
  onClose,
  onSaved,
}: {
  entry: BudgetEntry | null;
  editionPayload: Record<string, unknown>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    type: (entry?.type ?? "DEPENSE") as BudgetEntryType,
    category: entry?.category ?? "",
    label: entry?.label ?? "",
    amount: Number(entry?.amount ?? 0),
    currency: entry?.currency ?? "XOF",
    date: (entry?.date ?? new Date().toISOString()).slice(0, 10),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (entry) await api.patch(`/budget-entries/${entry.id}`, values);
      else await api.post("/budget-entries", { ...values, ...editionPayload });
      await onSaved(entry ? "Écriture mise à jour." : "Écriture enregistrée.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={entry ? "Modifier l'écriture" : "Nouvelle écriture"}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nature" htmlFor="type" required>
            <Select id="type" value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as BudgetEntryType })}>
              {BUDGET_ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BUDGET_ENTRY_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="date" required>
            <Input id="date" type="date" required value={values.date} onChange={(e) => setValues({ ...values, date: e.target.value })} />
          </Field>
        </div>

        <Field label="Poste budgétaire" htmlFor="category" required hint="Sponsoring, location de site, restauration, communication…">
          <Input id="category" required value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} />
        </Field>

        <Field label="Libellé" htmlFor="label" required>
          <Input id="label" required value={values.label} onChange={(e) => setValues({ ...values, label: e.target.value })} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Montant" htmlFor="amount" required>
            <Input id="amount" type="number" min={0} step={1000} required value={values.amount} onChange={(e) => setValues({ ...values, amount: Number(e.target.value) })} />
          </Field>
          <Field label="Devise" htmlFor="currency" hint="Code ISO à 3 lettres">
            <Input id="currency" maxLength={3} value={values.currency} onChange={(e) => setValues({ ...values, currency: e.target.value.toUpperCase() })} />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
