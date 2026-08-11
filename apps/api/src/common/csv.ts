/**
 * Génération CSV destinée à Excel francophone.
 *
 * Deux détails non négociables, appris à la dure :
 *  - le séparateur est le point-virgule (Excel FR lit la virgule comme décimale) ;
 *  - le fichier commence par un BOM UTF-8, sans quoi « Côte d'Ivoire » s'affiche
 *    « CÃ´te d'Ivoire ».
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

const BOM = "\uFEFF";

function escapeCell(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  const text = String(raw);
  // Les guillemets, points-virgules et sauts de ligne imposent la mise entre
  // guillemets, avec doublement des guillemets internes.
  if (/[";\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(";");
  const body = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(";"));
  return BOM + [head, ...body].join("\r\n");
}

/** Nom de fichier daté et sans espace, exploitable tel quel dans un dossier partagé. */
export function csvFileName(prefix: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}
