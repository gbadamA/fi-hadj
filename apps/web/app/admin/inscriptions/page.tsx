"use client";

import { useState } from "react";
import { BadgeCheck, Bell, Download, Search, Trash2, X } from "lucide-react";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUSES,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_TYPES,
  REGISTRATION_TYPE_LABELS,
  formatDateTime,
  formatFullName,
  formatPhone,
  type Paginated,
  type PaymentStatus,
  type Registration,
  type RegistrationStatus,
  type RegistrationType,
} from "@fihadj/shared-types";
import { api, downloadFromApi, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Badge, Button, cx } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import {
  AdminHeader,
  AdminPage,
  ErrorBanner,
  Modal,
  Panel,
  Spinner,
  useConfirm,
} from "@/components/admin/shell";

const TYPE_COLORS: Record<RegistrationType, string> = {
  PARTICIPANT: "#2E7CB8",
  EXPOSANT: "#0E9F6E",
  SPONSOR: "#C9A227",
};

const STATUS_COLORS: Record<RegistrationStatus, string> = {
  EN_ATTENTE: "#F59E0B",
  VALIDE: "#12B76A",
  REJETE: "#DC2626",
};

export default function InscriptionsPage() {
  const [type, setType] = useState<"" | RegistrationType>("");
  const [status, setStatus] = useState<"" | RegistrationStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const { withEdition } = useEdition();

  const query = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (type) query.set("type", type);
  if (status) query.set("status", status);
  if (search.trim()) query.set("search", search.trim());

  const { data, loading, error, reload } = useEditionResource<Paginated<Registration>>(
    `/registrations?${query.toString()}`,
  );

  async function run(action: () => Promise<unknown>, message: string) {
    setActionError(null);
    try {
      await action();
      setBanner(message);
      await reload();
    } catch (caught) {
      setActionError((caught as ApiClientError).message);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminPage>
      <AdminHeader
        title="Inscriptions"
        subtitle="Valider, rejeter, délivrer les badges et exporter les listes."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                void run(
                  () => api.post(withEdition("/registrations/reminders")),
                  "Rappels envoyés aux inscrits validés.",
                )
              }
            >
              <Bell className="h-4 w-4" aria-hidden /> Envoyer les rappels
            </Button>
            <Button
              size="sm"
              onClick={() =>
                void downloadFromApi(
                  withEdition(`/registrations/export${type ? `?type=${type}` : ""}`),
                  "inscriptions.csv",
                )
              }
            >
              <Download className="h-4 w-4" aria-hidden /> Exporter en CSV
            </Button>
          </>
        }
      />

      {banner && (
        <div className="mb-4">
          <FormAlert tone="success" title={banner} />
        </div>
      )}
      {actionError && (
        <div className="mb-4">
          <ErrorBanner message={actionError} />
        </div>
      )}

      <Panel className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Rechercher" htmlFor="search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-muted"
                aria-hidden
              />
              <Input
                id="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Nom, email, organisation, référence…"
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Qualité" htmlFor="type">
            <Select
              id="type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as RegistrationType | "");
                setPage(1);
              }}
            >
              <option value="">Toutes</option>
              {REGISTRATION_TYPES.map((value) => (
                <option key={value} value={value}>
                  {REGISTRATION_TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Statut" htmlFor="status">
            <Select
              id="status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as RegistrationStatus | "");
                setPage(1);
              }}
            >
              <option value="">Tous</option>
              {REGISTRATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {REGISTRATION_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setType("");
                setStatus("");
                setSearch("");
                setPage(1);
              }}
            >
              <X className="h-4 w-4" aria-hidden /> Réinitialiser
            </Button>
          </div>
        </div>
      </Panel>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}

      {data && !loading && (
        <>
          <div className="overflow-x-auto scroll-slim rounded-md border border-light-border dark:border-dark-border">
            <table className="w-full min-w-[900px] border-collapse text-body">
              <thead>
                <tr className="border-b border-light-border bg-light-surface-alt text-left text-caption uppercase tracking-wider text-light-muted dark:border-dark-border dark:bg-dark-surface-alt dark:text-dark-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Référence</th>
                  <th scope="col" className="px-4 py-3 font-medium">Inscrit</th>
                  <th scope="col" className="px-4 py-3 font-medium">Qualité</th>
                  <th scope="col" className="px-4 py-3 font-medium">Organisation</th>
                  <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                  <th scope="col" className="px-4 py-3 font-medium">Paiement</th>
                  <th scope="col" className="px-4 py-3 font-medium">Reçue le</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-light-muted dark:text-dark-muted">
                      Aucune inscription ne correspond à ces filtres.
                    </td>
                  </tr>
                )}
                {data.items.map((registration) => (
                  <tr
                    key={registration.id}
                    className="border-b border-light-border last:border-0 hover:bg-light-surface-alt dark:border-dark-border dark:hover:bg-dark-surface-alt"
                  >
                    <td className="px-4 py-3 font-mono text-caption tracking-wide">
                      {registration.reference}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(registration)}
                        className="text-left font-medium hover:text-primary"
                      >
                        {formatFullName(registration.civility, registration.firstName, registration.lastName)}
                      </button>
                      <span className="block text-caption text-light-muted dark:text-dark-muted">
                        {registration.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={TYPE_COLORS[registration.type]}>
                        {REGISTRATION_TYPE_LABELS[registration.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-caption">{registration.organization ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_COLORS[registration.status]}>
                        {REGISTRATION_STATUS_LABELS[registration.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-caption">
                      {PAYMENT_STATUS_LABELS[registration.paymentStatus]}
                    </td>
                    <td className="px-4 py-3 text-caption text-light-muted dark:text-dark-muted">
                      {formatDateTime(registration.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {registration.status === "VALIDE" && (
                          <button
                            type="button"
                            title="Télécharger le badge"
                            aria-label={`Badge de ${registration.reference}`}
                            onClick={() =>
                              void downloadFromApi(
                                `/registrations/${registration.id}/badge`,
                                `badge-${registration.reference}.pdf`,
                              )
                            }
                            className="rounded-full p-2 text-primary transition hover:bg-primary/10"
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Supprimer"
                          aria-label={`Supprimer ${registration.reference}`}
                          onClick={() =>
                            confirm(
                              `Supprimer définitivement l'inscription ${registration.reference} ? Cette action est irréversible.`,
                              () =>
                                void run(
                                  () => api.delete(`/registrations/${registration.id}`),
                                  "Inscription supprimée.",
                                ),
                            )
                          }
                          className="rounded-full p-2 text-light-muted transition hover:bg-danger/10 hover:text-danger dark:text-dark-muted"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 text-caption text-light-muted dark:text-dark-muted">
            <span>
              {data.total} inscription{data.total > 1 ? "s" : ""} · page {data.page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </>
      )}

      <ReviewModal
        registration={selected}
        onClose={() => setSelected(null)}
        onDone={async (message) => {
          setSelected(null);
          setBanner(message);
          await reload();
        }}
      />

      {dialog}
    </AdminPage>
  );
}

/** Fiche détaillée + décision. La validation déclenche l'envoi du badge par email. */
function ReviewModal({
  registration,
  onClose,
  onDone,
}: {
  registration: Registration | null;
  onClose: () => void;
  onDone: (message: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [payment, setPayment] = useState<PaymentStatus | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!registration) return null;

  async function decide(status: RegistrationStatus) {
    if (!registration) return;
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/registrations/${registration.id}/status`, {
        status,
        ...(payment && { paymentStatus: payment }),
        ...(reason.trim() && { reason: reason.trim() }),
      });
      setReason("");
      setPayment("");
      await onDone(
        status === "VALIDE"
          ? `Inscription ${registration.reference} validée — badge envoyé par email.`
          : `Inscription ${registration.reference} rejetée — l'inscrit a été informé.`,
      );
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, string | null][] = [
    ["Référence", registration.reference],
    ["Qualité", REGISTRATION_TYPE_LABELS[registration.type]],
    ["Email", registration.email],
    ["Téléphone", formatPhone(registration.phone)],
    ["Pays", registration.country],
    ["Organisation", registration.organization],
    ["Fonction", registration.position],
    ["Catégorie", registration.targetCategory?.name ?? null],
    ["Secteur d'activité", registration.activitySector],
    ["Stand souhaité", registration.standSize],
    ["Stand attribué", registration.exhibitor?.standNumber ?? null],
    ["Niveau de sponsoring", registration.sponsorLevel],
    ["Reçue le", formatDateTime(registration.createdAt)],
    ["Motif de décision", registration.reviewReason],
  ];

  return (
    <Modal open onClose={onClose} title={formatFullName(registration.civility, registration.firstName, registration.lastName)} width="lg">
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge color={TYPE_COLORS[registration.type]}>
          {REGISTRATION_TYPE_LABELS[registration.type]}
        </Badge>
        <Badge color={STATUS_COLORS[registration.status]}>
          {REGISTRATION_STATUS_LABELS[registration.status]}
        </Badge>
        <Badge>{PAYMENT_STATUS_LABELS[registration.paymentStatus]}</Badge>
      </div>

      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="border-b border-light-border py-2 dark:border-dark-border">
              <dt className="text-caption text-light-muted dark:text-dark-muted">{label}</dt>
              <dd className="text-body font-medium">{value}</dd>
            </div>
          ))}
      </dl>

      {registration.message && (
        <div className="mt-5 rounded-md bg-light-surface-alt p-4 dark:bg-dark-surface-alt">
          <p className="text-caption text-light-muted dark:text-dark-muted">
            Message de l&apos;inscrit
          </p>
          <p className="mt-1 whitespace-pre-line text-body">{registration.message}</p>
        </div>
      )}

      <div className="mt-6 space-y-4 border-t border-light-border pt-6 dark:border-dark-border">
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Statut de paiement" htmlFor="payment">
            <Select
              id="payment"
              value={payment}
              onChange={(event) => setPayment(event.target.value as PaymentStatus | "")}
            >
              <option value="">Inchangé</option>
              {PAYMENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {PAYMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Motif"
            htmlFor="reason"
            hint="Obligatoire en cas de rejet — il est transmis à l'inscrit."
          >
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-[80px]"
            />
          </Field>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Fermer
          </Button>
          <Button
            variant="danger"
            onClick={() => void decide("REJETE")}
            disabled={busy}
            className={cx(!reason.trim() && "opacity-60")}
          >
            Rejeter
          </Button>
          <Button onClick={() => void decide("VALIDE")} disabled={busy}>
            Valider et envoyer le badge
          </Button>
        </div>
      </div>
    </Modal>
  );
}
