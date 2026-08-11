/**
 * Règles de statut d'une édition.
 *
 * Elles vivent ici plutôt que dans chaque composant parce qu'elles doivent
 * donner la MÊME réponse partout : le bandeau d'accueil, l'appel à l'action de
 * bas de page, la page d'inscription et le service NestJS qui accepte ou refuse
 * la demande. Une page qui annonce « édition clôturée » en haut et « inscrivez-vous »
 * en bas ne vient jamais d'un désaccord de fond, mais d'une règle recopiée deux fois.
 */

/** Jour civil au format AAAA-MM-JJ, en UTC — Abidjan est à UTC+0, sans heure d'été. */
function toDay(value: string | Date): string {
  return (typeof value === "string" ? value : value.toISOString()).slice(0, 10);
}

export interface EditionWindow {
  registrationOpen: boolean;
  startDate: string | Date;
  endDate: string | Date;
}

/** L'édition est-elle terminée ? Le jour de clôture compte encore comme « en cours ». */
export function isEditionPast(edition: EditionWindow, now: Date = new Date()): boolean {
  return toDay(edition.endDate) < toDay(now);
}

/** L'édition n'a-t-elle pas encore commencé ? */
export function isEditionUpcoming(edition: EditionWindow, now: Date = new Date()): boolean {
  return toDay(edition.startDate) > toDay(now);
}

/**
 * Peut-on encore s'inscrire ?
 *
 * Deux conditions, et la seconde est celle qu'on oublie : le Commissariat doit
 * avoir ouvert les inscriptions ET l'édition ne doit pas être passée. Laisser le
 * seul interrupteur décider rouvrirait le formulaire d'un forum déjà tenu, dès
 * qu'on republie une ancienne édition.
 */
export function canRegister(edition: EditionWindow, now: Date = new Date()): boolean {
  return edition.registrationOpen && !isEditionPast(edition, now);
}
