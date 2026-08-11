"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  OBJECTIVE_TYPES,
  formatNumber,
  type ExpectedResult,
  type ImpactProjection,
  type Objective,
  type ObjectiveType,
  type Promoter,
  type SubTheme,
  type TargetCategory,
} from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { useResource } from "@/lib/use-resource";
import { Badge, Button, cx } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";
import type { SiteContentBlock } from "@/lib/types";

const TABS = [
  { key: "blocs", label: "Blocs de texte" },
  { key: "promoteurs", label: "Promoteurs" },
  { key: "objectifs", label: "Objectifs" },
  { key: "resultats", label: "Résultats attendus" },
  { key: "theme", label: "Thème & sous-thèmes" },
  { key: "cibles", label: "Cibles" },
  { key: "impact", label: "Projections d'impact" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ContenuPage() {
  const [tab, setTab] = useState<TabKey>("blocs");
  const [banner, setBanner] = useState<string | null>(null);

  return (
    <AdminPage>
      <AdminHeader
        title="Contenu du site"
        subtitle="Tout ce que le site public affiche est modifiable ici, sans déploiement."
      />

      {banner && (
        <div className="mb-4">
          <FormAlert tone="success" title={banner} />
        </div>
      )}

      <div role="tablist" aria-label="Sections de contenu" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            role="tab"
            type="button"
            aria-selected={tab === entry.key}
            onClick={() => setTab(entry.key)}
            className={cx(
              "rounded-full px-4 py-2 text-caption font-medium transition",
              tab === entry.key
                ? "bg-primary text-white"
                : "border border-light-border text-light-muted hover:text-primary dark:border-dark-border dark:text-dark-muted",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "blocs" && <BlocksSection onDone={setBanner} />}
      {tab === "promoteurs" && <PromotersSection onDone={setBanner} />}
      {tab === "objectifs" && <ObjectivesSection onDone={setBanner} />}
      {tab === "resultats" && <ResultsSection onDone={setBanner} />}
      {tab === "theme" && <ThemeSection onDone={setBanner} />}
      {tab === "cibles" && <TargetsSection onDone={setBanner} />}
      {tab === "impact" && <ImpactSection onDone={setBanner} />}
    </AdminPage>
  );
}

type DoneHandler = (message: string) => void;

/* ─────────────────────────── Blocs de texte ─────────────────────────── */

function BlocksSection({ onDone }: { onDone: DoneHandler }) {
  const { data, loading, error, reload } = useResource<SiteContentBlock[]>("/site-content");
  const [editing, setEditing] = useState<SiteContentBlock | null>(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((block) => (
          <Panel
            key={block.id}
            title={block.title}
            actions={
              <IconButton title="Modifier" onClick={() => setEditing(block)}>
                <Pencil className="h-4 w-4" />
              </IconButton>
            }
          >
            <p className="mb-2 font-mono text-caption text-light-muted dark:text-dark-muted">
              clé : {block.key}
            </p>
            <p className="line-clamp-6 whitespace-pre-line text-caption text-light-muted dark:text-dark-muted">
              {block.body}
            </p>
          </Panel>
        ))}
      </div>

      {editing && (
        <BlockModal
          block={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            onDone("Bloc de contenu enregistré.");
            await reload();
          }}
        />
      )}
    </>
  );
}

function BlockModal({
  block,
  onClose,
  onSaved,
}: {
  block: SiteContentBlock;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(block.title);
  const [body, setBody] = useState(block.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.put(`/site-content/${block.key}`, { title, body });
      await onSaved();
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Modifier « ${block.title} »`} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label="Titre" htmlFor="title" required>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field
          label="Contenu"
          htmlFor="body"
          required
          hint="Une ligne vide sépare deux paragraphes. **texte** met en gras."
        >
          <Textarea id="body" required value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[320px] font-mono text-caption" />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden />
            {busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────── Promoteurs ─────────────────────────── */

function PromotersSection({ onDone }: { onDone: DoneHandler }) {
  const { data, loading, error, reload } = useResource<Promoter[]>("/promoters");
  const [editing, setEditing] = useState<Promoter | "new" | null>(null);
  const { confirm, dialog } = useConfirm();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <Panel
        title="Promoteurs du forum"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        }
      >
        <DataTable
          rows={data ?? []}
          keyOf={(row) => row.id}
          minWidth={700}
          empty="Aucun promoteur enregistré."
          columns={[
            { header: "Sigle", cell: (row) => <span className="font-medium">{row.acronym}</span> },
            { header: "Dénomination", cell: (row) => row.name },
            {
              header: "Description",
              cell: (row) => (
                <span className="line-clamp-2 text-caption text-light-muted dark:text-dark-muted">
                  {row.description}
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
                    onClick={() =>
                      confirm(`Supprimer le promoteur « ${row.acronym} » ?`, async () => {
                        await api.delete(`/promoters/${row.id}`);
                        onDone("Promoteur supprimé.");
                        await reload();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      </Panel>

      {editing && (
        <PromoterModal
          promoter={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            onDone(message);
            await reload();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function PromoterModal({
  promoter,
  onClose,
  onSaved,
}: {
  promoter: Promoter | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    acronym: promoter?.acronym ?? "",
    name: promoter?.name ?? "",
    description: promoter?.description ?? "",
    logoUrl: promoter?.logoUrl ?? "",
    websiteUrl: promoter?.websiteUrl ?? "",
    order: promoter?.order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (promoter) await api.patch(`/promoters/${promoter.id}`, values);
      else await api.post("/promoters", values);
      await onSaved(promoter ? "Promoteur mis à jour." : "Promoteur ajouté.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={promoter ? "Modifier le promoteur" : "Nouveau promoteur"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <Field label="Sigle" htmlFor="acronym" required>
            <Input id="acronym" required value={values.acronym} onChange={(e) => setValues({ ...values, acronym: e.target.value })} />
          </Field>
          <Field label="Dénomination complète" htmlFor="name" required>
            <Input id="name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" required>
          <Textarea id="description" required value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="URL du logo" htmlFor="logoUrl">
            <Input id="logoUrl" value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} />
          </Field>
          <Field label="Site web" htmlFor="websiteUrl">
            <Input id="websiteUrl" value={values.websiteUrl} onChange={(e) => setValues({ ...values, websiteUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Ordre" htmlFor="order">
            <Input id="order" type="number" min={0} value={values.order} onChange={(e) => setValues({ ...values, order: Number(e.target.value) })} />
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

/* ─────────────────────────── Objectifs ─────────────────────────── */

function ObjectivesSection({ onDone }: { onDone: DoneHandler }) {
  const { editionPayload } = useEdition();
  const { data, loading, error, reload } = useEditionResource<Objective[]>("/objectives");
  const [editing, setEditing] = useState<Objective | "new" | null>(null);
  const { confirm, dialog } = useConfirm();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <Panel
        title="Objectifs du forum"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        }
      >
        <p className="mb-4 text-caption text-light-muted dark:text-dark-muted">
          Le cahier des charges annonce 1 objectif général et 8 objectifs spécifiques. Les huit
          énoncés actuels ont été déduits des sous-thèmes : ils sont à relire face à la présentation
          officielle.
        </p>
        <DataTable
          rows={data ?? []}
          keyOf={(row) => row.id}
          minWidth={640}
          empty="Aucun objectif enregistré."
          columns={[
            {
              header: "Type",
              cell: (row) => (
                <Badge color={row.type === "GENERAL" ? "#C9A227" : "#2E7CB8"}>
                  {row.type === "GENERAL" ? "Général" : "Spécifique"}
                </Badge>
              ),
            },
            { header: "Énoncé", cell: (row) => row.text },
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
                      confirm("Supprimer cet objectif ?", async () => {
                        await api.delete(`/objectives/${row.id}`);
                        onDone("Objectif supprimé.");
                        await reload();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      </Panel>

      {editing && (
        <ObjectiveModal
          objective={editing === "new" ? null : editing}
          editionPayload={editionPayload()}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            onDone(message);
            await reload();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function ObjectiveModal({
  objective,
  editionPayload,
  onClose,
  onSaved,
}: {
  objective: Objective | null;
  editionPayload: Record<string, unknown>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    type: (objective?.type ?? "SPECIFIQUE") as ObjectiveType,
    text: objective?.text ?? "",
    order: objective?.order ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (objective) await api.patch(`/objectives/${objective.id}`, values);
      else await api.post("/objectives", { ...values, ...editionPayload });
      await onSaved(objective ? "Objectif mis à jour." : "Objectif ajouté.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={objective ? "Modifier l'objectif" : "Nouvel objectif"}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="objType">
            <Select id="objType" value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as ObjectiveType })}>
              {OBJECTIVE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "GENERAL" ? "Objectif général" : "Objectif spécifique"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ordre" htmlFor="objOrder">
            <Input id="objOrder" type="number" min={0} value={values.order} onChange={(e) => setValues({ ...values, order: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Énoncé" htmlFor="objText" required>
          <Textarea id="objText" required value={values.text} onChange={(e) => setValues({ ...values, text: e.target.value })} />
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

/* ─────────────────────────── Résultats attendus ─────────────────────────── */

function ResultsSection({ onDone }: { onDone: DoneHandler }) {
  const { editionPayload } = useEdition();
  const { data, loading, error, reload } = useEditionResource<ExpectedResult[]>("/expected-results");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setFailure(null);
    try {
      await api.post("/expected-results", {
        text: draft.trim(),
        order: data?.length ?? 0,
        ...editionPayload,
      });
      setDraft("");
      onDone("Résultat attendu ajouté.");
      await reload();
    } catch (caught) {
      setFailure((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Panel title="Résultats attendus">
        {failure && <ErrorBanner message={failure} />}
        <ul className="mb-6 space-y-2">
          {(data ?? []).map((result) => (
            <li
              key={result.id}
              className="flex items-start justify-between gap-4 rounded-md border border-light-border p-3 dark:border-dark-border"
            >
              <span className="text-body">{result.text}</span>
              <IconButton
                title="Supprimer"
                tone="danger"
                onClick={() =>
                  confirm("Supprimer ce résultat attendu ?", async () => {
                    await api.delete(`/expected-results/${result.id}`);
                    onDone("Résultat attendu supprimé.");
                    await reload();
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </li>
          ))}
        </ul>

        <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Ajouter un résultat attendu" htmlFor="newResult" className="flex-1">
            <Input id="newResult" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <Button type="submit" disabled={busy || !draft.trim()}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        </form>
      </Panel>
      {dialog}
    </>
  );
}

/* ─────────────────────────── Thème & sous-thèmes ─────────────────────────── */

interface ThemeResponse {
  id: string;
  title: string;
  description: string | null;
  subThemes: SubTheme[];
}

const COLOR_KEYS = [
  { key: "organisation", label: "Organisation (bleu)" },
  { key: "interculturalite", label: "Interculturalité (azur)" },
  { key: "fluxSanitaire", label: "Flux & sanitaire (émeraude)" },
  { key: "diplomatieEconomique", label: "Diplomatie économique (or)" },
];

function ThemeSection({ onDone }: { onDone: DoneHandler }) {
  const { editionPayload } = useEdition();
  const { data, loading, error, reload } = useEditionResource<ThemeResponse>("/themes");
  const [title, setTitle] = useState<string | null>(null);
  const [editing, setEditing] = useState<SubTheme | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  const currentTitle = title ?? data?.title ?? "";

  async function saveTheme(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailure(null);
    try {
      await api.post("/themes", {
        title: currentTitle,
        description: data?.description ?? "",
        ...editionPayload,
      });
      onDone("Thème enregistré.");
      await reload();
    } catch (caught) {
      setFailure((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Panel title="Thème général" className="mb-6">
        {failure && <ErrorBanner message={failure} />}
        <form onSubmit={saveTheme} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label="Intitulé du thème" htmlFor="themeTitle" className="flex-1">
            <Input id="themeTitle" value={currentTitle} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden /> Enregistrer
          </Button>
        </form>
      </Panel>

      <Panel
        title={`Sous-thèmes (${data?.subThemes.length ?? 0})`}
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        }
      >
        <DataTable
          rows={data?.subThemes ?? []}
          keyOf={(row) => row.id}
          minWidth={720}
          empty="Aucun sous-thème."
          columns={[
            { header: "#", cell: (row) => row.order + 1 },
            { header: "Titre", cell: (row) => <span className="font-medium">{row.title}</span> },
            {
              header: "Couleur",
              cell: (row) => (
                <span className="text-caption text-light-muted dark:text-dark-muted">
                  {COLOR_KEYS.find((c) => c.key === row.colorKey)?.label ?? row.colorKey ?? "—"}
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
                    onClick={() =>
                      confirm(`Supprimer le sous-thème « ${row.title} » ?`, async () => {
                        await api.delete(`/sub-themes/${row.id}`);
                        onDone("Sous-thème supprimé.");
                        await reload();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      </Panel>

      {editing && (
        <SubThemeModal
          subTheme={editing === "new" ? null : editing}
          editionPayload={editionPayload()}
          nextOrder={data?.subThemes.length ?? 0}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            onDone(message);
            await reload();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function SubThemeModal({
  subTheme,
  editionPayload,
  nextOrder,
  onClose,
  onSaved,
}: {
  subTheme: SubTheme | null;
  editionPayload: Record<string, unknown>;
  nextOrder: number;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    title: subTheme?.title ?? "",
    description: subTheme?.description ?? "",
    colorKey: subTheme?.colorKey ?? "organisation",
    order: subTheme?.order ?? nextOrder,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (subTheme) await api.patch(`/sub-themes/${subTheme.id}`, values);
      else await api.post("/sub-themes", { ...values, ...editionPayload });
      await onSaved(subTheme ? "Sous-thème mis à jour." : "Sous-thème ajouté.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={subTheme ? "Modifier le sous-thème" : "Nouveau sous-thème"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label="Titre" htmlFor="stTitle" required>
          <Input id="stTitle" required value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} />
        </Field>
        <Field label="Description" htmlFor="stDescription">
          <Textarea id="stDescription" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Couleur du panel" htmlFor="stColor" hint="Définie dans les design tokens.">
            <Select id="stColor" value={values.colorKey} onChange={(e) => setValues({ ...values, colorKey: e.target.value })}>
              {COLOR_KEYS.map((color) => (
                <option key={color.key} value={color.key}>
                  {color.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ordre" htmlFor="stOrder">
            <Input id="stOrder" type="number" min={0} value={values.order} onChange={(e) => setValues({ ...values, order: Number(e.target.value) })} />
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

/* ─────────────────────────── Cibles ─────────────────────────── */

function TargetsSection({ onDone }: { onDone: DoneHandler }) {
  const { data, loading, error, reload } = useResource<TargetCategory[]>("/target-categories");
  const [editing, setEditing] = useState<TargetCategory | "new" | null>(null);
  const { confirm, dialog } = useConfirm();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <Panel
        title={`Catégories de cible (${data?.length ?? 0})`}
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter
          </Button>
        }
      >
        <DataTable
          rows={data ?? []}
          keyOf={(row) => row.id}
          minWidth={760}
          empty="Aucune catégorie."
          columns={[
            { header: "Catégorie", cell: (row) => <span className="font-medium">{row.name}</span> },
            {
              header: "Sous-catégories",
              cell: (row) => (
                <span className="text-caption text-light-muted dark:text-dark-muted">
                  {row.subCategories.join(" · ") || "—"}
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
                    onClick={() =>
                      confirm(`Supprimer « ${row.name} » ?`, async () => {
                        await api.delete(`/target-categories/${row.id}`);
                        onDone("Catégorie supprimée.");
                        await reload();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      </Panel>

      {editing && (
        <TargetModal
          category={editing === "new" ? null : editing}
          nextOrder={data?.length ?? 0}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            onDone(message);
            await reload();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function TargetModal({
  category,
  nextOrder,
  onClose,
  onSaved,
}: {
  category: TargetCategory | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    name: category?.name ?? "",
    description: category?.description ?? "",
    subCategories: (category?.subCategories ?? []).join("\n"),
    order: category?.order ?? nextOrder,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...values,
      subCategories: values.subCategories
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    try {
      if (category) await api.patch(`/target-categories/${category.id}`, payload);
      else await api.post("/target-categories", payload);
      await onSaved(category ? "Catégorie mise à jour." : "Catégorie ajoutée.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={category ? "Modifier la catégorie" : "Nouvelle catégorie"}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <Field label="Nom" htmlFor="catName" required>
          <Input id="catName" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        </Field>
        <Field label="Description" htmlFor="catDescription">
          <Textarea id="catDescription" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>
        <Field label="Sous-catégories" htmlFor="catSubs" hint="Une par ligne.">
          <Textarea id="catSubs" value={values.subCategories} onChange={(e) => setValues({ ...values, subCategories: e.target.value })} />
        </Field>
        <Field label="Ordre" htmlFor="catOrder">
          <Input id="catOrder" type="number" min={0} value={values.order} onChange={(e) => setValues({ ...values, order: Number(e.target.value) })} />
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

/* ─────────────────────────── Projections d'impact ─────────────────────────── */

function ImpactSection({ onDone }: { onDone: DoneHandler }) {
  const { data, loading, error, reload } = useResource<ImpactProjection[]>("/impact-projections");
  const [editing, setEditing] = useState<ImpactProjection | "new" | null>(null);
  const { confirm, dialog } = useConfirm();

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <>
      <Panel
        title="Projections d'impact"
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Ajouter une année
          </Button>
        }
      >
        <p className="mb-4 text-caption text-light-muted dark:text-dark-muted">
          Les chiffres 2025 viennent du cahier des charges. Ceux de 2026 à 2028 sont une hypothèse
          de croissance à valider par le Commissariat Général.
        </p>
        <DataTable
          rows={data ?? []}
          keyOf={(row) => row.id}
          minWidth={760}
          empty="Aucune projection."
          columns={[
            { header: "Année", cell: (row) => <span className="font-display font-bold text-primary">{row.year}</span> },
            { header: "Sur place", align: "right", cell: (row) => formatNumber(row.onSite) },
            { header: "En ligne", align: "right", cell: (row) => formatNumber(row.online) },
            { header: "Formés", align: "right", cell: (row) => formatNumber(row.trained) },
            { header: "Emplois directs", align: "right", cell: (row) => formatNumber(row.directJobs) },
            { header: "Emplois indirects", align: "right", cell: (row) => formatNumber(row.indirectJobs) },
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
                      confirm(`Supprimer la projection ${row.year} ?`, async () => {
                        await api.delete(`/impact-projections/${row.id}`);
                        onDone("Projection supprimée.");
                        await reload();
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </RowActions>
              ),
            },
          ]}
        />
      </Panel>

      {editing && (
        <ImpactModal
          projection={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            onDone(message);
            await reload();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function ImpactModal({
  projection,
  onClose,
  onSaved,
}: {
  projection: ImpactProjection | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    year: projection?.year ?? new Date().getFullYear(),
    onSite: projection?.onSite ?? 0,
    online: projection?.online ?? 0,
    trained: projection?.trained ?? 0,
    directJobs: projection?.directJobs ?? 0,
    indirectJobs: projection?.indirectJobs ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: [keyof typeof values, string][] = [
    ["year", "Année"],
    ["onSite", "Visiteurs sur place"],
    ["online", "Visiteurs en ligne"],
    ["trained", "Personnes formées"],
    ["directJobs", "Emplois directs"],
    ["indirectJobs", "Emplois indirects"],
  ];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // L'API fait un upsert sur l'année : le même endpoint crée et met à jour.
      await api.post("/impact-projections", values);
      await onSaved(projection ? "Projection mise à jour." : "Projection ajoutée.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={projection ? `Projection ${projection.year}` : "Nouvelle projection"}>
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key} required>
              <Input
                id={key}
                type="number"
                min={0}
                required
                value={values[key]}
                onChange={(e) => setValues({ ...values, [key]: Number(e.target.value) })}
              />
            </Field>
          ))}
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
