# 🕋 CLAUDEMAP — FI-HADJ (Forum International du Hadj)

> Carte maîtresse du projet. À lire en priorité au démarrage de chaque session.
> Elle dit **quoi** construire, **avec quelle stack**, **dans quel ordre**, **à quoi ça doit ressembler**
> et **quels pièges ont déjà coûté du temps**.
> Les specs fonctionnelles d'origine sont dans `cahier-des-charges.md`.

---

## 1. Identité du projet

| | |
|---|---|
| **Nom de travail** | FI-HADJ |
| **Événement** | Forum International du Hadj — Palais de la Culture de Treichville, Abidjan (CI) |
| **Édition 1** | 13 et 14 décembre 2025 · annuel ensuite |
| **Promoteurs** | **SESAP** (Service Spécial d'Assistance et de Protocole) + **CDIDES** (Chambre de Diplomatie Islamique pour le Développement Économique et Social) |
| **Type** | Site public (vitrine + inscriptions) **+** back-office de gestion |
| **Cible** | Pèlerins, institutions gouvernementales, corps diplomatique, secteur privé, médias, ONG — 10 catégories (cahier §4) |
| **Langue produit** | Français. Anglais et arabe **volontairement non commencés** (voir §9) |
| **Emplacement** | `C:\dev\fi-hadj` — **hors OneDrive**, voir §8 |
| **Dépôt** | [gbadamA/fi-hadj](https://github.com/gbadamA/fi-hadj) — **privé**, branche `main` |

**Promesse produit :** un site qui a la tenue d'une institution diplomatique — sobre, dense, sans esbroufe —
et un back-office où treize responsables travaillent chacun dans son périmètre sans se marcher dessus.

### Décisions verrouillées avec le porteur du projet (2026-08-07)

1. **Backend NestJS + Prisma + PostgreSQL**, conformément au cahier §3 — et non Supabase.
   L'architecture *monorepo* et le *design system* sont en revanche repris de
   [`mosquee-fitia`](file:///C:/dev/mosquee-fitia) : `packages/design-tokens` comme source de vérité
   visuelle unique, preset Tailwind partagé, route group + sidebar filtrée par rôle.
2. **Périmètre : phases 1 à 3 du cahier §9**, multilingue exclu.
3. **DA « bleu diplomatique & or »** — voir §3. Écarte volontairement le vert de Fitia pour que
   les deux projets ne se ressemblent pas.

---

## 2. Stack technique (verrouillée)

### Monorepo — pnpm workspaces

```
fi-hadj/
├── apps/
│   ├── api/         NestJS 11 + Prisma 6 + PostgreSQL 16
│   └── web/         Next.js 15 (App Router) — site public ET back-office /admin
├── packages/
│   ├── design-tokens/   couleurs, typo, rayons, ombres + preset Tailwind
│   └── shared-types/    enums, schémas Zod, matrice RBAC, helpers de format
├── scripts-verif/       vérifications exécutables (pas des tests unitaires)
└── docker-compose.yml   Postgres + Mailpit
```

### API — `apps/api`

| Rôle | Choix | Note |
|---|---|---|
| Framework | **NestJS 11** | modules alignés sur le cahier §7 |
| ORM | **Prisma 6** | schéma multi-édition dès l'origine |
| Base | **PostgreSQL 16** (Docker) | port **54320** |
| Auth | **JWT** access 15 min + refresh 7 j | refresh en cookie **httpOnly**, access **en mémoire** |
| Mots de passe | **bcryptjs** | pur JS — pas de compilation native sous Windows |
| Validation | **Zod** (`@fihadj/shared-types`) | le formulaire du site et le DTO valident le MÊME schéma |
| Documentation | **Swagger** sur `/docs` | schémas dérivés du Zod via `zod-to-json-schema` |
| PDF (badges) | **PDFKit + qrcode** | pas de Puppeteer : aucun Chromium à héberger |
| Emails | **nodemailer** | Mailpit en dev (`localhost:8026`), rien ne sort du poste |
| Fichiers | disque local servi en `/uploads` | port `MediaService` prêt pour un bucket S3 |
| Anti-abus | **@nestjs/throttler** | 5/h sur `/registrations` et `/contact`, 10/min sur `/auth/login` |
| Port | **3051** | |

### Web — `apps/web`

| Rôle | Choix |
|---|---|
| Framework | **Next.js 15** (App Router) + React 19 |
| Styling | **Tailwind 3** via le preset de `@fihadj/design-tokens` |
| Formulaires | **React Hook Form + Zod** (mêmes schémas que l'API) |
| Animations | **Framer Motion** |
| Graphiques | **SVG maison** — pas de Recharts, comme sur Fitia |
| Icônes | **Lucide** (`lucide-react`) |
| Polices | `next/font/google` — **Playfair Display** (titres), **Inter** (texte), **Amiri** (arabe) |
| Port | **3050** |

> ⚠️ **Ports** : la plage 5413x est occupée par la stack Supabase de `mosquee-fitia`, 5432 par un
> Postgres du poste, 3040/3041 par `qardan-hassana`. FI-HADJ prend **3050 / 3051 / 54320 / 8026 / 1026**.

---

## 3. Direction artistique — « bleu diplomatique & or »

Source de vérité : `packages/design-tokens/src/index.ts`, miroir Tailwind dans `tailwind-preset.js`.
**Aucune couleur en dur ailleurs dans le code** (seule exception assumée : les gabarits d'email, qui
ne peuvent pas charger de CSS externe).

| Rôle | Valeur | Usage |
|---|---|---|
| Dégradé signature (135°) | `#0B2A4A → #14507F → #C9A227` | bannières, en-têtes, boutons primaires, bandeau du badge |
| Primaire | `#0F3D6B` bleu diplomatique | actions, liens actifs |
| Secondaire | `#C9A227` or | **accent rare** : filets, puces, bordures de distinction |
| Tertiaire | `#2E7CB8` azur | focus, illustrations |
| Sous-thème 1 · organisation | `#0F3D6B` | pastilles de panel |
| Sous-thème 2 · interculturalité | `#2E7CB8` | |
| Sous-thème 3 · flux & sanitaire | `#0E9F6E` | |
| Sous-thème 4 · diplomatie économique | `#C9A227` | |

**Règles non négociables**
- L'or ne porte **que** du texte sombre ; le bleu **que** du texte blanc.
- L'or n'est jamais un aplat de fond : filets, liserés, puces, jamais une grande surface.
- Motif géométrique islamique en **data-URI SVG** (`.pattern-islamic`) — aucun asset externe.
- Les couleurs de marque passent par des **variables CSS en canaux RVB**, pour que `bg-primary/10`
  garde son opacité (un hex direct casserait le modificateur).
- Thème clair **et** sombre, avec un sélecteur réellement atteignable dans l'en-tête et la sidebar.

---

## 4. Modules

### Site public
Accueil · Le forum (contexte, objectifs, résultats, thème et 4 sous-thèmes, cibles, impact) ·
Programme · Dîner-gala et distinctions · Exposants et partenaires · Organigramme · Actualités ·
Inscription (3 formulaires) · Vérification de badge · Contact · Mentions légales · Confidentialité.

### Back-office `/admin` — 14 modules, filtrés par la matrice RBAC
`stats` · `contenu` · `programme` · `actualites` · `medias` · `inscriptions` · `exposants` ·
`sponsors` · `organigramme` · `budget` · `messages` · `rapports` · `editions` · `utilisateurs`

**La matrice RBAC vit dans un seul fichier** : `packages/shared-types/src/permissions.ts`.
L'API l'applique dans `ModuleGuard`, le back-office s'en sert pour filtrer le menu.
Un module invisible dans l'interface est **aussi** refusé par l'API — jamais l'un sans l'autre.

---

## 5. Conventions de code

- **Le contenu du cahier est repris littéralement.** Ce qui a dû être déduit (les 8 objectifs
  spécifiques, les 6 résultats attendus, les projections 2026-2028, les horaires du programme) est
  marqué `A_VALIDER` dans `apps/api/prisma/seed.ts` et doit être relu face à la présentation officielle.
- **Les enums Prisma et `shared-types/src/enums.ts` sont des miroirs.** Modifier l'un impose de
  modifier l'autre — couplage assumé pour éviter un générateur de plus.
- Tout endpoint est **fermé par défaut** (`JwtAuthGuard` global) ; `@Public()` ouvre explicitement.
- Le contenu lié à une édition passe par `EditionsService.resolve()` : sans `editionId`, on retombe
  sur l'édition courante. Le site public ignore donc complètement le multi-édition.
- Les montants sont en `Decimal(14,2)` côté base — jamais de flottant sur ce qui finit dans un rapport.
- Exports CSV : **BOM UTF-8 + séparateur `;`**, sinon Excel FR affiche « CÃ´te d'Ivoire ».

---

## 6. Commandes

```bash
pnpm db:up            # Postgres (54320) + Mailpit (8026)
pnpm shared           # compile @fihadj/shared-types (à faire avant api/web)
pnpm prisma:migrate   # migration
pnpm prisma:seed      # amorçage ( --sans-demo pour omettre les données de démo )
pnpm api              # API   → http://localhost:3051  ·  docs /docs
pnpm web              # site  → http://localhost:3050  ·  back-office /admin
pnpm typecheck        # shared-types + api + web
node scripts-verif/api-check.mjs   # vérification bout en bout de l'API

# Reconduit les 12 postes du Commissariat d'une édition à la suivante (idempotent).
node scripts/copier-organigramme.mjs          # 2025 → 2026
node scripts/copier-organigramme.mjs 2026 2027
```

**Comptes de recette** — un par rôle, mot de passe commun `fihadj2025` :
`admin@fi-hadj.ci` (SUPER_ADMIN), `commissaire@fi-hadj.ci`, `finances@fi-hadj.ci`,
`communication@fi-hadj.ci`, `expositions@fi-hadj.ci`, `rh@fi-hadj.ci`… (liste complète dans le seed).

---

## 7. Pièges déjà payés sur ce poste

- ⚠️ **`incremental: true` dans le tsconfig de l'API** : `nest build` vide `dist/` mais le
  `.tsbuildinfo` survit — tsc croit tout à jour et n'émet qu'une partie des fichiers. Résultat :
  `Cannot find module dist/main.js`. **Ne pas remettre `incremental`.**
- ⚠️ **pnpm n'expose pas les dépendances transitives** : `multer` est une dépendance de
  `@nestjs/platform-express` mais doit être déclarée explicitement, **épinglée sur la même version**
  (2.2.0), sinon deux copies coexistent et le `StorageEngine` de l'une n'est pas reconnu par l'autre.
- ⚠️ **pnpm 10 n'exécute plus aucun script d'installation** : sans `onlyBuiltDependencies` dans le
  `package.json` racine, Prisma ne génère pas son client, esbuild et sharp n'ont pas leur binaire.
- ⚠️ **`package-import-method=copy` dans `.npmrc`** : les liens physiques de pnpm partagent l'inode,
  donc les attributs de fichier ; les projets restés sous OneDrive contaminent les autres d'un
  `ReparsePoint` qui fait échouer les `readlink()` des outils de build.
- ⚠️ **Ne pas mettre de clé de commentaire dans `dependencies`** : pnpm tente de la résoudre comme un
  paquet (`ERR_PNPM_SPEC_NOT_SUPPORTED_BY_ANY_RESOLVER`).
- ⚠️ **Tester la présence du BOM sur les OCTETS**, pas sur `response.text()` : le décodeur UTF-8 de
  `fetch` retire le BOM en tête, un test sur la chaîne conclut à tort qu'il manque.
- ⚠️ **Les scripts de `scripts-verif/` ne doivent RIEN présumer de l'édition courante.** Une version
  de `api-check.mjs` affirmait « édition 2025 », « 16 distinctions », « 13 éléments de programme » :
  la bascule sur 2026 a fait tomber la moitié des vérifications alors que rien n'était cassé. On
  vérifie la FORME et la COHÉRENCE (un seul objectif général, programme compris entre les dates de
  l'édition, référence au format de l'année courante), jamais un jeu de données daté.
- ⚠️ **Le formulaire public est limité à 5 envois/heure/IP** — quelques tests navigateur suffisent à
  épuiser le quota, et `api-check.mjs` renvoie alors des 429 en cascade. Le script le détecte
  désormais et signale « ignoré » au lieu d'un faux échec. Le compteur du throttler est **en
  mémoire** : redémarrer l'API le remet à zéro.
- ⚠️ **Arrêter l'API : filtrer par PORT, pas par ligne de commande.** Elle tourne en
  `node dist/main.js`, dont la ligne de commande ne contient pas « fi-hadj » : un
  `Where-Object { $_.CommandLine -like "*fi-hadj*" }` ne matche rien, le nouveau processus meurt en
  `EADDRINUSE` et l'ancien continue de servir — on croit avoir redémarré alors que non. Utiliser
  `(Get-NetTCPConnection -LocalPort 3051 -State Listen).OwningProcess`.
- ⚠️ **`.next` corrompu** (`EINVAL … readlink app-build-manifest.json`, `Cannot find module './5891.js'`,
  `Cannot read properties of undefined (reading '/_app')`) : arrêter le serveur, supprimer
  `apps/web/.next`, relancer.
  **Cause la plus fréquente ici : avoir lancé `next build` pendant que `next dev` tournait** — les
  deux écrivent dans le même `.next`. Symptôme trompeur : les pages répondent en 200 mais le bundle
  client ne s'hydrate plus, donc les formulaires retombent sur un envoi **GET natif** (on voit alors
  `GET /admin/login?email=…&password=…` dans le journal). **Toujours arrêter le dev avant de builder.**
- ⚠️ **Ne jamais laisser partir deux `/auth/refresh` concurrents.** L'API applique une rotation
  stricte : un jeton de rafraîchissement vu deux fois est traité comme un vol et **toutes** les
  sessions de l'utilisateur sont révoquées. Le double montage d'effet de React en développement
  suffisait à détruire la session à chaque ouverture du back-office. `refreshSession()` partage
  désormais une promesse unique entre tous les appelants simultanés (`lib/api-client.ts`) — ne pas
  retirer cette déduplication, ce n'est pas une optimisation.

---

## 8. Où vit le projet

`C:\dev\fi-hadj` — **volontairement hors OneDrive**, comme `mosquee-fitia`, `ouatt-telecom` et
`video-auto`. OneDrive marque les fichiers d'un `ReparsePoint` qui casse les outils de build, et
`.next` s'y corrompt à l'arrêt brutal.

---

## 9. État et reste à faire

**Fait et vérifié (2026-08-10)**
- Monorepo, design tokens, schéma Prisma (24 modèles), migration, seed du contenu réel du cahier.
- API complète : 60+ routes, auth JWT + rotation stricte des refresh, matrice RBAC sur 13 rôles,
  badges PDF avec QR, exports CSV, emails transactionnels, journal d'audit, Swagger.
- Site public : 12 routes publiques, toutes en 200 (accueil, forum, programme, gala, exposants,
  organigramme, actualités, contact, inscription, mentions légales, confidentialité, vérification
  de badge) + sitemap et robots.
- Back-office : 14 modules, menu filtré par rôle (vérifié : le Responsable Financier voit
  exactement 6 entrées, ni contenu ni utilisateurs).
- `scripts-verif/api-check.mjs` : **36 vérifications au vert** (RBAC refusé/accordé, référence
  séquentielle, badge PDF réel, BOM CSV, tableau de bord).
- **Boucle complète prouvée dans le navigateur** : inscription exposant depuis le site public →
  `FIH-2025-E-0004` + accusé de réception → validation depuis le back-office → email avec badge
  PDF en pièce jointe → page de vérification du badge « Badge valide ».
- `pnpm typecheck` : 0 erreur sur les trois paquets. `next build` : 31 routes générées.

⚠️ **Piège React Hook Form corrigé** : avec `shouldUnregister: true`, RHF retire du corps soumis
toute valeur dont l'input n'est pas monté. Le champ `type` du formulaire d'inscription n'ayant
aucun rendu visible, la validation échouait sur `z.literal("EXPOSANT")` **sans erreur affichable** —
le bouton ne faisait rien, en silence. Corrigé par un `<input type="hidden" {...register("type")} />`
plus un gestionnaire `onInvalid` qui affiche toujours un message global.

**Non commencé — décisions à prendre**
- **Multilingue anglais / arabe** : volontairement pas entamé. Une traduction partielle est pire que
  pas de traduction (même position que sur Fitia).
- 🔵 **L'édition PUBLIÉE est 2025** — repassée dessus à la demande de l'utilisateur le 2026-08-10,
  après un aller-retour sur 2026. Le site public affiche donc la 1ʳᵉ édition, complète, avec le
  bandeau « édition clôturée » et sans parcours d'inscription (l'événement est passé).
  ⚠️ **Le site public n'a PAS de sélecteur d'édition** : il sert toujours l'édition courante
  (`/editions/current`). Une rubrique « éditions passées » serait faisable — l'API accepte
  `?editionId=` sur toutes les lectures publiques — mais elle n'existe pas.

- **L'édition 2026 est prête et en attente** : *FI-HADJ 2026 — 2ᵉ édition*,
  **12 et 13 décembre 2026** (samedi-dimanche, même configuration que la 1ʳᵉ édition), Palais de la
  Culture de Treichville.
  Thème : *« Diplomatie économique et pèlerinage : bâtir des partenariats durables entre la Côte
  d'Ivoire et le monde musulman »* — ⚠️ **proposition retenue par l'utilisateur, PAS un intitulé
  issu du cahier des charges** : à faire confirmer par le Commissariat Général.
  Contenu repris de 2025 : **organigramme (12 postes)** et **objectifs (9)**, via
  `node scripts/copier-contenu-edition.mjs` (idempotent — voir §6). Les **catégories de cible,
  promoteurs, projections d'impact et blocs de texte n'ont pas eu à être copiés** : ils n'ont pas
  d'`editionId`, ils sont permanents et déjà partagés par toutes les éditions.
  **Reste à saisir pour 2026** : les 4 **sous-thèmes** — ils découlent du thème, donc ceux de 2025
  ne sont volontairement pas réutilisables —, le **programme**, les **distinctions du gala**, les
  **résultats attendus** et les **sponsors**. Les pages publiques correspondantes affichent un état
  vide explicite en attendant.
  ⚠️ **Les inscriptions sont CLOSES sur 2026** : à rouvrir depuis `/admin/editions` au moment de
  lancer la campagne. Elle se publie en un clic (« Définir comme édition courante »).

- ⚠️ **« Peut-on encore s'inscrire ? » est une règle UNIQUE**, dans
  `packages/shared-types/src/edition.ts` : `canRegister(edition)` = interrupteur **ET** édition non
  terminée. Elle est appliquée par le hero, le bandeau d'appel à l'action, la page d'inscription
  **et** `RegistrationsService.create` côté serveur.
  Le défaut qu'elle corrige est instructif : seul le hero tenait compte de la date, si bien qu'en
  republiant l'édition 2025 la page d'accueil annonçait « édition clôturée » en haut et
  « Déposer une demande d'inscription » en bas, et l'API acceptait encore un POST direct sur un
  forum tenu huit mois plus tôt. **Ne pas réintroduire de test local sur `registrationOpen` seul.**

- ✅ **Sélecteur d'édition livré le 2026-08-10** — dernière pièce du multi-édition (cahier §9 phase 3).
  `lib/edition.tsx` porte le contexte, le choix est mémorisé en `localStorage` et survit aux
  navigations. Un **bandeau orange** s'affiche dès qu'on travaille sur une édition non publiée.

  ⚠️ **Le point délicat n'est pas la lecture mais l'ÉCRITURE.** Les endpoints de création
  retombent sur l'édition courante quand le corps ne précise rien : sans propagation, ajouter une
  ligne en consultant 2026 l'aurait silencieusement écrite dans 2025. Toute création d'une entité
  rattachée à une édition doit donc fusionner `editionPayload()` dans son corps — c'est câblé pour
  programme, organigramme, exposants, sponsors, distinctions, budget, objectifs, résultats
  attendus, thème et sous-thèmes. **Si un module est ajouté plus tard, ne pas l'oublier.**

  Les modules **globaux** ne prennent volontairement pas d'édition : promoteurs, cibles,
  projections d'impact, médiathèque, actualités, blocs de texte, messages, utilisateurs.
- **Contenu à valider** : les 8 objectifs spécifiques, les 6 résultats attendus, les projections
  2026-2028 et les horaires du programme sont des déductions, pas des citations.
  Les intitulés exacts des 16 distinctions du gala et leurs lauréats sont **volontairement vides**.
- Déploiement (Docker/VPS ou Vercel + Railway), stockage S3, sauvegardes.
