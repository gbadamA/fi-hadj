/**
 * Vérification de bout en bout de l'API FI-HADJ.
 *
 * Prouve ce qui ne se voit pas dans le navigateur : la matrice RBAC refuse
 * réellement, l'inscription publique attribue une référence séquentielle, la
 * validation produit un vrai PDF, l'export CSV sort avec le bon encodage.
 *
 *   node scripts-verif/api-check.mjs
 */
const API = process.env.API_URL ?? "http://localhost:3051";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "fihadj2025";

let passed = 0;
let failed = 0;
let skipped = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Vérification non concluante — ni réussite, ni défaut du logiciel. */
function skip(label, reason) {
  skipped++;
  console.log(`  ⊘ ${label} — ${reason}`);
}

async function login(email) {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`login ${email} → ${response.status}`);
  const body = await response.json();
  return body.accessToken;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function main() {
  console.log("\n── Contenu public (sans authentification) ──");
  const home = await fetch(`${API}/home`).then((r) => r.json());
  check("GET /home répond", Boolean(home.edition), JSON.stringify(home).slice(0, 120));

  // ⚠️ Les attentes se calent sur l'ÉDITION COURANTE, elles ne sont pas figées sur
  // une année. Une version précédente affirmait « édition 2025 », « 16 distinctions »,
  // « 13 éléments de programme » : basculer le site sur 2026 faisait tomber la moitié
  // des vérifications alors que rien n'était cassé. Un script qui crie au loup ne
  // sert plus à rien — on vérifie donc la FORME et la COHÉRENCE, pas un jeu de
  // données daté.
  const year = home.edition?.year;
  console.log(`  → édition courante : ${year} — ${home.edition?.title}`);

  check("une édition est publiée", Number.isInteger(year));
  check("2 promoteurs (contenu permanent)", home.promoters?.length === 2);
  check("10 catégories de cible (contenu permanent)", home.targetCategories?.length === 10);
  check("projections d'impact présentes", (home.impactProjections?.length ?? 0) >= 1);
  check("organigramme renseigné", (home.orgChart?.length ?? 0) >= 1, `${home.orgChart?.length} poste(s)`);
  check("objectifs renseignés", (home.objectives?.length ?? 0) >= 1, `${home.objectives?.length}`);
  check(
    "un seul objectif général",
    (home.objectives ?? []).filter((o) => o.type === "GENERAL").length === 1,
  );
  check("bloc « contexte » présent", Boolean(home.contexte?.body));
  check(
    "programme cohérent avec les dates de l'édition",
    (home.programItems ?? []).every(
      (item) =>
        String(item.day).slice(0, 10) >= String(home.edition.startDate).slice(0, 10) &&
        String(item.day).slice(0, 10) <= String(home.edition.endDate).slice(0, 10),
    ),
    `${home.programItems?.length} créneau(x)`,
  );

  console.log("\n── Authentification ──");
  const failedLogin = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@fi-hadj.ci", password: "mauvais-mot-de-passe" }),
  });
  check("mot de passe erroné → 401", failedLogin.status === 401, `reçu ${failedLogin.status}`);

  const admin = await login("admin@fi-hadj.ci");
  check("connexion super-admin", Boolean(admin));
  const anonymous = await fetch(`${API}/registrations`);
  check("liste des inscriptions fermée aux anonymes → 401", anonymous.status === 401, `reçu ${anonymous.status}`);

  console.log("\n── Matrice RBAC ──");
  const financier = await login("finances@fi-hadj.ci");
  const communication = await login("communication@fi-hadj.ci");

  const budgetByFinancier = await fetch(`${API}/budget/summary`, { headers: auth(financier) });
  check("Responsable Financier accède au budget → 200", budgetByFinancier.status === 200, `reçu ${budgetByFinancier.status}`);

  const budgetByComm = await fetch(`${API}/budget/summary`, { headers: auth(communication) });
  check("Responsable Communication refusé sur le budget → 403", budgetByComm.status === 403, `reçu ${budgetByComm.status}`);

  const usersByFinancier = await fetch(`${API}/users`, { headers: auth(financier) });
  check("Responsable Financier refusé sur les utilisateurs → 403", usersByFinancier.status === 403, `reçu ${usersByFinancier.status}`);

  const rh = await login("rh@fi-hadj.ci");
  const promote = await fetch(`${API}/users`, {
    method: "POST",
    headers: { ...auth(rh), "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Tentative de promotion",
      email: `escalade-${Date.now()}@fi-hadj.ci`,
      password: "motdepasse123",
      role: "SUPER_ADMIN",
    }),
  });
  check("le Responsable RH ne peut pas créer un SUPER_ADMIN → 403", promote.status === 403, `reçu ${promote.status}`);

  console.log("\n── Inscription publique ──");

  // L'ouverture des inscriptions est un RÉGLAGE de l'édition, pas une propriété
  // du logiciel. Le script vérifie d'abord que la fermeture est bien respectée,
  // puis ouvre le temps du test et REMET l'état d'origine dans le `finally` —
  // sans quoi une recette laisserait le formulaire public ouvert par accident.
  // Une édition TERMINÉE n'accepte plus d'inscription, quel que soit l'interrupteur :
  // le parcours ne peut alors pas être exercé du tout. On le dit, plutôt que de
  // faire échouer une vérification sur une règle métier qui fonctionne.
  const editionIsPast =
    String(home.edition.endDate).slice(0, 10) < new Date().toISOString().slice(0, 10);

  if (editionIsPast) {
    const refused = await fetch(`${API}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PARTICIPANT",
        civility: "M",
        firstName: "Test",
        lastName: "Passe",
        email: `passe.${Date.now()}@exemple.ci`,
        phone: "+225 07 07 07 07 07",
        country: "Côte d'Ivoire",
        consent: true,
      }),
    });
    const body = await refused.json().catch(() => ({}));
    check(
      "édition terminée → inscription refusée en 400",
      refused.status === 400,
      `reçu ${refused.status}`,
    );
    check(
      "le motif du refus mentionne une édition terminée",
      String(body.message ?? "").includes("terminée"),
      body.message,
    );

    for (const label of [
      "création d'une inscription",
      "validation, badge et vérification publique",
      "CSV contient la nouvelle inscription",
      "stats : inscriptions comptabilisées",
    ]) {
      skip(label, "l'édition publiée est terminée — parcours d'inscription inexerçable");
    }

    await checkExportsAndDashboard(admin, year, null);
    const summary = `${passed} réussis, ${failed} échoués${skipped > 0 ? `, ${skipped} ignorés` : ""}`;
    console.log(`\n${failed === 0 ? "✓" : "✗"} ${summary}\n`);
    process.exitCode = failed === 0 ? 0 : 1;
    return;
  }

  const editionWasOpen = home.edition.registrationOpen;
  if (!editionWasOpen) {
    const refused = await fetch(`${API}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PARTICIPANT",
        civility: "M",
        firstName: "Test",
        lastName: "Ferme",
        email: `ferme.${Date.now()}@exemple.ci`,
        phone: "+225 07 07 07 07 07",
        country: "Côte d'Ivoire",
        consent: true,
      }),
    });
    check("inscriptions closes → POST refusé en 400", refused.status === 400, `reçu ${refused.status}`);
    await setRegistrationOpen(home.edition.id, true, admin);
    console.log("  → inscriptions ouvertes temporairement pour la suite du test");
  }

  const stamp = Date.now();
  const created = await fetch(`${API}/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "PARTICIPANT",
      civility: "DR",
      firstName: "Vérification",
      lastName: "Automatique",
      email: `verif.${stamp}@exemple.ci`,
      phone: "+225 07 07 07 07 07",
      country: "Côte d'Ivoire",
      organization: "Recette technique",
      position: "Testeur",
      consent: true,
    }),
  });
  const registration = await created.json();

  /**
   * ⚠️ Le formulaire public est limité à 5 envois par heure et par IP. Un quota
   * épuisé (429) n'est PAS un défaut : c'est l'anti-spam qui fonctionne. On le
   * signale et on saute les vérifications qui en dépendent, plutôt que d'empiler
   * une cascade de faux échecs qui décrédibiliserait tout le rapport.
   *
   * Le compteur est en mémoire : redémarrer l'API le remet à zéro.
   */
  if (created.status === 429) {
    const dependents = [
      "POST /registrations → 201",
      `référence au format FIH-${year}-P-XXXX`,
      "statut initial EN_ATTENTE",
      "formulaire incomplet → 400",
      "validation, badge et vérification publique",
      "CSV contient la nouvelle inscription",
      "stats : inscriptions comptabilisées",
    ];
    console.log("");
    for (const label of dependents) skip(label, "quota anti-spam atteint (5/h par IP)");
    console.log(
      "\n  ℹ️  Redémarrez l'API pour remettre le compteur à zéro, puis relancez ce script.",
    );
    if (!editionWasOpen) await setRegistrationOpen(home.edition.id, false, admin);
    console.log(`\n${failed === 0 ? "✓" : "✗"} ${passed} réussis, ${failed} échoués, ${skipped} ignorés\n`);
    process.exitCode = failed === 0 ? 0 : 1;
    return;
  }

  check("POST /registrations → 201", created.status === 201, `reçu ${created.status} ${JSON.stringify(registration).slice(0, 160)}`);
  check(
    `référence au format FIH-${year}-P-XXXX`,
    new RegExp(`^FIH-${year}-P-\\d{4}$`).test(registration.reference ?? ""),
    registration.reference,
  );
  check("statut initial EN_ATTENTE", registration.status === "EN_ATTENTE");

  const invalid = await fetch(`${API}/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "PARTICIPANT", firstName: "X", consent: false }),
  });
  check("formulaire incomplet → 400", invalid.status === 400, `reçu ${invalid.status}`);

  console.log("\n── Validation, badge et vérification ──");
  const validated = await fetch(`${API}/registrations/${registration.id}/status`, {
    method: "PATCH",
    headers: { ...auth(admin), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "VALIDE" }),
  });
  check("validation → 200", validated.status === 200, `reçu ${validated.status}`);

  const rejectWithoutReason = await fetch(`${API}/registrations/${registration.id}/status`, {
    method: "PATCH",
    headers: { ...auth(admin), "Content-Type": "application/json" },
    body: JSON.stringify({ status: "REJETE" }),
  });
  check("rejet sans motif → 400", rejectWithoutReason.status === 400, `reçu ${rejectWithoutReason.status}`);

  const badge = await fetch(`${API}/registrations/${registration.id}/badge`, { headers: auth(admin) });
  const badgeBytes = Buffer.from(await badge.arrayBuffer());
  check("badge → 200", badge.status === 200, `reçu ${badge.status}`);
  check("badge est un PDF", badgeBytes.subarray(0, 5).toString() === "%PDF-", badgeBytes.subarray(0, 8).toString());
  check("badge non vide (> 5 Ko)", badgeBytes.length > 5000, `${badgeBytes.length} octets`);

  const verify = await fetch(`${API}/registrations/verify/${registration.reference}`).then((r) => r.json());
  check("vérification publique du badge : valide", verify.valid === true, JSON.stringify(verify));

  await checkExportsAndDashboard(admin, year, registration);

  console.log("\n── Nettoyage ──");
  const removed = await fetch(`${API}/registrations/${registration.id}`, {
    method: "DELETE",
    headers: auth(admin),
  });
  check("suppression de l'inscription de test → 204", removed.status === 204, `reçu ${removed.status}`);

  if (!editionWasOpen) {
    await setRegistrationOpen(home.edition.id, false, admin);
    const restored = await fetch(`${API}/editions/current`).then((r) => r.json());
    check(
      "inscriptions refermées comme avant le test",
      restored.registrationOpen === false,
      `registrationOpen = ${restored.registrationOpen}`,
    );
  }

  const summary = `${passed} réussis, ${failed} échoués${skipped > 0 ? `, ${skipped} ignorés` : ""}`;
  console.log(`\n${failed === 0 ? "✓" : "✗"} ${summary}\n`);
  process.exitCode = failed === 0 ? 0 : 1;
}

/**
 * Exports et tableau de bord. `registration` vaut `null` quand le parcours
 * d'inscription n'a pas pu être exercé (édition terminée, quota anti-spam) :
 * on vérifie alors la forme du CSV et les agrégats, sans exiger de nouvelle ligne.
 */
async function checkExportsAndDashboard(admin, year, registration) {
  console.log("\n── Exports ──");
  const csv = await fetch(`${API}/registrations/export`, { headers: auth(admin) });
  // ⚠️ Lire les OCTETS, pas `response.text()` : le décodeur UTF-8 de fetch retire
  // le BOM en tête conformément à la spécification. Un test sur la chaîne
  // conclurait à tort que le BOM est absent, et « Côte d'Ivoire » s'afficherait
  // quand même mal dans Excel.
  const csvBytes = Buffer.from(await csv.arrayBuffer());
  const csvText = csvBytes.toString("utf8");
  check("export CSV → 200", csv.status === 200, `reçu ${csv.status}`);
  check(
    "CSV commence par un BOM UTF-8",
    csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf,
    [...csvBytes.subarray(0, 3)].map((b) => b.toString(16)).join(" "),
  );
  check("CSV séparé par des points-virgules", csvText.split("\n")[0].includes(";"));
  check("CSV : en-tête complet", csvText.split("\n")[0].split(";").length >= 15);
  if (registration) {
    check("CSV contient la nouvelle inscription", csvText.includes(registration.reference));
  }

  console.log("\n── Tableau de bord ──");
  const stats = await fetch(`${API}/stats/dashboard`, { headers: auth(admin) }).then((r) => r.json());
  if (registration) {
    check("stats : total d'inscriptions > 0", stats.registrations?.total > 0, JSON.stringify(stats).slice(0, 160));
    check("stats : ventilation par type", (stats.registrations?.byType ?? []).length >= 1);
  }
  check("stats : solde budgétaire calculé", typeof stats.budget?.balance === "number", String(stats.budget?.balance));
  check("stats : taux de remplissage des stands", typeof stats.stands?.fillRate === "number");
  check(
    "stats : somme des types = total des inscriptions",
    (stats.registrations?.byType ?? []).reduce((sum, row) => sum + row.count, 0) ===
      stats.registrations?.total,
    JSON.stringify(stats.registrations?.byType),
  );
  check(
    "stats : objectif d'impact aligné sur l'année de l'édition",
    stats.impact === null || stats.impact?.year === year,
    JSON.stringify(stats.impact),
  );
  check("stats : édition du tableau de bord = édition courante", stats.edition?.year === year);
}

async function setRegistrationOpen(editionId, open, token) {
  const response = await fetch(`${API}/editions/${editionId}`, {
    method: "PATCH",
    headers: { ...auth(token), "Content-Type": "application/json" },
    body: JSON.stringify({ registrationOpen: open }),
  });
  if (!response.ok) throw new Error(`PATCH /editions → ${response.status}`);
}

main().catch((error) => {
  console.error("\nÉchec de la vérification :", error);
  process.exitCode = 1;
});
