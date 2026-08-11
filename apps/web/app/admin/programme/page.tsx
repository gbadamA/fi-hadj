"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  PROGRAM_ITEM_TYPES,
  PROGRAM_ITEM_TYPE_LABELS,
  formatDateLong,
  type Edition,
  type ProgramItem,
  type ProgramItemType,
  type SubTheme,
} from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";

const TYPE_COLORS: Record<ProgramItemType, string> = {
  CEREMONIE: "#0F3D6B",
  PANEL: "#2E7CB8",
  ATELIER: "#0E9F6E",
  EXPOSITION: "#7C3AED",
  GALA: "#C9A227",
  PAUSE: "#5A6B7D",
};

interface ThemeResponse {
  subThemes: SubTheme[];
}

export default function ProgrammePage() {
  // L'édition vient du sélecteur, pas de /editions/current : sinon la date par
  // défaut d'un nouveau créneau serait celle de l'édition publiée.
  const { edition, editionPayload } = useEdition();
  const items = useEditionResource<ProgramItem[]>("/program-items");
  const theme = useEditionResource<ThemeResponse>("/themes");
  const [editing, setEditing] = useState<ProgramItem | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  // Le programme se lit par journée : deux tableaux valent mieux qu'une liste
  // de treize créneaux dont on ne sait plus quel jour ils concernent.
  const days = new Map<string, ProgramItem[]>();
  for (const item of items.data ?? []) {
    const key = String(item.day).slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), item]);
  }

  async function remove(item: ProgramItem) {
    setError(null);
    try {
      await api.delete(`/program-items/${item.id}`);
      setBanner("Élément de programme supprimé.");
      await items.reload();
    } catch (caught) {
      setError((caught as ApiClientError).message);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Programme"
        subtitle="Cérémonies, panels, ateliers, exposition et dîner-gala des deux journées."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Nouvel élément
          </Button>
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

      {items.loading && <Spinner />}
      {items.error && <ErrorBanner message={items.error} />}

      {items.data && [...days.entries()].map(([day, dayItems], index) => (
        <Panel key={day} title={`Journée ${index + 1} — ${formatDateLong(day)}`} className="mb-6">
          <DataTable
            rows={dayItems}
            keyOf={(row) => row.id}
            minWidth={860}
            columns={[
              {
                header: "Horaire",
                cell: (row) => (
                  <span className="font-mono tabular-nums">
                    {row.startTime} – {row.endTime}
                  </span>
                ),
              },
              {
                header: "Type",
                cell: (row) => <Badge color={TYPE_COLORS[row.type]}>{PROGRAM_ITEM_TYPE_LABELS[row.type]}</Badge>,
              },
              {
                header: "Intitulé",
                cell: (row) => (
                  <>
                    <span className="font-medium">{row.title}</span>
                    {row.speakers.length > 0 && (
                      <span className="block text-caption text-light-muted dark:text-dark-muted">
                        {row.speakers.join(" · ")}
                      </span>
                    )}
                  </>
                ),
              },
              { header: "Lieu", cell: (row) => row.location ?? "—" },
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
                      onClick={() => confirm(`Supprimer « ${row.title} » ?`, () => void remove(row))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </RowActions>
                ),
              },
            ]}
          />
        </Panel>
      ))}

      {items.data?.length === 0 && (
        <Panel>
          <p className="py-6 text-center text-light-muted dark:text-dark-muted">
            Le programme est vide. Ajoutez un premier créneau.
          </p>
        </Panel>
      )}

      {editing && (
        <ProgramModal
          item={editing === "new" ? null : editing}
          subThemes={theme.data?.subThemes ?? []}
          defaultDay={(edition?.startDate ?? new Date().toISOString()).slice(0, 10)}
          editionPayload={editionPayload()}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            setBanner(message);
            await items.reload();
          }}
        />
      )}

      {dialog}
    </AdminPage>
  );
}

function ProgramModal({
  item,
  subThemes,
  defaultDay,
  editionPayload,
  onClose,
  onSaved,
}: {
  item: ProgramItem | null;
  subThemes: SubTheme[];
  defaultDay: string;
  editionPayload: Record<string, unknown>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    type: (item?.type ?? "PANEL") as ProgramItemType,
    day: (item?.day ?? defaultDay).slice(0, 10),
    startTime: item?.startTime ?? "09:00",
    endTime: item?.endTime ?? "10:30",
    location: item?.location ?? "",
    speakers: (item?.speakers ?? []).join("\n"),
    subThemeId: item?.subThemeId ?? "",
    order: item?.order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...values,
      speakers: values.speakers
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    try {
      if (item) await api.patch(`/program-items/${item.id}`, payload);
      else await api.post("/program-items", { ...payload, ...editionPayload });
      await onSaved(item ? "Élément mis à jour." : "Élément ajouté au programme.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? "Modifier l'élément" : "Nouvel élément de programme"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <Field label="Intitulé" htmlFor="title" required>
          <Input id="title" required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
        </Field>

        <Field label="Description" htmlFor="description">
          <Textarea id="description" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Type" htmlFor="type" required>
            <Select id="type" value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as ProgramItemType })}>
              {PROGRAM_ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROGRAM_ITEM_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jour" htmlFor="day" required>
            <Input id="day" type="date" required value={values.day} onChange={(e) => setValues({ ...values, day: e.target.value })} />
          </Field>
          <Field label="Début" htmlFor="startTime" required>
            <Input id="startTime" type="time" required value={values.startTime} onChange={(e) => setValues({ ...values, startTime: e.target.value })} />
          </Field>
          <Field label="Fin" htmlFor="endTime" required>
            <Input id="endTime" type="time" required value={values.endTime} onChange={(e) => setValues({ ...values, endTime: e.target.value })} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lieu" htmlFor="location">
            <Input id="location" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} />
          </Field>
          <Field label="Sous-thème rattaché" htmlFor="subThemeId" hint="Donne sa couleur au créneau sur le site.">
            <Select id="subThemeId" value={values.subThemeId} onChange={(e) => setValues({ ...values, subThemeId: e.target.value })}>
              <option value="">Aucun</option>
              {subThemes.map((subTheme) => (
                <option key={subTheme.id} value={subTheme.id}>
                  {subTheme.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Intervenants" htmlFor="speakers" hint="Un par ligne.">
          <Textarea id="speakers" value={values.speakers} onChange={(e) => setValues({ ...values, speakers: e.target.value })} className="min-h-[90px]" />
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
