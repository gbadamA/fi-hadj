"use client";

import { useState } from "react";
import { Award, Pencil, Plus, Trash2 } from "lucide-react";
import {
  SPONSOR_LEVELS,
  SPONSOR_LEVEL_LABELS,
  formatMoney,
  type Prize,
  type Sponsor,
  type SponsorLevel,
} from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/form";
import { Select } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";

export default function SponsorsPage() {
  const { editionPayload } = useEdition();
  const sponsors = useEditionResource<Sponsor[]>("/sponsors");
  const prizes = useEditionResource<Prize[]>("/prizes");
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | "new" | null>(null);
  const [editingPrize, setEditingPrize] = useState<Prize | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  async function remove(path: string, label: string, reload: () => Promise<void>) {
    setError(null);
    try {
      await api.delete(path);
      setBanner(`${label} supprimé.`);
      await reload();
    } catch (caught) {
      setError((caught as ApiClientError).message);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Sponsors et distinctions"
        subtitle="Niveaux de partenariat, contreparties et prix remis lors du dîner-gala."
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

      <Panel
        title="Sponsors et partenaires"
        className="mb-6"
        actions={
          <Button size="sm" onClick={() => setEditingSponsor("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        }
      >
        {sponsors.loading && <Spinner />}
        {sponsors.error && <ErrorBanner message={sponsors.error} />}
        {sponsors.data && (
          <DataTable
            rows={sponsors.data}
            keyOf={(row) => row.id}
            minWidth={760}
            empty="Aucun sponsor enregistré pour cette édition."
            columns={[
              { header: "Nom", cell: (row) => <span className="font-medium">{row.name}</span> },
              {
                header: "Niveau",
                cell: (row) => <Badge color="#C9A227">{SPONSOR_LEVEL_LABELS[row.level]}</Badge>,
              },
              { header: "Montant", align: "right", cell: (row) => formatMoney(Number(row.amount)) },
              {
                header: "Contreparties",
                cell: (row) =>
                  row.benefits.length === 0 ? (
                    <span className="text-light-muted dark:text-dark-muted">—</span>
                  ) : (
                    <ul className="space-y-0.5 text-caption text-light-muted dark:text-dark-muted">
                      {row.benefits.map((benefit) => (
                        <li key={benefit}>· {benefit}</li>
                      ))}
                    </ul>
                  ),
              },
              {
                header: "Actions",
                align: "right",
                cell: (row) => (
                  <RowActions>
                    <IconButton title="Modifier" onClick={() => setEditingSponsor(row)}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      title="Supprimer"
                      tone="danger"
                      onClick={() =>
                        confirm(`Supprimer le sponsor « ${row.name} » ?`, () =>
                          void remove(`/sponsors/${row.id}`, "Sponsor", sponsors.reload),
                        )
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
      </Panel>

      <Panel
        title="Distinctions du dîner-gala"
        actions={
          <Button size="sm" onClick={() => setEditingPrize("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        }
      >
        <p className="mb-4 text-caption text-light-muted dark:text-dark-muted">
          Les récipiendaires sont repris du cahier des charges. L&apos;intitulé exact de chaque prix
          et le nom du lauréat physique restent à compléter par le Commissariat Général.
        </p>
        {prizes.loading && <Spinner />}
        {prizes.error && <ErrorBanner message={prizes.error} />}
        {prizes.data && (
          <DataTable
            rows={prizes.data}
            keyOf={(row) => row.id}
            minWidth={720}
            empty="Aucune distinction enregistrée."
            columns={[
              {
                header: "Distinction",
                cell: (row) => (
                  <span className="inline-flex items-center gap-2 font-medium">
                    <Award className="h-4 w-4 text-secondary" aria-hidden />
                    {row.name}
                  </span>
                ),
              },
              { header: "Catégorie", cell: (row) => row.description ?? "—" },
              { header: "Sponsor associé", cell: (row) => row.sponsorName ?? "—" },
              { header: "Lauréat", cell: (row) => row.laureate ?? "—" },
              {
                header: "Actions",
                align: "right",
                cell: (row) => (
                  <RowActions>
                    <IconButton title="Modifier" onClick={() => setEditingPrize(row)}>
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      title="Supprimer"
                      tone="danger"
                      onClick={() =>
                        confirm(`Supprimer la distinction « ${row.name} » ?`, () =>
                          void remove(`/prizes/${row.id}`, "Distinction", prizes.reload),
                        )
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
      </Panel>

      {editingSponsor && (
        <SponsorModal
          sponsor={editingSponsor === "new" ? null : editingSponsor}
          editionPayload={editionPayload()}
          onClose={() => setEditingSponsor(null)}
          onSaved={async (message) => {
            setEditingSponsor(null);
            setBanner(message);
            await sponsors.reload();
          }}
        />
      )}

      {editingPrize && (
        <PrizeModal
          prize={editingPrize === "new" ? null : editingPrize}
          editionPayload={editionPayload()}
          onClose={() => setEditingPrize(null)}
          onSaved={async (message) => {
            setEditingPrize(null);
            setBanner(message);
            await prizes.reload();
          }}
        />
      )}

      {dialog}
    </AdminPage>
  );
}

function SponsorModal({
  sponsor,
  editionPayload,
  onClose,
  onSaved,
}: {
  sponsor: Sponsor | null;
  editionPayload: Record<string, unknown>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    name: sponsor?.name ?? "",
    level: (sponsor?.level ?? "OR") as SponsorLevel,
    websiteUrl: sponsor?.websiteUrl ?? "",
    logoUrl: sponsor?.logoUrl ?? "",
    amount: Number(sponsor?.amount ?? 0),
    // Les contreparties sont saisies en texte libre, une par ligne : plus rapide
    // qu'un éditeur de liste pour un champ qu'on remplit une fois par sponsor.
    benefits: (sponsor?.benefits ?? []).join("\n"),
    order: sponsor?.order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...values,
      benefits: values.benefits
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    try {
      if (sponsor) await api.patch(`/sponsors/${sponsor.id}`, payload);
      else await api.post("/sponsors", { ...payload, ...editionPayload });
      await onSaved(sponsor ? "Sponsor mis à jour." : "Sponsor ajouté.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={sponsor ? "Modifier le sponsor" : "Nouveau sponsor"}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label="Nom" htmlFor="name" required>
          <Input id="name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Niveau" htmlFor="level">
            <Select id="level" value={values.level} onChange={(e) => setValues({ ...values, level: e.target.value as SponsorLevel })}>
              {SPONSOR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {SPONSOR_LEVEL_LABELS[level]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Montant (XOF)" htmlFor="amount">
            <Input id="amount" type="number" min={0} step={100000} value={values.amount} onChange={(e) => setValues({ ...values, amount: Number(e.target.value) })} />
          </Field>
          <Field label="Ordre d'affichage" htmlFor="order">
            <Input id="order" type="number" min={0} value={values.order} onChange={(e) => setValues({ ...values, order: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site web" htmlFor="websiteUrl">
            <Input id="websiteUrl" value={values.websiteUrl} onChange={(e) => setValues({ ...values, websiteUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="URL du logo" htmlFor="logoUrl" hint="Téléversez d'abord le fichier dans la médiathèque.">
            <Input id="logoUrl" value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} />
          </Field>
        </div>
        <Field label="Contreparties" htmlFor="benefits" hint="Une par ligne.">
          <Textarea id="benefits" value={values.benefits} onChange={(e) => setValues({ ...values, benefits: e.target.value })} />
        </Field>
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

function PrizeModal({
  prize,
  editionPayload,
  onClose,
  onSaved,
}: {
  prize: Prize | null;
  editionPayload: Record<string, unknown>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    name: prize?.name ?? "",
    description: prize?.description ?? "",
    sponsorName: prize?.sponsorName ?? "",
    laureate: prize?.laureate ?? "",
    order: prize?.order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (prize) await api.patch(`/prizes/${prize.id}`, values);
      else await api.post("/prizes", { ...values, ...editionPayload });
      await onSaved(prize ? "Distinction mise à jour." : "Distinction ajoutée.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={prize ? "Modifier la distinction" : "Nouvelle distinction"}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label="Intitulé / récipiendaire" htmlFor="prizeName" required>
          <Input id="prizeName" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        </Field>
        <Field label="Catégorie" htmlFor="prizeDescription" hint="Compagnie aérienne, opérateur du pèlerinage, personnalité…">
          <Input id="prizeDescription" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sponsor associé" htmlFor="sponsorName">
            <Input id="sponsorName" value={values.sponsorName} onChange={(e) => setValues({ ...values, sponsorName: e.target.value })} />
          </Field>
          <Field label="Lauréat" htmlFor="laureate">
            <Input id="laureate" value={values.laureate} onChange={(e) => setValues({ ...values, laureate: e.target.value })} />
          </Field>
        </div>
        <Field label="Ordre d'affichage" htmlFor="prizeOrder">
          <Input id="prizeOrder" type="number" min={0} value={values.order} onChange={(e) => setValues({ ...values, order: Number(e.target.value) })} />
        </Field>
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
