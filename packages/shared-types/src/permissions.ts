/**
 * Matrice RBAC — un rôle de l'organigramme n'accède qu'aux modules qui le concernent
 * (cahier §5.8 : « ex. Responsable Financier → budget + inscriptions payantes »).
 *
 * Cette matrice est la SEULE source de vérité : l'API s'en sert dans son garde
 * `ModuleGuard`, le backoffice s'en sert pour filtrer le menu latéral. Un rôle qui
 * ne voit pas une entrée de menu est aussi refusé par l'API — jamais l'un sans l'autre.
 */
import { ROLES, type Role } from "./enums";

export const ADMIN_MODULES = [
  "stats",
  "contenu",
  "programme",
  "actualites",
  "medias",
  "inscriptions",
  "exposants",
  "sponsors",
  "organigramme",
  "budget",
  "messages",
  "rapports",
  "editions",
  "utilisateurs",
] as const;
export type AdminModule = (typeof ADMIN_MODULES)[number];

export const MODULE_LABELS: Record<AdminModule, string> = {
  stats: "Tableau de bord",
  contenu: "Contenu du site",
  programme: "Programme",
  actualites: "Actualités",
  medias: "Médiathèque",
  inscriptions: "Inscriptions",
  exposants: "Exposants & stands",
  sponsors: "Sponsors & distinctions",
  organigramme: "Organigramme",
  budget: "Budget",
  messages: "Messages reçus",
  rapports: "Rapports & exports",
  editions: "Éditions",
  utilisateurs: "Utilisateurs & rôles",
};

const ALL: AdminModule[] = [...ADMIN_MODULES];

export const ROLE_MODULES: Record<Role, AdminModule[]> = {
  SUPER_ADMIN: ALL,
  COMMISSAIRE_GENERAL: ALL,
  COMMISSAIRE_ADJOINT_1: [
    "stats",
    "contenu",
    "actualites",
    "inscriptions",
    "exposants",
    "sponsors",
    "organigramme",
    "rapports",
    "editions",
  ],
  COMMISSAIRE_ADJOINT_2: [
    "stats",
    "contenu",
    "programme",
    "actualites",
    "organigramme",
    "rapports",
  ],
  RESPONSABLE_LOGISTIQUE: ["stats", "programme", "exposants", "inscriptions", "rapports"],
  RESPONSABLE_COMMUNICATION: [
    "stats",
    "contenu",
    "programme",
    "actualites",
    "medias",
    "messages",
    "rapports",
  ],
  RESPONSABLE_PARTENARIATS_SPONSORING: [
    "stats",
    "sponsors",
    "inscriptions",
    "medias",
    "rapports",
  ],
  RESPONSABLE_EXPOSITIONS: ["stats", "exposants", "inscriptions", "medias", "rapports"],
  RESPONSABLE_ATELIERS_PANELS: ["stats", "programme", "contenu", "rapports"],
  RESPONSABLE_EVENEMENTIEL: ["stats", "programme", "inscriptions", "sponsors", "rapports"],
  RESPONSABLE_FINANCIER: [
    "stats",
    "budget",
    "inscriptions",
    "exposants",
    "sponsors",
    "rapports",
  ],
  RESPONSABLE_RH: ["stats", "organigramme", "utilisateurs", "rapports"],
  RESPONSABLE_IT: [
    "stats",
    "contenu",
    "medias",
    "utilisateurs",
    "editions",
    "rapports",
    "messages",
  ],
};

/** Un rôle peut-il ouvrir ce module ? */
export function canAccess(role: Role | null | undefined, module: AdminModule): boolean {
  if (!role) return false;
  return (ROLE_MODULES[role] ?? []).includes(module);
}

/** Modules ouverts à ce rôle, dans l'ordre canonique de `ADMIN_MODULES`. */
export function modulesFor(role: Role | null | undefined): AdminModule[] {
  if (!role) return [];
  const allowed = new Set(ROLE_MODULES[role] ?? []);
  return ADMIN_MODULES.filter((m) => allowed.has(m));
}

/** Rôles autorisés sur un module donné — utile pour documenter un endpoint. */
export function rolesWithAccess(module: AdminModule): Role[] {
  return ROLES.filter((r) => canAccess(r, module));
}
