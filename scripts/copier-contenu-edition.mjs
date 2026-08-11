/**
 * Recopie d'une édition à l'autre le contenu qui se reconduit d'une année sur l'autre.
 *
 * Le Commissariat Général garde sa structure et ses objectifs ; seuls le thème,
 * les sous-thèmes qui en découlent, le programme et les distinctions changent.
 * Ressaisir les premiers à la main chaque année serait absurde.
 *
 *   node scripts/copier-contenu-edition.mjs                                  # 2025 → 2026, tout
 *   node scripts/copier-contenu-edition.mjs 2025 2026 objectifs
 *   node scripts/copier-contenu-edition.mjs 2026 2027 organigramme objectifs resultats
 *
 * ⚠️ CE QUI N'EST VOLONTAIREMENT PAS COPIABLE ICI :
 *  - les **sous-thèmes**, qui sont la déclinaison du thème de l'édition : les
 *    reprendre tels quels avec un thème différent produirait un programme incohérent ;
 *  - le **programme** et les **distinctions**, propres à chaque édition ;
 *  - les **sponsors**, qui se renégocient.
 *
 * ⚠️ Les **catégories de cible**, **promoteurs**, **projections d'impact** et
 * **blocs de texte** n'ont pas d'`editionId` : ils sont permanents et déjà
 * partagés par toutes les éditions. Il n'y a rien à y copier.
 *
 * Le script est IDEMPOTENT : ce qui existe déjà dans l'édition cible est ignoré,
 * jamais dupliqué. On peut le relancer sans crainte.
 */
const API = process.env.API_URL ?? "http://localhost:3051";
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@fi-hadj.ci";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "fihadj2025";

/**
 * Chaque type déclare : où lire, où écrire, comment reconnaître un doublon, et
 * comment transformer une entrée source en corps de création.
 */
const TYPES = {
  organigramme: {
    label: "postes de l'organigramme",
    path: "/org-chart",
    identity: (item) => item.position,
    payload: (item) => ({
      position: item.position,
      missions: item.missions ?? [],
      order: item.order,
      // `role` et `photoUrl` sont des champs optionnels typés : les envoyer à
      // `null` ferait échouer la validation Zod, il faut les OMETTRE.
      ...(item.holderName ? { holderName: item.holderName } : {}),
      ...(item.role ? { role: item.role } : {}),
      ...(item.photoUrl ? { photoUrl: item.photoUrl } : {}),
    }),
    note: (items) =>
      items.some((item) => item.userId)
        ? "Le rattachement d'un poste à un COMPTE utilisateur n'est pas recopié : l'API ne l'expose pas en écriture. Le rôle applicatif, lui, est bien repris."
        : null,
  },
  objectifs: {
    label: "objectifs",
    path: "/objectives",
    identity: (item) => item.text,
    payload: (item) => ({ type: item.type, text: item.text, order: item.order }),
  },
  resultats: {
    label: "résultats attendus",
    path: "/expected-results",
    identity: (item) => item.text,
    payload: (item) => ({ text: item.text, order: item.order }),
  },
};

const [, , rawSource, rawTarget, ...rawTypes] = process.argv;
const sourceYear = Number(rawSource ?? 2025);
const targetYear = Number(rawTarget ?? 2026);
const selected = rawTypes.length > 0 ? rawTypes : Object.keys(TYPES);

async function main() {
  const unknown = selected.filter((type) => !TYPES[type]);
  if (unknown.length > 0) {
    throw new Error(
      `Type inconnu : ${unknown.join(", ")}. Attendus : ${Object.keys(TYPES).join(", ")}.`,
    );
  }

  const editions = await get("/editions");
  const source = editions.find((edition) => edition.year === sourceYear);
  const target = editions.find((edition) => edition.year === targetYear);
  if (!source) throw new Error(`Édition source ${sourceYear} introuvable.`);
  if (!target) throw new Error(`Édition cible ${targetYear} introuvable.`);
  if (source.id === target.id) throw new Error("Source et cible sont la même édition.");

  const token = await login();
  console.log(`\nCopie ${sourceYear} → ${targetYear}`);

  const notes = [];

  for (const key of selected) {
    const type = TYPES[key];
    const from = await get(`${type.path}?editionId=${source.id}`);
    const existing = await get(`${type.path}?editionId=${target.id}`);
    const alreadyThere = new Set(existing.map(type.identity));

    let copied = 0;
    let skipped = 0;

    for (const item of from) {
      if (alreadyThere.has(type.identity(item))) {
        skipped++;
        continue;
      }
      await post(type.path, { ...type.payload(item), editionId: target.id }, token);
      copied++;
    }

    console.log(
      `  · ${type.label.padEnd(28)} ${String(copied).padStart(2)} copié(s), ${skipped} ignoré(s)` +
        ` — ${(await get(`${type.path}?editionId=${target.id}`)).length} au total`,
    );

    const note = type.note?.(from);
    if (note) notes.push(note);
  }

  for (const note of notes) console.log(`\nℹ️  ${note}`);
  console.log("");
}

async function get(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`GET ${path} → ${response.status}`);
  return response.json();
}

async function post(path, body, token) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`POST ${path} → ${response.status} ${await response.text()}`);
  return response.json();
}

async function login() {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(
      `Connexion refusée pour ${EMAIL} (${response.status}). Le compte doit avoir accès aux ` +
        "modules « organigramme » et « contenu ».",
    );
  }
  return (await response.json()).accessToken;
}

main().catch((error) => {
  console.error("\n✗", error.message, "\n");
  process.exitCode = 1;
});
