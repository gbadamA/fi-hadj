/**
 * Amorçage de la base FI-HADJ.
 *
 * ⚠️ DEUX NATURES DE DONNÉES COHABITENT ICI, ne pas les confondre :
 *
 *  1. Le contenu VÉRIFIÉ, repris littéralement du cahier des charges : promoteurs,
 *     thème et 4 sous-thèmes, dates et lieu, liste des 16 distinctions du dîner-gala,
 *     10 catégories de cible, organigramme, chiffres de la 1ʳᵉ édition, coordonnées.
 *
 *  2. Le contenu MARQUÉ « à valider » : les 8 objectifs spécifiques, les 6 résultats
 *     attendus et les projections 2026-2028 ne sont pas détaillés dans le cahier —
 *     seul leur NOMBRE l'est. Ils sont ici rédigés par déduction à partir des
 *     sous-thèmes ; ils doivent être relus face à la présentation officielle avant
 *     mise en ligne. Ils sont regroupés dans `A_VALIDER` pour être repérables.
 *
 *  3. Les données de DÉMONSTRATION (inscriptions, exposants, sponsors, budget)
 *     n'existent que pour que le back-office ne soit pas vide à la recette.
 *     `pnpm prisma:seed --sans-demo` les omet.
 */
import { PrismaClient, type Edition } from "@prisma/client";
import { hash } from "bcryptjs";
import { buildRegistrationReference } from "@fihadj/shared-types";

const prisma = new PrismaClient();
const withDemo = !process.argv.includes("--sans-demo");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@fi-hadj.ci";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "fihadj2025";

/** Marqueur des textes à relire face au document source. */
const A_VALIDER = (text: string) => text;

async function main(): Promise<void> {
  console.log("→ Amorçage FI-HADJ…");

  const edition = await seedEdition();
  await seedUsers();
  await seedPromoters();
  await seedSiteContent();
  await seedTargetCategories();
  await seedImpactProjections();
  await seedThemeAndSubThemes(edition);
  await seedObjectives(edition);
  await seedExpectedResults(edition);
  await seedProgram(edition);
  await seedPrizes(edition);
  await seedOrgChart(edition);

  if (withDemo) {
    await seedSponsors(edition);
    await seedRegistrationsAndExhibitors(edition);
    await seedBudget(edition);
  }

  console.log("✓ Amorçage terminé.");
}

// ───────────────────────────── Édition ─────────────────────────────

async function seedEdition(): Promise<Edition> {
  const edition = await prisma.edition.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      title: "FI-HADJ 2025 — 1ʳᵉ édition",
      theme:
        "Étiquette et Protocole : solutions durables pour la réussite du pèlerinage en Islam",
      heroSubtitle:
        "Deux jours de réflexion, de rencontres et de diplomatie économique autour du Hadj et de la Oumrah.",
      startDate: new Date("2025-12-13T00:00:00Z"),
      endDate: new Date("2025-12-14T00:00:00Z"),
      venue: "Palais de la Culture de Treichville",
      city: "Abidjan",
      isCurrent: true,
      registrationOpen: true,
    },
  });
  console.log(`  · édition ${edition.year}`);
  return edition;
}

// ───────────────────────────── Utilisateurs ─────────────────────────────

/**
 * Un compte par rôle de l'organigramme : c'est le seul moyen de vérifier que la
 * matrice RBAC filtre réellement le menu et les endpoints.
 * ⚠️ Tous partagent le mot de passe de développement — à supprimer avant la prod.
 */
async function seedUsers(): Promise<void> {
  const passwordHash = await hash(ADMIN_PASSWORD, 12);
  const accounts: { fullName: string; email: string; role: string }[] = [
    { fullName: "Administrateur technique", email: ADMIN_EMAIL, role: "SUPER_ADMIN" },
    { fullName: "Commissaire Général", email: "commissaire@fi-hadj.ci", role: "COMMISSAIRE_GENERAL" },
    { fullName: "Adjoint — stratégie & partenariats", email: "adjoint1@fi-hadj.ci", role: "COMMISSAIRE_ADJOINT_1" },
    { fullName: "Adjoint — aspects religieux", email: "adjoint2@fi-hadj.ci", role: "COMMISSAIRE_ADJOINT_2" },
    { fullName: "Responsable Logistique", email: "logistique@fi-hadj.ci", role: "RESPONSABLE_LOGISTIQUE" },
    { fullName: "Responsable Communication", email: "communication@fi-hadj.ci", role: "RESPONSABLE_COMMUNICATION" },
    { fullName: "Responsable Partenariats & Sponsoring", email: "partenariats@fi-hadj.ci", role: "RESPONSABLE_PARTENARIATS_SPONSORING" },
    { fullName: "Responsable Expositions", email: "expositions@fi-hadj.ci", role: "RESPONSABLE_EXPOSITIONS" },
    { fullName: "Responsable Ateliers & Panels", email: "panels@fi-hadj.ci", role: "RESPONSABLE_ATELIERS_PANELS" },
    { fullName: "Responsable Événementiel", email: "evenementiel@fi-hadj.ci", role: "RESPONSABLE_EVENEMENTIEL" },
    { fullName: "Responsable Financier", email: "finances@fi-hadj.ci", role: "RESPONSABLE_FINANCIER" },
    { fullName: "Responsable Ressources Humaines", email: "rh@fi-hadj.ci", role: "RESPONSABLE_RH" },
    { fullName: "Responsable Informatique", email: "it@fi-hadj.ci", role: "RESPONSABLE_IT" },
  ];

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { fullName: account.fullName, role: account.role as never },
      create: { ...account, role: account.role as never, passwordHash },
    });
  }
  console.log(`  · ${accounts.length} comptes (mot de passe commun : ${ADMIN_PASSWORD})`);
}

// ───────────────────────────── Promoteurs ─────────────────────────────

async function seedPromoters(): Promise<void> {
  const promoters = [
    {
      acronym: "SESAP",
      name: "Service Spécial d'Assistance et de Protocole",
      description:
        "SARL fondée en 2020 à Abidjan, spécialisée dans l'organisation de cérémonies de haut niveau, " +
        "le protocole, l'étiquette et le lobbying international. SESAP met son expertise du cérémonial " +
        "au service des institutions publiques et privées qui accueillent des délégations étrangères.",
      order: 0,
    },
    {
      acronym: "CDIDES",
      name: "Chambre de Diplomatie Islamique pour le Développement Économique et Social",
      description:
        "Organisation diplomatique ivoirienne promouvant les partenariats stratégiques entre États, " +
        "institutions internationales et grandes organisations. Son action est ancrée dans l'éthique " +
        "islamique et le développement durable.",
      order: 1,
    },
  ];

  for (const promoter of promoters) {
    const existing = await prisma.promoter.findFirst({ where: { acronym: promoter.acronym } });
    if (existing) await prisma.promoter.update({ where: { id: existing.id }, data: promoter });
    else await prisma.promoter.create({ data: promoter });
  }
  console.log("  · 2 promoteurs");
}

// ───────────────────────────── Blocs de contenu ─────────────────────────────

async function seedSiteContent(): Promise<void> {
  const blocks = [
    {
      key: "contexte",
      title: "Contexte et justification",
      body:
        "Le protocole et l'étiquette constituent la grammaire silencieuse des relations internationales. " +
        "Codifiés par les conventions de Vienne sur les relations diplomatiques (1961) et sur les relations " +
        "consulaires (1963), ils règlent la préséance, l'accueil et le traitement réservé aux personnes et aux " +
        "délégations.\n\n" +
        "Le pèlerinage à La Mecque rassemble chaque année près de trois millions de fidèles venus du monde " +
        "entier. Cette concentration humaine, dans un temps et un espace contraints, met à l'épreuve " +
        "l'organisation des États d'origine comme celle du pays hôte : formalités consulaires, transport, " +
        "hébergement, encadrement religieux, gestion des flux, protocole sanitaire.\n\n" +
        "Pour la Côte d'Ivoire, dont plusieurs milliers de ressortissants accomplissent le Hadj ou la Oumrah " +
        "chaque année, la qualité de cette organisation est autant une question de dignité offerte aux pèlerins " +
        "qu'un enjeu de relations bilatérales avec le Royaume d'Arabie Saoudite. Le FI-HADJ entend faire de " +
        "cette exigence un objet de réflexion partagée entre pouvoirs publics, structures privées, autorités " +
        "religieuses et partenaires internationaux.",
    },
    {
      key: "contact",
      title: "Nous contacter",
      body:
        "Commissariat Général du FI-HADJ\n" +
        "Abidjan, Côte d'Ivoire\n\n" +
        "Téléphone : +225 27 22 29 42 98\n" +
        "Téléphone : +225 05 05 70 70 00\n" +
        "Téléphone : +225 01 41 87 75 23\n\n" +
        "Le secrétariat répond du lundi au vendredi, de 8h à 17h (GMT).",
    },
    {
      key: "mentions-legales",
      title: "Mentions légales",
      body:
        "**Éditeur du site**\n" +
        "Le présent site est édité conjointement par SESAP (Service Spécial d'Assistance et de Protocole), " +
        "SARL de droit ivoirien, et par la CDIDES (Chambre de Diplomatie Islamique pour le Développement " +
        "Économique et Social), au titre du Commissariat Général du Forum International du Hadj.\n\n" +
        "**Contact** : +225 27 22 29 42 98\n\n" +
        "**Directeur de la publication** : le Commissaire Général du FI-HADJ.\n\n" +
        "**Propriété intellectuelle**\n" +
        "L'ensemble des contenus (textes, visuels, logos, programme) est protégé. Toute reproduction, même " +
        "partielle, sans autorisation écrite préalable est interdite. Les logos des exposants, sponsors et " +
        "partenaires demeurent la propriété de leurs titulaires respectifs et sont affichés avec leur accord.\n\n" +
        "**Hébergement**\n" +
        "Les coordonnées de l'hébergeur sont communiquées sur simple demande adressée au Commissariat Général.",
    },
    {
      key: "confidentialite",
      title: "Politique de confidentialité",
      body:
        "**Quelles données sont collectées**\n" +
        "Les formulaires d'inscription et de contact collectent : civilité, nom, prénom, adresse email, " +
        "numéro de téléphone, pays, organisation et fonction, ainsi que, pour les exposants et sponsors, " +
        "le secteur d'activité et le niveau de partenariat souhaité.\n\n" +
        "**Pourquoi**\n" +
        "Ces données servent exclusivement à traiter votre demande d'inscription, à produire votre badge " +
        "d'accès, à vous transmettre les informations pratiques relatives au forum et, le cas échéant, à " +
        "établir votre facturation. Elles ne sont ni vendues, ni cédées, ni louées à des tiers.\n\n" +
        "**Combien de temps**\n" +
        "Les données d'inscription sont conservées pendant la durée nécessaire à l'organisation de l'édition " +
        "concernée, puis archivées à des fins statistiques sous forme agrégée.\n\n" +
        "**Qui y accède**\n" +
        "Seuls les membres du Commissariat Général habilités, selon leur fonction dans l'organigramme, " +
        "accèdent aux données nominatives via un back-office protégé par mot de passe.\n\n" +
        "**Vos droits**\n" +
        "Vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. " +
        "Adressez votre demande au Commissariat Général via le formulaire de contact ou par téléphone au " +
        "+225 27 22 29 42 98 ; il y sera répondu dans un délai raisonnable.\n\n" +
        "**Consentement**\n" +
        "Aucun formulaire ne peut être envoyé sans avoir coché explicitement la case d'acceptation de la " +
        "présente politique.",
    },
  ];

  for (const block of blocks) {
    await prisma.siteContent.upsert({
      where: { key: block.key },
      update: { title: block.title, body: block.body },
      create: block,
    });
  }
  console.log(`  · ${blocks.length} blocs de contenu`);
}

// ───────────────────────────── Cibles ─────────────────────────────

async function seedTargetCategories(): Promise<void> {
  const categories = [
    {
      name: "Pèlerins et structures religieuses",
      description:
        "Futurs et anciens pèlerins du Hadj et de la Oumrah, mosquées, associations et guides religieux.",
      subCategories: ["Pèlerins du Hadj", "Pèlerins de la Oumrah", "Guides et encadreurs", "Mosquées et associations cultuelles"],
    },
    {
      name: "Institutions gouvernementales",
      description:
        "Ministères, ambassades et administrations impliqués dans l'organisation et l'encadrement du pèlerinage.",
      subCategories: ["Ministères de tutelle", "Ambassades et consulats", "Services d'immigration", "Autorités sanitaires"],
    },
    {
      name: "Professionnels du protocole et de l'étiquette",
      description:
        "Chefs du protocole, officiers de liaison, formateurs et consultants en cérémonial et en étiquette diplomatique.",
      subCategories: ["Chefs du protocole", "Officiers de liaison", "Formateurs en étiquette"],
    },
    {
      name: "Secteur privé",
      description:
        "Agences de voyage, compagnies aériennes, hôteliers, restaurateurs et opérateurs de transport terrestre.",
      subCategories: ["Agences de voyage et tour-opérateurs", "Compagnies aériennes", "Hôtellerie et restauration", "Transport terrestre"],
    },
    {
      name: "Institutions financières",
      description:
        "Banques, établissements de finance islamique, assureurs et opérateurs de transfert d'argent.",
      subCategories: ["Banques", "Finance islamique", "Assurance et takaful", "Transfert d'argent"],
    },
    {
      name: "Organisations internationales",
      description:
        "Organisations multilatérales, agences de coopération et institutions du monde islamique.",
      subCategories: ["Organisations multilatérales", "Agences de coopération", "Institutions du monde islamique"],
    },
    {
      name: "Communauté éducative",
      description:
        "Universités, instituts de formation, chercheurs et étudiants travaillant sur la diplomatie, la religion ou le tourisme.",
      subCategories: ["Universités et grandes écoles", "Instituts de formation", "Chercheurs et étudiants"],
    },
    {
      name: "Médias",
      description:
        "Presse écrite, audiovisuelle et numérique, nationale et internationale, accréditée pour couvrir le forum.",
      subCategories: ["Presse écrite", "Radio et télévision", "Médias numériques", "Influenceurs et créateurs"],
    },
    {
      name: "Organisations caritatives",
      description:
        "ONG, fondations et structures de bienfaisance intervenant dans l'accompagnement des pèlerins.",
      subCategories: ["ONG et fondations", "Structures de zakat et de waqf", "Associations d'entraide"],
    },
    {
      name: "Grand public",
      description:
        "Toute personne intéressée par le pèlerinage, la diplomatie culturelle et les échanges économiques Côte d'Ivoire – Arabie Saoudite.",
      subCategories: ["Visiteurs individuels", "Familles", "Public scolaire"],
    },
  ];

  for (const [index, category] of categories.entries()) {
    const existing = await prisma.targetCategory.findFirst({ where: { name: category.name } });
    const data = { ...category, order: index };
    if (existing) await prisma.targetCategory.update({ where: { id: existing.id }, data });
    else await prisma.targetCategory.create({ data });
  }
  console.log(`  · ${categories.length} catégories de cible`);
}

// ───────────────────────────── Impact ─────────────────────────────

async function seedImpactProjections(): Promise<void> {
  const projections = [
    // 2025 : chiffres annoncés dans le cahier pour la 1ʳᵉ édition.
    { year: 2025, onSite: 5000, online: 15000, trained: 300, directJobs: 120, indirectJobs: 400 },
    // ⚠️ A_VALIDER — le cahier annonce un tableau 2025-2028 sans en donner les
    // valeurs. Hypothèse de croissance retenue ici : +40 % de fréquentation par an.
    { year: 2026, onSite: 7000, online: 25000, trained: 500, directJobs: 180, indirectJobs: 600 },
    { year: 2027, onSite: 10000, online: 40000, trained: 800, directJobs: 260, indirectJobs: 900 },
    { year: 2028, onSite: 14000, online: 60000, trained: 1200, directJobs: 360, indirectJobs: 1300 },
  ];

  for (const projection of projections) {
    await prisma.impactProjection.upsert({
      where: { year: projection.year },
      update: projection,
      create: projection,
    });
  }
  console.log(`  · ${projections.length} projections d'impact (2026-2028 à valider)`);
}

// ───────────────────────────── Thème & sous-thèmes ─────────────────────────────

async function seedThemeAndSubThemes(edition: Edition): Promise<void> {
  const theme = await prisma.theme.upsert({
    where: { editionId: edition.id },
    update: { title: edition.theme },
    create: {
      editionId: edition.id,
      title: edition.theme,
      description:
        "Le thème général se décline en quatre sous-thèmes, chacun donnant lieu à un panel du forum.",
    },
  });

  const subThemes = [
    {
      title: "L'organisation du pèlerinage à La Mecque : forme étatique et forme privée",
      description:
        "Comparaison des modèles d'organisation du Hadj : encadrement par l'État, délégation à des " +
        "opérateurs privés agréés, modèles mixtes. Quelles garanties pour le pèlerin, quels contrôles, " +
        "quelle répartition des responsabilités ?",
      colorKey: "organisation",
    },
    {
      title: "L'interculturalité et les procédures du pèlerinage",
      description:
        "Le pèlerinage réunit des fidèles de cultures, de langues et d'usages protocolaires très différents. " +
        "Comment les procédures administratives et l'accompagnement peuvent-ils tenir compte de cette " +
        "diversité sans perdre en efficacité ?",
      colorKey: "interculturalite",
    },
    {
      title: "La gestion des flux et le protocole sanitaire face aux changements climatiques",
      description:
        "Chaleur extrême, densité des foules, risques épidémiques : la gestion des flux et le protocole " +
        "sanitaire deviennent des conditions de sécurité du pèlerinage. État des lieux et solutions durables.",
      colorKey: "fluxSanitaire",
    },
    {
      title: "La diplomatie économique et les opportunités d'affaires Côte d'Ivoire – Arabie Saoudite",
      description:
        "Au-delà du culte, le pèlerinage structure des flux économiques considérables. Quelles opportunités " +
        "d'investissement, de partenariat et d'exportation pour les acteurs ivoiriens et saoudiens ?",
      colorKey: "diplomatieEconomique",
    },
  ];

  for (const [index, subTheme] of subThemes.entries()) {
    const existing = await prisma.subTheme.findFirst({
      where: { themeId: theme.id, order: index },
    });
    const data = { ...subTheme, order: index, themeId: theme.id };
    if (existing) await prisma.subTheme.update({ where: { id: existing.id }, data });
    else await prisma.subTheme.create({ data });
  }
  console.log("  · thème + 4 sous-thèmes");
}

// ───────────────────────────── Objectifs ─────────────────────────────

async function seedObjectives(edition: Edition): Promise<void> {
  const objectives: { type: "GENERAL" | "SPECIFIQUE"; text: string }[] = [
    {
      type: "GENERAL",
      text:
        "Promouvoir l'étiquette diplomatique et la multiculturalité pour garantir le succès des " +
        "pèlerinages (Hadj et Oumrah).",
    },
    // ⚠️ A_VALIDER — le cahier annonce 8 objectifs spécifiques sans les détailler.
    // Les huit énoncés ci-dessous sont déduits des sous-thèmes et des résultats attendus.
    { type: "SPECIFIQUE", text: A_VALIDER("Faire connaître les règles de l'étiquette et du protocole applicables à l'accueil et à l'encadrement des pèlerins.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Comparer les modèles d'organisation étatique et privée du pèlerinage et en tirer des recommandations opérationnelles.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Renforcer les compétences interculturelles des professionnels qui accompagnent les pèlerins.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Améliorer la maîtrise des procédures administratives, consulaires et sanitaires du Hadj et de la Oumrah.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Proposer des solutions durables de gestion des flux face aux contraintes climatiques et sanitaires.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Favoriser les rencontres d'affaires entre opérateurs ivoiriens et saoudiens autour de l'économie du pèlerinage.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Structurer un réseau permanent d'acteurs publics, privés et religieux du pèlerinage en Côte d'Ivoire.") },
    { type: "SPECIFIQUE", text: A_VALIDER("Valoriser les institutions et personnalités qui contribuent à la réussite du pèlerinage, notamment lors du dîner-gala.") },
  ];

  await prisma.objective.deleteMany({ where: { editionId: edition.id } });
  await prisma.objective.createMany({
    data: objectives.map((objective, index) => ({
      ...objective,
      order: index,
      editionId: edition.id,
    })),
  });
  console.log(`  · ${objectives.length} objectifs (les 8 spécifiques sont à valider)`);
}

async function seedExpectedResults(edition: Edition): Promise<void> {
  // ⚠️ A_VALIDER — le cahier annonce 6 résultats attendus et en cite quelques-uns
  // (sensibilisation, rencontres B2B/B2G/B2C, réseautage). Les six sont reformulés ici.
  const results = [
    "Les acteurs du pèlerinage sont sensibilisés aux règles de l'étiquette et du protocole.",
    "Des rencontres B2B, B2G et B2C ont eu lieu entre opérateurs, institutions et pèlerins.",
    "Un réseau de professionnels du Hadj et de la Oumrah est constitué et reste actif après le forum.",
    "Des recommandations concrètes sur l'organisation du pèlerinage sont formulées et diffusées.",
    "Les opportunités d'affaires Côte d'Ivoire – Arabie Saoudite sont identifiées et documentées.",
    "Les institutions et personnalités engagées pour la réussite du pèlerinage sont distinguées publiquement.",
  ];

  await prisma.expectedResult.deleteMany({ where: { editionId: edition.id } });
  await prisma.expectedResult.createMany({
    data: results.map((text, index) => ({ text: A_VALIDER(text), order: index, editionId: edition.id })),
  });
  console.log(`  · ${results.length} résultats attendus (à valider)`);
}

// ───────────────────────────── Programme ─────────────────────────────

async function seedProgram(edition: Edition): Promise<void> {
  const subThemes = await prisma.subTheme.findMany({
    where: { theme: { editionId: edition.id } },
    orderBy: { order: "asc" },
  });
  const day1 = new Date("2025-12-13T00:00:00Z");
  const day2 = new Date("2025-12-14T00:00:00Z");

  // ⚠️ A_VALIDER — la trame vient du cahier (§4 « Programme / Contenu ») ;
  // les horaires précis restent à arrêter par le Responsable Événementiel.
  const items = [
    { title: "Accueil et enregistrement des participants", type: "PAUSE", day: day1, startTime: "08:00", endTime: "09:00", location: "Hall du Palais de la Culture" },
    { title: "Cérémonie d'ouverture", description: "Allocutions des promoteurs SESAP et CDIDES, du Commissaire Général et des autorités de tutelle.", type: "CEREMONIE", day: day1, startTime: "09:00", endTime: "10:30", location: "Grande salle" },
    { title: "Ouverture de l'exposition et visite des stands", description: "Plus de 50 exposants : agences de voyage, compagnies aériennes, institutions financières, structures caritatives.", type: "EXPOSITION", day: day1, startTime: "10:30", endTime: "11:30", location: "Esplanade — village des exposants" },
    { title: "Panel 1 — L'organisation du pèlerinage à La Mecque : forme étatique et forme privée", type: "PANEL", day: day1, startTime: "11:30", endTime: "13:00", location: "Grande salle", subThemeIndex: 0 },
    { title: "Pause déjeuner", type: "PAUSE", day: day1, startTime: "13:00", endTime: "14:30", location: "Espace restauration" },
    { title: "Panel 2 — L'interculturalité et les procédures du pèlerinage", type: "PANEL", day: day1, startTime: "14:30", endTime: "16:00", location: "Grande salle", subThemeIndex: 1 },
    { title: "Atelier — Étiquette et protocole appliqués à l'accueil des délégations", type: "ATELIER", day: day1, startTime: "16:15", endTime: "17:45", location: "Salle atelier A" },
    { title: "Panel 3 — La gestion des flux et le protocole sanitaire face aux changements climatiques", description: "Retours d'expérience post-COVID sur la gestion des foules et les dispositifs sanitaires.", type: "PANEL", day: day2, startTime: "09:00", endTime: "10:30", location: "Grande salle", subThemeIndex: 2 },
    { title: "Atelier — Procédures consulaires et sanitaires du Hadj et de la Oumrah", type: "ATELIER", day: day2, startTime: "10:45", endTime: "12:15", location: "Salle atelier B" },
    { title: "Panel 4 — La diplomatie économique et les opportunités d'affaires Côte d'Ivoire – Arabie Saoudite", type: "PANEL", day: day2, startTime: "12:15", endTime: "13:45", location: "Grande salle", subThemeIndex: 3 },
    { title: "Pause déjeuner et rencontres B2B", type: "PAUSE", day: day2, startTime: "13:45", endTime: "15:15", location: "Espace restauration et village des exposants" },
    { title: "Cérémonie de clôture et lecture des recommandations", type: "CEREMONIE", day: day2, startTime: "15:30", endTime: "17:00", location: "Grande salle" },
    { title: "Dîner-gala et remise des distinctions", description: "300 invités. Remise des distinctions aux institutions et personnalités qui œuvrent à la réussite du pèlerinage.", type: "GALA", day: day2, startTime: "19:30", endTime: "23:00", location: "Salle de réception" },
  ];

  await prisma.programItem.deleteMany({ where: { editionId: edition.id } });
  for (const [index, item] of items.entries()) {
    const { subThemeIndex, ...rest } = item as typeof item & { subThemeIndex?: number };
    await prisma.programItem.create({
      data: {
        ...rest,
        type: rest.type as never,
        order: index,
        editionId: edition.id,
        subThemeId: subThemeIndex !== undefined ? (subThemes[subThemeIndex]?.id ?? null) : null,
      },
    });
  }
  console.log(`  · ${items.length} éléments de programme`);
}

// ───────────────────────────── Distinctions du gala ─────────────────────────────

/**
 * Les 16 entités distinguées sont reprises TELLES QUELLES du cahier des charges.
 * L'intitulé exact de chaque prix et le nom du lauréat physique n'y figurent pas :
 * ils restent volontairement vides, à compléter au back-office. Inventer un
 * libellé de distinction officielle serait pire qu'un champ vide.
 */
async function seedPrizes(edition: Edition): Promise<void> {
  const honorees: { name: string; description: string }[] = [
    { name: "Ambassade du Royaume d'Arabie Saoudite", description: "Représentation diplomatique" },
    { name: "Al Deafah", description: "Opérateur du pèlerinage" },
    { name: "Manara-Taba", description: "Opérateur du pèlerinage" },
    { name: "Rawaf Mina", description: "Opérateur du pèlerinage" },
    { name: "Al Qaid", description: "Opérateur du pèlerinage" },
    { name: "Qatar Airways", description: "Compagnie aérienne" },
    { name: "Turkish Airlines", description: "Compagnie aérienne" },
    { name: "Ethiopian Airlines", description: "Compagnie aérienne" },
    { name: "Emirates", description: "Compagnie aérienne" },
    { name: "Air Côte d'Ivoire", description: "Compagnie aérienne" },
    { name: "Cheikh Boikary Fofana", description: "Personnalité religieuse" },
    { name: "S.E. Vazoumana Touré", description: "Personnalité" },
    { name: "Moov", description: "Opérateur de télécommunications" },
    { name: "Takaful", description: "Assurance islamique" },
    { name: "Uniwax", description: "Industrie textile" },
    { name: "Juba Express", description: "Transfert d'argent" },
  ];

  await prisma.prize.deleteMany({ where: { editionId: edition.id } });
  await prisma.prize.createMany({
    data: honorees.map((honoree, index) => ({
      name: honoree.name,
      description: honoree.description,
      order: index,
      editionId: edition.id,
    })),
  });
  console.log(`  · ${honorees.length} distinctions du dîner-gala`);
}

// ───────────────────────────── Organigramme ─────────────────────────────

async function seedOrgChart(edition: Edition): Promise<void> {
  const members: { position: string; role: string; missions: string[] }[] = [
    {
      position: "Commissaire Général",
      role: "COMMISSAIRE_GENERAL",
      missions: [
        "Assurer la direction générale du forum et représenter le FI-HADJ auprès des autorités",
        "Arbitrer les orientations stratégiques et valider le programme",
        "Superviser l'ensemble des responsables de commission",
      ],
    },
    {
      position: "Commissaire Général Adjoint 1 — stratégie et partenariats",
      role: "COMMISSAIRE_ADJOINT_1",
      missions: [
        "Définir la stratégie de développement du forum",
        "Nouer et entretenir les partenariats institutionnels et privés",
        "Suppléer le Commissaire Général sur le volet stratégique",
      ],
    },
    {
      position: "Commissaire Général Adjoint 2 — aspects religieux",
      role: "COMMISSAIRE_ADJOINT_2",
      missions: [
        "Veiller à la conformité religieuse des contenus et du déroulement",
        "Assurer la liaison avec les autorités et institutions cultuelles",
        "Superviser les interventions des personnalités religieuses",
      ],
    },
    {
      position: "Responsable Logistique",
      role: "RESPONSABLE_LOGISTIQUE",
      missions: [
        "Organiser les espaces, le mobilier et les équipements techniques",
        "Coordonner le transport, l'hébergement et la restauration",
        "Assurer la sécurité et la fluidité des accès",
      ],
    },
    {
      position: "Responsable Communication",
      role: "RESPONSABLE_COMMUNICATION",
      missions: [
        "Piloter la communication institutionnelle et digitale du forum",
        "Gérer les relations presse et les accréditations médias",
        "Alimenter le site et les réseaux sociaux",
      ],
    },
    {
      position: "Responsable Partenariats et Sponsoring",
      role: "RESPONSABLE_PARTENARIATS_SPONSORING",
      missions: [
        "Prospecter et négocier les partenariats et le sponsoring",
        "Définir les packages et suivre les contreparties",
        "Entretenir la relation avec les sponsors avant, pendant et après le forum",
      ],
    },
    {
      position: "Responsable Expositions",
      role: "RESPONSABLE_EXPOSITIONS",
      missions: [
        "Recruter et sélectionner les exposants",
        "Attribuer les stands et organiser le plan du village d'exposition",
        "Suivre le paiement des espaces d'exposition",
      ],
    },
    {
      position: "Responsable Ateliers et Panels",
      role: "RESPONSABLE_ATELIERS_PANELS",
      missions: [
        "Construire le contenu scientifique des panels et ateliers",
        "Identifier et inviter les panélistes et modérateurs",
        "Compiler les recommandations issues des travaux",
      ],
    },
    {
      position: "Responsable Événementiel",
      role: "RESPONSABLE_EVENEMENTIEL",
      missions: [
        "Concevoir et rythmer le déroulé des cérémonies et du dîner-gala",
        "Coordonner le protocole et le placement des personnalités",
        "Superviser la remise des distinctions",
      ],
    },
    {
      position: "Responsable Financier",
      role: "RESPONSABLE_FINANCIER",
      missions: [
        "Élaborer et suivre le budget du forum",
        "Contrôler les recettes (sponsoring, inscriptions, exposants) et les dépenses",
        "Produire les états financiers et le bilan de l'édition",
      ],
    },
    {
      position: "Responsable Ressources Humaines",
      role: "RESPONSABLE_RH",
      missions: [
        "Recruter et affecter le personnel et les bénévoles",
        "Organiser la formation des équipes d'accueil",
        "Gérer les plannings et les habilitations d'accès au système",
      ],
    },
    {
      position: "Responsable Informatique",
      role: "RESPONSABLE_IT",
      missions: [
        "Administrer le site et le système de gestion du forum",
        "Garantir la disponibilité des outils et la sécurité des données",
        "Assurer le support technique pendant l'événement",
      ],
    },
  ];

  await prisma.orgChartMember.deleteMany({ where: { editionId: edition.id } });
  for (const [index, member] of members.entries()) {
    const user = await prisma.user.findFirst({ where: { role: member.role as never } });
    await prisma.orgChartMember.create({
      data: {
        position: member.position,
        missions: member.missions,
        role: member.role as never,
        order: index,
        editionId: edition.id,
        userId: user?.id ?? null,
      },
    });
  }
  console.log(`  · organigramme : ${members.length} postes`);
}

// ───────────────────────────── Démonstration ─────────────────────────────

async function seedSponsors(edition: Edition): Promise<void> {
  const sponsors = [
    { name: "Air Côte d'Ivoire", level: "PLATINE", amount: 25_000_000, benefits: ["Logo sur tous les supports", "Stand premium 24 m²", "Prise de parole en cérémonie d'ouverture", "Table de 10 au dîner-gala"] },
    { name: "Takaful Côte d'Ivoire", level: "OR", amount: 12_000_000, benefits: ["Logo sur les supports principaux", "Stand 18 m²", "6 invitations au dîner-gala"] },
    { name: "Juba Express", level: "ARGENT", amount: 6_000_000, benefits: ["Logo sur le programme", "Stand 12 m²", "4 invitations au dîner-gala"] },
    { name: "Uniwax", level: "BRONZE", amount: 3_000_000, benefits: ["Logo sur le site", "Stand 9 m²"] },
    { name: "Ambassade du Royaume d'Arabie Saoudite", level: "PARTENAIRE", amount: 0, benefits: ["Partenaire institutionnel", "Participation aux panels"] },
  ];

  await prisma.sponsor.deleteMany({ where: { editionId: edition.id } });
  await prisma.sponsor.createMany({
    data: sponsors.map((sponsor, index) => ({
      name: sponsor.name,
      level: sponsor.level as never,
      amount: sponsor.amount,
      benefits: sponsor.benefits,
      order: index,
      editionId: edition.id,
    })),
  });
  console.log(`  · ${sponsors.length} sponsors (démo)`);
}

async function seedRegistrationsAndExhibitors(edition: Edition): Promise<void> {
  const categories = await prisma.targetCategory.findMany({ orderBy: { order: "asc" } });
  const pick = (index: number) => categories[index % categories.length]?.id ?? null;

  const people = [
    { civility: "SE", firstName: "Vazoumana", lastName: "Touré", organization: "Ministère des Affaires Étrangères", position: "Chef du protocole", country: "Côte d'Ivoire", type: "PARTICIPANT", status: "VALIDE" },
    { civility: "CHEIKH", firstName: "Boikary", lastName: "Fofana", organization: "COSIM", position: "Président", country: "Côte d'Ivoire", type: "PARTICIPANT", status: "VALIDE" },
    { civility: "DR", firstName: "Aminata", lastName: "Koné", organization: "Université Félix Houphouët-Boigny", position: "Enseignante-chercheuse", country: "Côte d'Ivoire", type: "PARTICIPANT", status: "VALIDE" },
    { civility: "M", firstName: "Ibrahim", lastName: "Diallo", organization: "Agence Al Baraka Voyages", position: "Directeur général", country: "Côte d'Ivoire", type: "EXPOSANT", status: "VALIDE", activitySector: "Agence de voyage et tour-opérateur", standSize: "18 m²" },
    { civility: "MME", firstName: "Fatoumata", lastName: "Bamba", organization: "Takaful Côte d'Ivoire", position: "Directrice commerciale", country: "Côte d'Ivoire", type: "EXPOSANT", status: "VALIDE", activitySector: "Assurance islamique", standSize: "12 m²" },
    { civility: "M", firstName: "Youssef", lastName: "El Amrani", organization: "Manara-Taba", position: "Représentant régional", country: "Arabie Saoudite", type: "EXPOSANT", status: "EN_ATTENTE", activitySector: "Opérateur du pèlerinage", standSize: "24 m²" },
    { civility: "M", firstName: "Kouadio", lastName: "N'Guessan", organization: "Juba Express", position: "Responsable partenariats", country: "Côte d'Ivoire", type: "SPONSOR", status: "VALIDE", sponsorLevel: "ARGENT" },
    { civility: "MME", firstName: "Salimata", lastName: "Ouattara", organization: "Uniwax", position: "Directrice marketing", country: "Côte d'Ivoire", type: "SPONSOR", status: "EN_ATTENTE", sponsorLevel: "BRONZE" },
    { civility: "IMAM", firstName: "Moussa", lastName: "Sanogo", organization: "Mosquée de la Riviera", position: "Imam", country: "Côte d'Ivoire", type: "PARTICIPANT", status: "EN_ATTENTE" },
    { civility: "M", firstName: "Jean-Marc", lastName: "Kouassi", organization: "RTI", position: "Journaliste", country: "Côte d'Ivoire", type: "PARTICIPANT", status: "VALIDE" },
    { civility: "PR", firstName: "Abdoulaye", lastName: "Traoré", organization: "Institut de Diplomatie d'Abidjan", position: "Directeur", country: "Côte d'Ivoire", type: "PARTICIPANT", status: "VALIDE" },
    { civility: "M", firstName: "Sékou", lastName: "Camara", organization: "", position: "Pèlerin", country: "Guinée", type: "PARTICIPANT", status: "REJETE" },
  ];

  await prisma.exhibitor.deleteMany({ where: { editionId: edition.id } });
  await prisma.registration.deleteMany({ where: { editionId: edition.id } });

  const counters: Record<string, number> = { PARTICIPANT: 0, EXPOSANT: 0, SPONSOR: 0 };
  const standNumbers = ["A-01", "A-02", "B-05"];
  let standIndex = 0;

  for (const [index, person] of people.entries()) {
    const type = person.type as "PARTICIPANT" | "EXPOSANT" | "SPONSOR";
    const sequence = ++(counters[type] as number);
    const slug = `${person.firstName}.${person.lastName}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z.]/g, "");

    const registration = await prisma.registration.create({
      data: {
        editionId: edition.id,
        reference: buildRegistrationReference(edition.year, type, sequence),
        sequence,
        type: type as never,
        civility: person.civility as never,
        firstName: person.firstName,
        lastName: person.lastName,
        email: `${slug}@exemple.ci`,
        phone: `+225 0${(index % 7) + 1} ${10 + index} ${20 + index} ${30 + index} ${40 + index}`,
        country: person.country,
        organization: person.organization || null,
        position: person.position || null,
        targetCategoryId: pick(index),
        activitySector: person.activitySector ?? null,
        standSize: person.standSize ?? null,
        sponsorLevel: (person.sponsorLevel as never) ?? null,
        status: person.status as never,
        paymentStatus: type === "PARTICIPANT" ? "NON_APPLICABLE" : person.status === "VALIDE" ? "PAYE" : "EN_ATTENTE",
        // Étalé sur les six dernières semaines pour donner une courbe lisible.
        createdAt: new Date(Date.now() - (people.length - index) * 3 * 86_400_000),
      },
    });

    if (type === "EXPOSANT") {
      const assigned = person.status === "VALIDE";
      await prisma.exhibitor.create({
        data: {
          editionId: edition.id,
          registrationId: registration.id,
          companyName: person.organization || `${person.firstName} ${person.lastName}`,
          activitySector: person.activitySector ?? "Non précisé",
          contactName: `${person.firstName} ${person.lastName}`,
          contactEmail: registration.email,
          contactPhone: registration.phone,
          standNumber: assigned ? (standNumbers[standIndex++] ?? null) : null,
          standStatus: assigned ? "PAYE" : "RESERVE",
          standFee: 1_500_000,
          paidAmount: assigned ? 1_500_000 : 0,
        },
      });
    }
  }
  console.log(`  · ${people.length} inscriptions de démonstration`);
}

async function seedBudget(edition: Edition): Promise<void> {
  const financier = await prisma.user.findFirst({ where: { role: "RESPONSABLE_FINANCIER" } });
  const entries = [
    { type: "RECETTE", category: "Sponsoring", label: "Air Côte d'Ivoire — package Platine", amount: 25_000_000, date: "2025-09-15" },
    { type: "RECETTE", category: "Sponsoring", label: "Takaful — package Or", amount: 12_000_000, date: "2025-09-28" },
    { type: "RECETTE", category: "Sponsoring", label: "Juba Express — package Argent", amount: 6_000_000, date: "2025-10-05" },
    { type: "RECETTE", category: "Exposants", label: "Locations de stands (3 espaces)", amount: 4_500_000, date: "2025-10-20" },
    { type: "DEPENSE", category: "Location de site", label: "Palais de la Culture — 2 jours", amount: 15_000_000, date: "2025-10-01" },
    { type: "DEPENSE", category: "Restauration", label: "Pauses et déjeuners (2 jours)", amount: 8_500_000, date: "2025-11-10" },
    { type: "DEPENSE", category: "Dîner-gala", label: "Prestation traiteur — 300 couverts", amount: 12_000_000, date: "2025-11-20" },
    { type: "DEPENSE", category: "Communication", label: "Affichage, impression et médias", amount: 6_200_000, date: "2025-10-12" },
    { type: "DEPENSE", category: "Logistique", label: "Stands, mobilier et sonorisation", amount: 7_800_000, date: "2025-11-05" },
    { type: "DEPENSE", category: "Distinctions", label: "Trophées et attestations du gala", amount: 2_400_000, date: "2025-11-25" },
  ];

  await prisma.budgetEntry.deleteMany({ where: { editionId: edition.id } });
  await prisma.budgetEntry.createMany({
    data: entries.map((entry) => ({
      type: entry.type as never,
      category: entry.category,
      label: entry.label,
      amount: entry.amount,
      currency: "XOF",
      date: new Date(`${entry.date}T00:00:00Z`),
      editionId: edition.id,
      createdById: financier?.id ?? null,
    })),
  });
  console.log(`  · ${entries.length} lignes de budget (démo)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
