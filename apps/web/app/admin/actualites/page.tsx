"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import {
  ARTICLE_STATUSES,
  formatDateTime,
  slugify,
  type Article,
  type ArticleStatus,
} from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Spinner, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";

const STATUS_LABELS: Record<ArticleStatus, string> = {
  BROUILLON: "Brouillon",
  PUBLIE: "Publié",
};

export default function ActualitesPage() {
  const { data, loading, error, reload } = useResource<(Article & { author?: { fullName: string } | null })[]>("/articles");
  const [editing, setEditing] = useState<Article | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  return (
    <AdminPage>
      <AdminHeader
        title="Actualités"
        subtitle="Communiqués et annonces publiés sur le site. Un brouillon n'est jamais visible du public."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Nouvel article
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

      {data && (
        <DataTable
          rows={data}
          keyOf={(row) => row.id}
          minWidth={820}
          empty="Aucun article. Publiez le premier communiqué du forum."
          columns={[
            {
              header: "Titre",
              cell: (row) => (
                <>
                  <span className="font-medium">{row.title}</span>
                  <span className="block font-mono text-caption text-light-muted dark:text-dark-muted">
                    /{row.slug}
                  </span>
                </>
              ),
            },
            {
              header: "Statut",
              cell: (row) => (
                <Badge color={row.status === "PUBLIE" ? "#12B76A" : "#F59E0B"}>
                  {STATUS_LABELS[row.status]}
                </Badge>
              ),
            },
            {
              header: "Publié le",
              cell: (row) =>
                row.publishedAt ? (
                  formatDateTime(row.publishedAt)
                ) : (
                  <span className="text-light-muted dark:text-dark-muted">—</span>
                ),
            },
            {
              header: "Auteur",
              cell: (row) => (
                <span className="text-caption text-light-muted dark:text-dark-muted">
                  {row.author?.fullName ?? "—"}
                </span>
              ),
            },
            {
              header: "Actions",
              align: "right",
              cell: (row) => (
                <RowActions>
                  {row.status === "PUBLIE" && (
                    <a
                      href={`/actualites/${row.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Voir sur le site"
                      aria-label={`Voir « ${row.title} » sur le site`}
                      className="rounded-full p-2 text-primary transition hover:bg-primary/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <IconButton title="Modifier" onClick={() => setEditing(row)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    title="Supprimer"
                    tone="danger"
                    onClick={() =>
                      confirm(`Supprimer « ${row.title} » ?`, async () => {
                        setFailure(null);
                        try {
                          await api.delete(`/articles/${row.id}`);
                          setBanner("Article supprimé.");
                          await reload();
                        } catch (caught) {
                          setFailure((caught as ApiClientError).message);
                        }
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
      )}

      {editing && (
        <ArticleModal
          article={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            setBanner(message);
            await reload();
          }}
        />
      )}

      {dialog}
    </AdminPage>
  );
}

function ArticleModal({
  article,
  onClose,
  onSaved,
}: {
  article: Article | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    coverUrl: article?.coverUrl ?? "",
    status: (article?.status ?? "BROUILLON") as ArticleStatus,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le slug se déduit du titre tant qu'il n'a pas été touché à la main : une URL
  // déjà publiée ne doit jamais changer sous les pieds des visiteurs.
  const [slugTouched, setSlugTouched] = useState(Boolean(article));

  function setTitle(title: string) {
    setValues((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : slugify(title),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (article) await api.patch(`/articles/${article.id}`, values);
      else await api.post("/articles", values);
      await onSaved(
        values.status === "PUBLIE" ? "Article publié sur le site." : "Brouillon enregistré.",
      );
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={article ? "Modifier l'article" : "Nouvel article"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <Field label="Titre" htmlFor="title" required>
          <Input id="title" required value={values.title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse de la page" htmlFor="slug" required hint="Minuscules, chiffres et tirets.">
            <Input
              id="slug"
              required
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setValues({ ...values, slug: e.target.value });
              }}
            />
          </Field>
          <Field label="Statut" htmlFor="status">
            <Select id="status" value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as ArticleStatus })}>
              {ARTICLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Chapô" htmlFor="excerpt" hint="Deux lignes maximum — affiché sur les cartes et dans les partages.">
          <Textarea id="excerpt" value={values.excerpt} onChange={(e) => setValues({ ...values, excerpt: e.target.value })} className="min-h-[80px]" />
        </Field>

        <Field label="Image de couverture" htmlFor="coverUrl" hint="URL depuis la médiathèque.">
          <Input id="coverUrl" value={values.coverUrl} onChange={(e) => setValues({ ...values, coverUrl: e.target.value })} />
        </Field>

        <Field label="Contenu" htmlFor="content" required hint="Une ligne vide sépare deux paragraphes. **texte** met en gras.">
          <Textarea id="content" required value={values.content} onChange={(e) => setValues({ ...values, content: e.target.value })} className="min-h-[260px]" />
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
