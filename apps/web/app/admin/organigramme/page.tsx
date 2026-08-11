"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ROLES, ROLE_LABELS, type OrgChartMember, type Role } from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useEdition, useEditionResource } from "@/lib/edition";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Spinner, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";

export default function OrganigrammePage() {
  const { editionPayload } = useEdition();
  const { data, loading, error, reload } = useEditionResource<OrgChartMember[]>("/org-chart");
  const [editing, setEditing] = useState<OrgChartMember | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  return (
    <AdminPage>
      <AdminHeader
        title="Organigramme"
        subtitle="Postes du Commissariat Général, missions et rôle applicatif correspondant."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Nouveau poste
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
          minWidth={880}
          empty="Aucun poste enregistré pour cette édition."
          columns={[
            { header: "#", cell: (row) => row.order + 1 },
            {
              header: "Poste",
              cell: (row) => (
                <>
                  <span className="font-medium">{row.position}</span>
                  {row.holderName && (
                    <span className="block text-caption text-primary">{row.holderName}</span>
                  )}
                </>
              ),
            },
            {
              header: "Missions",
              cell: (row) =>
                row.missions.length === 0 ? (
                  "—"
                ) : (
                  <ul className="space-y-0.5 text-caption text-light-muted dark:text-dark-muted">
                    {row.missions.map((mission) => (
                      <li key={mission}>· {mission}</li>
                    ))}
                  </ul>
                ),
            },
            {
              header: "Rôle applicatif",
              cell: (row) =>
                row.role ? (
                  <Badge>{ROLE_LABELS[row.role]}</Badge>
                ) : (
                  <span className="text-light-muted dark:text-dark-muted">Aucun</span>
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
                      confirm(`Supprimer le poste « ${row.position} » ?`, async () => {
                        setFailure(null);
                        try {
                          await api.delete(`/org-chart/${row.id}`);
                          setBanner("Poste supprimé.");
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
        <MemberModal
          member={editing === "new" ? null : editing}
          editionPayload={editionPayload()}
          nextOrder={data?.length ?? 0}
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

function MemberModal({
  member,
  editionPayload,
  nextOrder,
  onClose,
  onSaved,
}: {
  member: OrgChartMember | null;
  editionPayload: Record<string, unknown>;
  nextOrder: number;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    position: member?.position ?? "",
    holderName: member?.holderName ?? "",
    missions: (member?.missions ?? []).join("\n"),
    role: (member?.role ?? "") as Role | "",
    photoUrl: member?.photoUrl ?? "",
    order: member?.order ?? nextOrder,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...values,
      // Un rôle vide doit être omis, pas envoyé en chaîne vide : l'enum Prisma
      // rejetterait "".
      ...(values.role ? { role: values.role } : { role: undefined }),
      missions: values.missions
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
    try {
      if (member) await api.patch(`/org-chart/${member.id}`, payload);
      else await api.post("/org-chart", { ...payload, ...editionPayload });
      await onSaved(member ? "Poste mis à jour." : "Poste ajouté.");
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={member ? "Modifier le poste" : "Nouveau poste"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <Field label="Intitulé du poste" htmlFor="position" required>
          <Input id="position" required value={values.position} onChange={(e) => setValues({ ...values, position: e.target.value })} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Titulaire" htmlFor="holderName" hint="Laissez vide si non désigné.">
            <Input id="holderName" value={values.holderName} onChange={(e) => setValues({ ...values, holderName: e.target.value })} />
          </Field>
          <Field
            label="Rôle applicatif"
            htmlFor="role"
            hint="Détermine les modules accessibles au titulaire dans le back-office."
          >
            <Select id="role" value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value as Role | "" })}>
              <option value="">Aucun</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Missions" htmlFor="missions" hint="Une par ligne.">
          <Textarea id="missions" value={values.missions} onChange={(e) => setValues({ ...values, missions: e.target.value })} className="min-h-[130px]" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Photo" htmlFor="photoUrl" hint="URL depuis la médiathèque.">
            <Input id="photoUrl" value={values.photoUrl} onChange={(e) => setValues({ ...values, photoUrl: e.target.value })} />
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
