"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Pencil, Plus } from "lucide-react";
import { formatDateRange, type Edition } from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useEdition } from "@/lib/edition";
import { useResource } from "@/lib/use-resource";
import { Badge, Button } from "@/components/ui/primitives";
import { Checkbox, Field, FormAlert, Input, Textarea } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner } from "@/components/admin/shell";

export default function EditionsPage() {
  const { reloadEditions } = useEdition();
  const { data, loading, error, reload } = useResource<Edition[]>("/editions");
  const [editing, setEditing] = useState<Edition | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function setCurrent(edition: Edition) {
    setFailure(null);
    try {
      await api.post(`/editions/${edition.id}/set-current`);
      setBanner(`L'édition ${edition.year} est désormais celle qu'affiche le site public.`);
      // Le sélecteur du menu latéral marque l'édition publiée : sa liste doit suivre.
      await Promise.all([reload(), reloadEditions()]);
    } catch (caught) {
      setFailure((caught as ApiClientError).message);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Éditions"
        subtitle="Le forum est annuel : chaque édition a son thème, son programme, ses inscriptions et son budget."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Nouvelle édition
          </Button>
        }
      />

      {banner && (
        <div className="mb-4">
          <FormAlert tone="success" title={banner} />
        </div>
      )}
      {failure && (
        <div className="mb-4">
          <ErrorBanner message={failure} />
        </div>
      )}

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}

      <div className="grid gap-5 md:grid-cols-2">
        {(data ?? []).map((edition) => (
          <Panel
            key={edition.id}
            title={`${edition.year} — ${edition.title}`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => setEditing(edition)}>
                <Pencil className="h-4 w-4" aria-hidden /> Modifier
              </Button>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {edition.isCurrent ? (
                <Badge color="#12B76A">Édition courante</Badge>
              ) : (
                <Badge color="#5A6B7D">Archivée</Badge>
              )}
              <Badge color={edition.registrationOpen ? "#2E7CB8" : "#DC2626"}>
                {edition.registrationOpen ? "Inscriptions ouvertes" : "Inscriptions closes"}
              </Badge>
            </div>

            <dl className="space-y-2 text-body">
              <Row label="Thème" value={edition.theme} />
              <Row label="Dates" value={formatDateRange(edition.startDate, edition.endDate)} />
              <Row label="Lieu" value={`${edition.venue}, ${edition.city}`} />
            </dl>

            {!edition.isCurrent && (
              <Button size="sm" variant="ghost" className="mt-4" onClick={() => void setCurrent(edition)}>
                <Circle className="h-4 w-4" aria-hidden /> Définir comme édition courante
              </Button>
            )}
            {edition.isCurrent && (
              <p className="mt-4 flex items-center gap-2 text-caption text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                C&apos;est cette édition que le site public affiche.
              </p>
            )}
          </Panel>
        ))}
      </div>

      {editing && (
        <EditionModal
          edition={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            setBanner(message);
            await Promise.all([reload(), reloadEditions()]);
          }}
        />
      )}
    </AdminPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-caption text-light-muted dark:text-dark-muted">{label}</dt>
      <dd className="text-body">{value}</dd>
    </div>
  );
}

function EditionModal({
  edition,
  onClose,
  onSaved,
}: {
  edition: Edition | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    year: edition?.year ?? new Date().getFullYear() + 1,
    title: edition?.title ?? "",
    theme: edition?.theme ?? "",
    heroSubtitle: edition?.heroSubtitle ?? "",
    startDate: (edition?.startDate ?? "").slice(0, 10),
    endDate: (edition?.endDate ?? "").slice(0, 10),
    venue: edition?.venue ?? "Palais de la Culture de Treichville",
    city: edition?.city ?? "Abidjan",
    registrationOpen: edition?.registrationOpen ?? true,
    isCurrent: edition?.isCurrent ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (edition) await api.patch(`/editions/${edition.id}`, values);
      else await api.post("/editions", values);
      await onSaved(edition ? "Édition mise à jour." : "Édition créée.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={edition ? `Édition ${edition.year}` : "Nouvelle édition"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label="Année" htmlFor="year" required>
            <Input id="year" type="number" min={2024} max={2100} required value={values.year} onChange={(e) => setValues({ ...values, year: Number(e.target.value) })} />
          </Field>
          <Field label="Titre" htmlFor="title" required hint="Ex. « FI-HADJ 2026 — 2ᵉ édition »">
            <Input id="title" required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
          </Field>
        </div>

        <Field label="Thème de l'édition" htmlFor="theme" required>
          <Textarea id="theme" required value={values.theme} onChange={(e) => setValues({ ...values, theme: e.target.value })} className="min-h-[80px]" />
        </Field>

        <Field label="Accroche" htmlFor="heroSubtitle" hint="Phrase affichée sous le thème sur la page d'accueil.">
          <Input id="heroSubtitle" value={values.heroSubtitle} onChange={(e) => setValues({ ...values, heroSubtitle: e.target.value })} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date d'ouverture" htmlFor="startDate" required>
            <Input id="startDate" type="date" required value={values.startDate} onChange={(e) => setValues({ ...values, startDate: e.target.value })} />
          </Field>
          <Field label="Date de clôture" htmlFor="endDate" required>
            <Input id="endDate" type="date" required value={values.endDate} onChange={(e) => setValues({ ...values, endDate: e.target.value })} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lieu" htmlFor="venue" required>
            <Input id="venue" required value={values.venue} onChange={(e) => setValues({ ...values, venue: e.target.value })} />
          </Field>
          <Field label="Ville" htmlFor="city" required>
            <Input id="city" required value={values.city} onChange={(e) => setValues({ ...values, city: e.target.value })} />
          </Field>
        </div>

        <div className="space-y-3">
          <Checkbox
            id="registrationOpen"
            checked={values.registrationOpen}
            onChange={(e) => setValues({ ...values, registrationOpen: e.target.checked })}
          >
            Inscriptions ouvertes — décochez pour fermer le formulaire public.
          </Checkbox>
          <Checkbox
            id="isCurrent"
            checked={values.isCurrent}
            onChange={(e) => setValues({ ...values, isCurrent: e.target.checked })}
          >
            Édition courante — c&apos;est celle qu&apos;affiche le site public. Une seule à la fois.
          </Checkbox>
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
