"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Copy, FileText, Trash2, Upload } from "lucide-react";
import { MEDIA_TYPES, formatDateTime, type MediaAsset, type MediaType } from "@fihadj/shared-types";
import { API_URL, api, apiRequest, type ApiClientError } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Panel, Spinner, useConfirm } from "@/components/admin/shell";

const TYPE_LABELS: Record<MediaType, string> = {
  LOGO: "Logo",
  IMAGE: "Visuel",
  DOCUMENT: "Document",
  GALERIE: "Galerie",
};

export default function MediasPage() {
  const { data, loading, error, reload } = useResource<MediaAsset[]>("/media");
  const [type, setType] = useState<MediaType>("LOGO");
  const [caption, setCaption] = useState("");
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirm();

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setFailure("Sélectionnez un fichier.");
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const query = new URLSearchParams({ type });
      if (caption.trim()) query.set("caption", caption.trim());
      if (section.trim()) query.set("section", section.trim());

      await apiRequest(`/media/upload?${query.toString()}`, { method: "POST", body: form });
      setBanner(`« ${file.name} » téléversé.`);
      setCaption("");
      setSection("");
      if (fileInput.current) fileInput.current.value = "";
      await reload();
    } catch (caught) {
      setFailure((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Médiathèque"
        subtitle="Logos, visuels et documents. Copiez l'URL d'un fichier pour l'utiliser dans une fiche sponsor, exposant ou article."
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

      <Panel title="Téléverser un fichier" className="mb-6">
        <form onSubmit={upload} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field label="Fichier" htmlFor="file" required hint="PNG, JPEG, WebP, SVG ou PDF · 8 Mo max">
            <input
              ref={fileInput}
              id="file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
              className="w-full text-caption file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-caption file:text-white"
            />
          </Field>
          <Field label="Nature" htmlFor="mediaType">
            <Select id="mediaType" value={type} onChange={(e) => setType(e.target.value as MediaType)}>
              {MEDIA_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Légende" htmlFor="caption">
            <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Field label="Section" htmlFor="section" hint="sponsors, galerie…">
            <Input id="section" value={section} onChange={(e) => setSection(e.target.value)} />
          </Field>
          <Button type="submit" disabled={busy}>
            <Upload className="h-4 w-4" aria-hidden />
            {busy ? "Envoi…" : "Téléverser"}
          </Button>
        </form>
      </Panel>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}

      {data && data.length === 0 && (
        <Panel>
          <p className="py-6 text-center text-light-muted dark:text-dark-muted">
            La médiathèque est vide.
          </p>
        </Panel>
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((asset) => (
            <li
              key={asset.id}
              className="lift overflow-hidden rounded-md border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-light-surface-alt dark:bg-dark-surface-alt">
                {asset.mimeType?.startsWith("image/") ? (
                  <Image
                    src={asset.url}
                    alt={asset.caption ?? ""}
                    width={320}
                    height={240}
                    className="h-full w-full object-contain p-3"
                    unoptimized={asset.mimeType === "image/svg+xml"}
                  />
                ) : (
                  <FileText className="h-10 w-10 text-light-muted dark:text-dark-muted" aria-hidden />
                )}
              </div>
              <div className="p-4">
                <p className="truncate text-caption font-medium">
                  {asset.caption || asset.fileName || TYPE_LABELS[asset.type]}
                </p>
                <p className="mt-0.5 text-caption text-light-muted dark:text-dark-muted">
                  {TYPE_LABELS[asset.type]}
                  {asset.section ? ` · ${asset.section}` : ""} · {formatDateTime(asset.createdAt)}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(asset.url);
                      setBanner("URL copiée dans le presse-papiers.");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-caption text-primary transition hover:bg-primary/10"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden /> Copier l&apos;URL
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    aria-label={`Supprimer ${asset.fileName ?? "le fichier"}`}
                    onClick={() =>
                      confirm("Supprimer ce fichier ? Les fiches qui l'utilisent perdront leur visuel.", async () => {
                        setFailure(null);
                        try {
                          await api.delete(`/media/${asset.id}`);
                          setBanner("Fichier supprimé.");
                          await reload();
                        } catch (caught) {
                          setFailure((caught as ApiClientError).message);
                        }
                      })
                    }
                    className="ml-auto rounded-full p-2 text-light-muted transition hover:bg-danger/10 hover:text-danger dark:text-dark-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-caption text-light-muted dark:text-dark-muted">
        Les fichiers sont servis par l&apos;API depuis {API_URL}/uploads.
      </p>

      {dialog}
    </AdminPage>
  );
}
