"use client";

import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  MODULE_LABELS,
  ROLES,
  ROLE_LABELS,
  formatDateTime,
  modulesFor,
  type AuthUser,
  type Role,
} from "@fihadj/shared-types";
import { api, type ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useResource } from "@/lib/use-resource";
import { Badge, Button } from "@/components/ui/primitives";
import { Field, FormAlert, Input, Select } from "@/components/ui/form";
import { AdminHeader, AdminPage, ErrorBanner, Modal, Panel, Spinner, useConfirm } from "@/components/admin/shell";
import { DataTable, IconButton, RowActions } from "@/components/admin/DataTable";

type UserRow = AuthUser & { lastLoginAt?: string | null; createdAt?: string };

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  actor: { id: string; fullName: string; role: Role } | null;
}

export default function UtilisateursPage() {
  const users = useResource<UserRow[]>("/users");
  const audit = useResource<AuditEntry[]>("/users/audit");
  const { user: me } = useAuth();
  const [editing, setEditing] = useState<UserRow | "new" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  return (
    <AdminPage>
      <AdminHeader
        title="Utilisateurs et rôles"
        subtitle="Chaque rôle de l'organigramme ouvre un ensemble précis de modules — le même côté interface et côté API."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" aria-hidden /> Nouveau compte
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

      {users.loading && <Spinner />}
      {users.error && <ErrorBanner message={users.error} />}

      {users.data && (
        <DataTable
          rows={users.data}
          keyOf={(row) => row.id}
          minWidth={900}
          empty="Aucun compte."
          columns={[
            {
              header: "Compte",
              cell: (row) => (
                <>
                  <span className="font-medium">{row.fullName}</span>
                  <span className="block text-caption text-light-muted dark:text-dark-muted">
                    {row.email}
                  </span>
                </>
              ),
            },
            { header: "Rôle", cell: (row) => <Badge>{ROLE_LABELS[row.role]}</Badge> },
            {
              header: "Modules ouverts",
              cell: (row) => (
                <span className="text-caption text-light-muted dark:text-dark-muted">
                  {modulesFor(row.role).length} sur {Object.keys(MODULE_LABELS).length}
                </span>
              ),
            },
            {
              header: "Statut",
              cell: (row) => (
                <Badge color={row.isActive ? "#12B76A" : "#DC2626"}>
                  {row.isActive ? "Actif" : "Désactivé"}
                </Badge>
              ),
            },
            {
              header: "Dernière connexion",
              cell: (row) =>
                row.lastLoginAt ? (
                  formatDateTime(row.lastLoginAt)
                ) : (
                  <span className="text-light-muted dark:text-dark-muted">Jamais</span>
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
                  {row.id !== me?.id && (
                    <IconButton
                      title="Supprimer"
                      tone="danger"
                      onClick={() =>
                        confirm(`Supprimer le compte de ${row.fullName} ?`, async () => {
                          setFailure(null);
                          try {
                            await api.delete(`/users/${row.id}`);
                            setBanner("Compte supprimé.");
                            await users.reload();
                          } catch (caught) {
                            setFailure((caught as ApiClientError).message);
                          }
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  )}
                </RowActions>
              ),
            },
          ]}
        />
      )}

      <Panel title="Journal d'audit" className="mt-8">
        <p className="mb-4 text-caption text-light-muted dark:text-dark-muted">
          Les cent dernières actions sensibles : validations d&apos;inscription, écritures
          budgétaires, changements de rôle, connexions.
        </p>
        {audit.loading && <Spinner />}
        {audit.error && <ErrorBanner message={audit.error} />}
        {audit.data && (
          <DataTable
            rows={audit.data.slice(0, 40)}
            keyOf={(row) => row.id}
            minWidth={700}
            empty="Aucune action journalisée."
            columns={[
              { header: "Quand", cell: (row) => formatDateTime(row.createdAt) },
              {
                header: "Qui",
                cell: (row) =>
                  row.actor ? (
                    <>
                      <span>{row.actor.fullName}</span>
                      <span className="block text-caption text-light-muted dark:text-dark-muted">
                        {ROLE_LABELS[row.actor.role]}
                      </span>
                    </>
                  ) : (
                    <span className="text-light-muted dark:text-dark-muted">Public</span>
                  ),
              },
              { header: "Action", cell: (row) => <span className="font-mono text-caption">{row.action}</span> },
              { header: "Objet", cell: (row) => row.entity },
            ]}
          />
        )}
      </Panel>

      {editing && (
        <UserModal
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async (message) => {
            setEditing(null);
            setBanner(message);
            await Promise.all([users.reload(), audit.reload()]);
          }}
        />
      )}

      {dialog}
    </AdminPage>
  );
}

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    password: "",
    role: (user?.role ?? "RESPONSABLE_COMMUNICATION") as Role,
    phone: user?.phone ?? "",
    isActive: user?.isActive ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantedModules = modulesFor(values.role);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (user) {
        // Un mot de passe vide signifie « ne pas changer », pas « effacer ».
        const { password, ...rest } = values;
        await api.patch(`/users/${user.id}`, password ? values : rest);
      } else {
        await api.post("/users", values);
      }
      await onSaved(
        user ? "Compte mis à jour." : "Compte créé — les identifiants ont été envoyés par email.",
      );
    } catch (caught) {
      setError((caught as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={user ? "Modifier le compte" : "Nouveau compte"} width="lg">
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" htmlFor="fullName" required>
            <Input id="fullName" required value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })} />
          </Field>
          <Field label="Adresse email" htmlFor="email" required>
            <Input id="email" type="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={user ? "Nouveau mot de passe" : "Mot de passe provisoire"}
            htmlFor="password"
            required={!user}
            hint={user ? "Laissez vide pour ne pas le changer." : "8 caractères minimum, envoyé par email."}
          >
            <Input
              id="password"
              type="text"
              minLength={8}
              required={!user}
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
            />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />
          </Field>
        </div>

        <Field label="Rôle" htmlFor="role" required>
          <Select id="role" value={values.role} onChange={(e) => setValues({ ...values, role: e.target.value as Role })}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </Field>

        {/* Le rôle est abstrait ; la liste des modules qu'il ouvre ne l'est pas.
            L'afficher évite d'attribuer un rôle « au jugé ». */}
        <div className="rounded-md border border-light-border p-4 dark:border-dark-border">
          <p className="flex items-center gap-2 text-caption font-medium">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            Ce rôle ouvre {grantedModules.length} module{grantedModules.length > 1 ? "s" : ""}
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {grantedModules.map((module) => (
              <li
                key={module}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
              >
                {MODULE_LABELS[module]}
              </li>
            ))}
          </ul>
        </div>

        {user && (
          <Field label="Statut" htmlFor="isActive">
            <Select
              id="isActive"
              value={values.isActive ? "actif" : "inactif"}
              onChange={(e) => setValues({ ...values, isActive: e.target.value === "actif" })}
            >
              <option value="actif">Actif</option>
              <option value="inactif">Désactivé — les sessions ouvertes sont coupées</option>
            </Select>
          </Field>
        )}

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
