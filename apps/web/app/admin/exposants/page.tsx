"use client";

import { useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import {
  STAND_STATUSES,
  STAND_STATUS_LABELS,
  formatMoney,
  type Exhibitor,
  type StandStatus,
} from "@fihadj/shared-types";
import { api, downloadFromApi, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner, StatCard, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";

const STATUS_COLORS: Record<StandStatus, string> = {
  LIBRE: "#5A6B7D",
  RESERVE: "#F59E0B",
  ATTRIBUE: "#2E7CB8",
  PAYE: "#12B76A",
};

interface StandStats {
  total: number;
  assigned: number;
  paid: number;
  fillRate: number;
  billed: number;
  collected: number;
  outstanding: number;
}

const EMPTY = {
  companyName: "",
  activitySector: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  standNumber: "",
  standStatus: "RESERVE" as StandStatus,
  standFee: 0,
  paidAmount: 0,
};

export default function ExposantsPage() {
  const { withEdition, editionPayload } = useEdition();
  const list = useEditionResource<Exhibitor[]>("/exhibitors");
  const stats = useEditionResource<StandStats>("/exhibitors/stats");
  const [editing, setEditing] = useState<Exhibitor | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  async function refresh(message: string) {
    setBanner(message);
    await Promise.all([list.reload(), stats.reload()]);
  }

  async function remove(exhibitor: Exhibitor) {
    setError(null);
    try {
      await api.delete(`/exhibitors/${exhibitor.id}`);
      await refresh(`Fiche « ${exhibitor.companyName} » supprimée.`);
    } catch (caught) {
      setError((caught as ApiClientError).message);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Exposants et stands"
        subtitle="Fiches exposants, attribution des emplacements et suivi des règlements."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => void downloadFromApi(withEdition("/exhibitors/export"), "exposants.csv")}>
              <Download className="h-4 w-4" aria-hidden /> Exporter
            </Button>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" aria-hidden /> Nouvel exposant
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

      {stats.data && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Fiches exposants" value={stats.data.total} hint={`${stats.data.assigned} stands attribués`} />
          <StatCard label="Taux de remplissage" value={`${stats.data.fillRate} %`} tone="gold" />
          <StatCard label="Facturé" value={formatMoney(stats.data.billed)} hint={`${formatMoney(stats.data.collected)} encaissés`} />
          <StatCard
            label="Reste à percevoir"
            value={formatMoney(stats.data.outstanding)}
            tone={stats.data.outstanding > 0 ? "danger" : "success"}
          />
        </div>
      )}

      {list.loading && <Spinner />}
      {list.error && <ErrorBanner message={list.error} />}

      {list.data && !list.loading && (
        <DataTable
          rows={list.data}
          keyOf={(row) => row.id}
          empty="Aucun exposant enregistré pour cette édition."
          minWidth={980}
          columns={[
            { header: "Stand", cell: (row) => <span className="font-mono">{row.standNumber ?? "—"}</span> },
            {
              header: "Raison sociale",
              cell: (row) => (
                <>
                  <span className="font-medium">{row.companyName}</span>
                  <span className="block text-caption text-light-muted dark:text-dark-muted">
                    {row.activitySector}
                  </span>
                </>
              ),
            },
            {
              header: "Contact",
              cell: (row) => (
                <>
                  <span>{row.contactName ?? "—"}</span>
                  <span className="block text-caption text-light-muted dark:text-dark-muted">
                    {row.contactEmail ?? ""}
                  </span>
                </>
              ),
            },
            {
              header: "Statut",
              cell: (row) => (
                <Badge color={STATUS_COLORS[row.standStatus]}>
                  {STAND_STATUS_LABELS[row.standStatus]}
                </Badge>
              ),
            },
            { header: "Dû", align: "right", cell: (row) => formatMoney(Number(row.standFee)) },
            { header: "Réglé", align: "right", cell: (row) => formatMoney(Number(row.paidAmount)) },
            {
              header: "Reste",
              align: "right",
              cell: (row) => {
                const rest = Number(row.standFee) - Number(row.paidAmount);
                return (
                  <span className={rest > 0 ? "font-medium text-danger" : "text-success"}>
                    {formatMoney(rest)}
                  </span>
                );
              },
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
                    onClick={() =>
                      confirm(`Supprimer la fiche « ${row.companyName} » ?`, () => void remove(row))
                    }
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
        <ExhibitorModal
          exhibitor={editing === "new" ? null : editing}
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

function ExhibitorModal({
  exhibitor,
  editionPayload,
  onClose,
  onSaved,
}: {
  exhibitor: Exhibitor | null;
  /** Édition de travail — sans elle, une création irait dans l'édition courante. */
  editionPayload: Record<string, unknown>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    ...EMPTY,
    ...(exhibitor && {
      companyName: exhibitor.companyName,
      activitySector: exhibitor.activitySector,
      contactName: exhibitor.contactName ?? "",
      contactEmail: exhibitor.contactEmail ?? "",
      contactPhone: exhibitor.contactPhone ?? "",
      standNumber: exhibitor.standNumber ?? "",
      standStatus: exhibitor.standStatus,
      standFee: Number(exhibitor.standFee),
      paidAmount: Number(exhibitor.paidAmount),
    }),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof values, value: string | number) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (exhibitor) await api.patch(`/exhibitors/${exhibitor.id}`, values);
      else await api.post("/exhibitors", { ...values, ...editionPayload });
      await onSaved(exhibitor ? "Fiche exposant mise à jour." : "Exposant ajouté.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={exhibitor ? "Modifier l'exposant" : "Nouvel exposant"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Raison sociale" htmlFor="companyName" required>
            <Input id="companyName" required value={values.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </Field>
          <Field label="Secteur d'activité" htmlFor="activitySector" required>
            <Input id="activitySector" required value={values.activitySector} onChange={(e) => set("activitySector", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Contact" htmlFor="contactName">
            <Input id="contactName" value={values.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="contactEmail">
            <Input id="contactEmail" type="email" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="Téléphone" htmlFor="contactPhone">
            <Input id="contactPhone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Numéro de stand" htmlFor="standNumber" hint="Laisser vide si non attribué">
            <Input id="standNumber" value={values.standNumber} onChange={(e) => set("standNumber", e.target.value)} />
          </Field>
          <Field label="Statut" htmlFor="standStatus">
            <Select id="standStatus" value={values.standStatus} onChange={(e) => set("standStatus", e.target.value)}>
              {STAND_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STAND_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Montant dû (XOF)" htmlFor="standFee">
            <Input id="standFee" type="number" min={0} step={1000} value={values.standFee} onChange={(e) => set("standFee", Number(e.target.value))} />
          </Field>
          <Field label="Montant réglé (XOF)" htmlFor="paidAmount">
            <Input id="paidAmount" type="number" min={0} step={1000} value={values.paidAmount} onChange={(e) => set("paidAmount", Number(e.target.value))} />
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
