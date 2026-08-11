"use client";

import { useState } from "react";
import { Check, Mail, RotateCcw, Trash2 } from "lucide-react";
import { formatDateTime, formatPhone, type ContactMessage } from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useResource } from "@/lib/use-resource";
import { Badge, Button, cx } from "@/components/ui/primitives";
import { FormAlert } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Panel, Spinner, useConfirm } from "@/components/admin/shell";
import { IconButton } from "@/components/admin/DataTable";

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "false", label: "À traiter" },
  { key: "true", label: "Traités" },
] as const;

export default function MessagesPage() {
  const [filter, setFilter] = useState<"" | "true" | "false">("false");
  const { data, loading, error, reload } = useResource<ContactMessage[]>(
    `/contact${filter ? `?handled=${filter}` : ""}`,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  async function run(action: () => Promise<unknown>, message: string) {
    setFailure(null);
    try {
      await action();
      setBanner(message);
      await reload();
    } catch (caught) {
      setFailure((caught as ApiClientError).message);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Messages reçus"
        subtitle="Formulaire de contact du site public. Marquez un message comme traité une fois la réponse envoyée."
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

      <div role="tablist" aria-label="Filtrer les messages" className="mb-6 flex gap-2">
        {FILTERS.map((entry) => (
          <button
            key={entry.key}
            role="tab"
            type="button"
            aria-selected={filter === entry.key}
            onClick={() => setFilter(entry.key)}
            className={cx(
              "rounded-full px-4 py-2 text-caption font-medium transition",
              filter === entry.key
                ? "bg-primary text-white"
                : "border border-light-border text-light-muted hover:text-primary dark:border-dark-border dark:text-dark-muted",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}

      {data && data.length === 0 && (
        <Panel>
          <p className="py-6 text-center text-light-muted dark:text-dark-muted">
            Aucun message dans cette vue.
          </p>
        </Panel>
      )}

      <ul className="space-y-4">
        {(data ?? []).map((message) => (
          <li
            key={message.id}
            className={cx(
              "rounded-md border bg-light-surface p-5 dark:bg-dark-surface",
              message.handled
                ? "border-light-border dark:border-dark-border"
                : "border-l-4 border-l-secondary border-light-border dark:border-dark-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-h3">{message.subject}</p>
                <p className="mt-1 text-caption text-light-muted dark:text-dark-muted">
                  {message.name} ·{" "}
                  <a href={`mailto:${message.email}`} className="text-primary hover:underline">
                    {message.email}
                  </a>
                  {message.phone && ` · ${formatPhone(message.phone)}`} ·{" "}
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={message.handled ? "#12B76A" : "#F59E0B"}>
                  {message.handled ? "Traité" : "À traiter"}
                </Badge>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line text-body">{message.message}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `mailto:${message.email}?subject=${encodeURIComponent(`Re : ${message.subject}`)}`,
                    "_self",
                  )
                }
              >
                <Mail className="h-4 w-4" aria-hidden /> Répondre
              </Button>
              <Button
                size="sm"
                variant={message.handled ? "ghost" : "primary"}
                onClick={() =>
                  void run(
                    () =>
                      api.patch(
                        `/contact/${message.id}/handled?value=${message.handled ? "false" : "true"}`,
                      ),
                    message.handled ? "Message rouvert." : "Message marqué comme traité.",
                  )
                }
              >
                {message.handled ? (
                  <>
                    <RotateCcw className="h-4 w-4" aria-hidden /> Rouvrir
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden /> Marquer comme traité
                  </>
                )}
              </Button>
              <div className="ml-auto">
                <IconButton
                  title="Supprimer"
                  tone="danger"
                  onClick={() =>
                    confirm("Supprimer définitivement ce message ?", () =>
                      void run(() => api.delete(`/contact/${message.id}`), "Message supprimé."),
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {dialog}
    </AdminPage>
  );
}
