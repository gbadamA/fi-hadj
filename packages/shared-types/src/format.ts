/**
 * Helpers de présentation purs — utilisés par le site, le backoffice, les PDF
 * et les emails. Aucun accès réseau, aucun DOM : testables et réutilisables partout.
 */
import { CIVILITY_LABELS, type Civility } from "./enums";

const FR = "fr-FR";

/** Franc CFA — pas de décimales, séparateur d'espace insécable. */
export function formatMoney(amount: number, currency = "XOF"): string {
  const fractionDigits = currency === "XOF" ? 0 : 2;
  return new Intl.NumberFormat(FR, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(FR).format(value);
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** « 13 décembre 2025 » */
export function formatDateLong(value: string | Date): string {
  return new Intl.DateTimeFormat(FR, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(toDate(value));
}

/** « 13/12/2025 » */
export function formatDateShort(value: string | Date): string {
  return new Intl.DateTimeFormat(FR, { dateStyle: "short", timeZone: "UTC" }).format(
    toDate(value),
  );
}

/** « 13/12/2025 à 14:30 » — heure locale d'Abidjan (UTC+0, pas de changement d'heure). */
export function formatDateTime(value: string | Date): string {
  const d = toDate(value);
  return `${formatDateShort(d)} à ${new Intl.DateTimeFormat(FR, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d)}`;
}

/**
 * Plage de dates de l'événement, en évitant la répétition inutile :
 * « 13 et 14 décembre 2025 » plutôt que « 13 décembre 2025 – 14 décembre 2025 ».
 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  const a = toDate(start);
  const b = toDate(end);
  const sameMonth =
    a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
  if (a.getTime() === b.getTime()) return formatDateLong(a);
  if (sameMonth) {
    const consecutive = b.getUTCDate() - a.getUTCDate() === 1;
    const joiner = consecutive ? " et " : " – ";
    return `${a.getUTCDate()}${joiner}${formatDateLong(b)}`;
  }
  return `${formatDateLong(a)} – ${formatDateLong(b)}`;
}

/** « 09:00 – 10:30 » */
export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/** Nom protocolaire complet : « S.E. Vazoumana TOURÉ ». */
export function formatFullName(
  civility: Civility | null | undefined,
  firstName: string,
  lastName: string,
): string {
  const title = civility ? `${CIVILITY_LABELS[civility]} ` : "";
  return `${title}${firstName} ${lastName.toUpperCase()}`.trim();
}

/**
 * Téléphone ivoirien lisible : « +225 07 07 07 07 07 ».
 * Les numéros étrangers sont laissés tels quels — chaque pays a son découpage.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/[^\d+]/g, "");
  const ci = digits.replace(/^\+?225/, "");
  if (/^\d{10}$/.test(ci)) {
    return `+225 ${ci.replace(/(\d{2})(?=\d)/g, "$1 ").trim()}`;
  }
  return raw;
}

/** Slug d'article : accents retirés, tout en minuscules, tirets simples. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // signes diacritiques isoles par NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

/**
 * Référence d'inscription lisible et communicable au guichet : « FIH-2025-P-0042 ».
 * Le type est encodé pour que l'accueil trie sans ouvrir le dossier.
 */
export function buildRegistrationReference(
  year: number,
  type: "PARTICIPANT" | "EXPOSANT" | "SPONSOR",
  sequence: number,
): string {
  const letter = { PARTICIPANT: "P", EXPOSANT: "E", SPONSOR: "S" }[type];
  return `FIH-${year}-${letter}-${String(sequence).padStart(4, "0")}`;
}
