# FI-HADJ — Cahier des charges technique
> Fichier de contexte à fournir à Claude Code pour développer le site web (Next.js) et le système de gestion / backoffice (NestJS) du forum **FI-HADJ**.

---

## 1. Contexte du projet

**FI-HADJ** (Forum International du Hadj) est un événement annuel organisé à Abidjan, porté par deux promoteurs :

- **SESAP** (Service Spécial d'Assistance et de Protocole) — SARL fondée en 2020, Abidjan, spécialisée dans l'organisation de cérémonies de haut niveau, le protocole, l'étiquette et le lobbying international.
- **CDIDES** (Chambre de Diplomatie Islamique pour le Développement Économique et Social) — organisation diplomatique ivoirienne promouvant les partenariats stratégiques entre États, institutions internationales et grandes organisations, ancrée dans l'éthique islamique et le développement durable.

**Thème de la 1ère édition (2025)** : *« Étiquette et Protocole : solutions durables pour la réussite du pèlerinage en Islam »*, décliné en 4 sous-thèmes :
1. L'organisation du pèlerinage à La Mecque : forme étatique et forme privée.
2. L'interculturalité et les procédures du pèlerinage.
3. La gestion des flux et le protocole sanitaire face aux changements climatiques.
4. La diplomatie économique et les opportunités d'affaires Côte d'Ivoire – Arabie Saoudite.

**Dates & lieu — édition 2025** : 13 et 14 décembre 2025, Palais de la Culture de Treichville, Abidjan (événement annuel par la suite).

**Objectif général** : promouvoir l'étiquette diplomatique et la multiculturalité pour garantir le succès des pèlerinages (Hadj / Oumrah).

---

## 2. Objectif du projet numérique

Développer :
1. **Un site web public (vitrine + inscriptions)** en **Next.js** — présente l'événement, permet l'inscription des participants/exposants/sponsors, diffuse le programme et les actualités.
2. **Un système de gestion (backoffice / API)** en **NestJS** — permet au Commissariat Général et à son équipe (12 responsables, voir §7) de piloter le contenu du site, les inscriptions, les exposants, les sponsors/prix, le budget et les statistiques.

---

## 3. Stack technique recommandée

### Frontend — Next.js
- Next.js 14+ (App Router), TypeScript
- TailwindCSS + shadcn/ui pour les composants
- next-intl (ou next-i18next) — contenu en **français**, prévoir l'anglais et l'arabe en V2 (public visé : diplomatie, Arabie Saoudite, communauté musulmane internationale)
- React Hook Form + Zod pour les formulaires (inscription, contact)
- next/image pour l'optimisation des visuels (logos SESAP/CDIDES, sponsors, galerie)
- Déploiement : Vercel (ou VPS avec Docker)

### Backend — NestJS
- NestJS + TypeScript
- PostgreSQL + Prisma (ou TypeORM)
- Authentification : JWT (access + refresh token), guards par rôle (RBAC)
- Validation : class-validator / class-transformer ou Zod
- Upload de fichiers (logos, visuels, documents) : stockage S3-compatible (ou local en dev)
- Envoi d'emails transactionnels (confirmation d'inscription, badges) : NestJS Mailer + SMTP/SendGrid
- Génération de PDF (badges, reçus d'inscription) : Puppeteer ou PDFKit
- Documentation API : Swagger (@nestjs/swagger)
- Déploiement : Docker + VPS, ou Railway/Render

### Architecture
- **Monorepo** conseillé (ex: Turborepo ou simple structure `/apps/web` + `/apps/api`) pour partager les types TypeScript (DTOs) entre front et back.
- Communication front ↔ back via API REST (JSON). GraphQL non nécessaire pour ce périmètre.

---

## 4. Structure du site public (Next.js)

Sections dérivées du contenu de la présentation officielle, à organiser en pages/sections :

| Page / Section | Contenu source |
|---|---|
| **Accueil (Hero)** | Nom de l'événement, thème 2025, dates (13-14 déc. 2025), lieu (Palais de la Culture, Treichville), CTA "S'inscrire" |
| **Présentation des promoteurs** | SESAP + CDIDES (texte + logos) |
| **Contexte et justification** | Rôle du protocole en diplomatie, enjeux du Hadj (~3M pèlerins/an), conventions de Vienne 1961/1963 |
| **Objectifs** | 1 objectif général + 8 objectifs spécifiques |
| **Résultats attendus** | 6 résultats (sensibilisation, rencontres B2B/B2G/B2C, réseautage, etc.) |
| **Thème & sous-thèmes** | Thème général + 4 sous-thèmes/panels |
| **Programme / Contenu** | Cérémonie d'ouverture, panels post-COVID, exposition/stands, ateliers, dîner-gala, cérémonie de clôture |
| **Dîner-Gala & Distinctions** | Liste des prix remis (Ambassade Arabie Saoudite, Al Deafah, Manara-Taba, Rawaf Mina, Al Qaid, Qatar Airways, Turkish Airlines, Ethiopian Airlines, Emirates, Air Côte d'Ivoire, Cheikh Boikary Fofana, S.E. Vazoumana Touré, Moov, Takaful, Uniwax, Juba Express) |
| **Cible & participants** | 10 catégories (pèlerins, institutions gouvernementales, professionnels du protocole, secteur privé, institutions financières, organisations internationales, communauté éducative, médias, organisations caritatives, public général) |
| **Chiffres clés / Impact attendu** | Tableau projections 2025-2028 (visiteurs sur place, en ligne, formations, emplois créés) et chiffres édition 1 (50+ exposants, 5000 visiteurs, 3000 participants cérémonie, 300 invités gala) |
| **Organigramme** | Commissariat Général + 12 responsables (voir §7.6) |
| **Exposants / Partenaires** | Liste et logos des exposants/sponsors (dynamique, alimentée par le backoffice) |
| **Inscription** | 3 formulaires : Participant / Visiteur, Exposant, Sponsor-Partenaire |
| **Actualités / Blog** (optionnel V2) | Annonces, communiqués |
| **Contact** | Formulaire + coordonnées (tél: +225 27 22 29 42 98 / 05 05 70 70 00 / 01 41 87 75 23) |
| **Mentions légales / Politique de confidentialité** | RGPD-like, gestion des données collectées à l'inscription |

---

## 5. Backoffice / système de gestion (NestJS + interface admin Next.js)

Une interface d'administration protégée par authentification (accessible via une route `/admin` du même Next.js ou une app séparée) consommant l'API NestJS.

### Modules fonctionnels

1. **Gestion du contenu (CMS léger)**
   - Édition des textes des sections publiques (objectifs, résultats attendus, thème, contexte…)
   - Gestion des médias (logos, images, galerie, documents téléchargeables)
   - Gestion du programme (sessions, horaires, intervenants, panels)

2. **Gestion des inscriptions**
   - Liste et filtres des inscrits (participant / exposant / sponsor)
   - Validation / rejet des inscriptions
   - Export CSV/Excel des listes
   - Génération de badges (PDF avec QR code) et envoi automatique par email
   - Statuts de paiement (si inscription payante) — voir §5.6 Budget

3. **Gestion des exposants et stands**
   - Fiche exposant (raison sociale, secteur, contact, logo)
   - Attribution d'un numéro/emplacement de stand
   - Suivi du paiement de l'espace d'exposition

4. **Gestion des sponsors & prix du dîner-gala**
   - Référentiel des prix/distinctions (nom du prix, sponsor associé, lauréat)
   - Niveaux de sponsoring (packages : Or/Argent/Bronze ou équivalent) et avantages associés

5. **Gestion de l'organigramme / équipe organisatrice**
   - Fiches des 12 responsables (nom, fonction, mission, coordonnées)
   - Rôles utilisateurs correspondants dans le système (voir §5.7)

6. **Budget** (module simple, V1 ou V2 selon priorité)
   - Suivi des recettes (sponsoring, inscriptions payantes, exposants) et dépenses par poste
   - Tableau de bord budgétaire pour le Responsable Financier

7. **Statistiques / Dashboard**
   - Nombre d'inscrits par catégorie, évolution dans le temps
   - Taux de remplissage des stands
   - Comparaison aux objectifs d'impact (tableau 2025-2028)

8. **Gestion des utilisateurs & rôles (RBAC)**
   - Rôles alignés sur l'organigramme réel :
     - `SUPER_ADMIN` (technique)
     - `COMMISSAIRE_GENERAL`
     - `COMMISSAIRE_ADJOINT_1` (stratégie/partenariats)
     - `COMMISSAIRE_ADJOINT_2` (aspects religieux)
     - `RESPONSABLE_LOGISTIQUE`
     - `RESPONSABLE_COMMUNICATION`
     - `RESPONSABLE_PARTENARIATS_SPONSORING`
     - `RESPONSABLE_EXPOSITIONS`
     - `RESPONSABLE_ATELIERS_PANELS`
     - `RESPONSABLE_EVENEMENTIEL`
     - `RESPONSABLE_FINANCIER`
     - `RESPONSABLE_RH`
     - `RESPONSABLE_IT`
   - Chaque rôle n'accède qu'aux modules pertinents (ex. Responsable Financier → budget + inscriptions payantes ; Responsable Expositions → module exposants).

---

## 6. Modèle de données (entités principales)

À adapter en schéma Prisma, mais structure conceptuelle :

- **User** (admin/staff) : id, nom, email, motDePasseHash, rôle, actif
- **Promoter** (promoteur) : id, nom, sigle, description, logoUrl
- **Objective** : id, type (général/spécifique), texte, ordre
- **ExpectedResult** : id, texte, ordre
- **Theme** : id, édition, titre général, sous-thèmes[]
- **SubTheme** : id, titre, description, themeId
- **ProgramItem** (programme) : id, titre, description, date, heureDebut, heureFin, lieu, type (cérémonie/panel/atelier/expo/gala)
- **Prize** (prix du gala) : id, nom, sponsorAssocié, lauréat, année
- **TargetCategory** (cible) : id, nom (ex. "Pèlerins et structures religieuses"), description, sousCategories[]
- **ImpactProjection** (tableau chiffres clés) : id, année, personnesSurPlace, personnesEnLigne, personnesFormées, emploisDirects, emploisIndirects
- **Registration** (inscription) : id, type (PARTICIPANT/EXPOSANT/SPONSOR), civilité, nom, prénom, organisation, fonction, email, téléphone, pays, catégorieCible, statut (EN_ATTENTE/VALIDÉ/REJETÉ), statutPaiement, dateCréation
- **Exhibitor** (exposant, lié à Registration) : id, registrationId, secteurActivité, numéroStand, logoUrl
- **Sponsor** : id, nom, niveau (Or/Argent/Bronze), logoUrl, avantages
- **OrgChartMember** (organigramme) : id, poste, nomTitulaire, mission[], ordre
- **BudgetEntry** : id, type (recette/dépense), poste, montant, devise, date, responsableId
- **ContactMessage** : id, nom, email, sujet, message, dateCréation, traité (bool)
- **MediaAsset** : id, url, type, légende, section associée

---

## 7. Endpoints API (REST) — vue d'ensemble

```
Auth
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

Contenu public (lecture publique, écriture protégée par rôle)
GET/POST/PATCH/DELETE  /promoters
GET/POST/PATCH/DELETE  /objectives
GET/POST/PATCH/DELETE  /expected-results
GET/POST/PATCH/DELETE  /themes, /sub-themes
GET/POST/PATCH/DELETE  /program-items
GET/POST/PATCH/DELETE  /prizes
GET/POST/PATCH/DELETE  /target-categories
GET/POST/PATCH/DELETE  /impact-projections
GET/POST/PATCH/DELETE  /org-chart

Inscriptions
POST   /registrations                 (public — formulaire d'inscription)
GET    /registrations                 (admin — liste + filtres)
GET    /registrations/:id
PATCH  /registrations/:id/status      (admin — valider/rejeter)
GET    /registrations/:id/badge       (génération PDF badge)
GET    /registrations/export          (CSV/Excel)

Exposants & Sponsors
GET/POST/PATCH/DELETE  /exhibitors
GET/POST/PATCH/DELETE  /sponsors

Budget
GET/POST/PATCH/DELETE  /budget-entries
GET    /budget/summary

Contact
POST   /contact                       (public)
GET    /contact                       (admin)

Statistiques
GET    /stats/dashboard
```

---

## 8. Exigences transverses

- **Langue** : contenu en français par défaut (respecter fidèlement la terminologie religieuse/diplomatique du document source : Hadj, Oumrah, protocole, étiquette diplomatique).
- **Responsive** : mobile-first, le site sera partagé largement (institutions, diaspora, réseaux sociaux).
- **Accessibilité** : contrastes suffisants, formulaires accessibles (labels, messages d'erreur clairs).
- **SEO** : métadonnées, Open Graph (pour partage sur réseaux sociaux/WhatsApp), sitemap.
- **Sécurité** : validation stricte des formulaires publics (anti-spam / rate limiting sur `/registrations` et `/contact`), hashing bcrypt/argon2 des mots de passe, CORS restreint entre le front et l'API.
- **Protection des données** : les inscriptions collectent des données personnelles (nom, contact, organisation) — prévoir une politique de confidentialité et le consentement explicite.
- **Emails transactionnels** : confirmation d'inscription, badge, éventuellement rappels avant l'événement (13-14 décembre 2025).
- **Environnements** : `.env` séparés dev/staging/prod, variables pour DB, JWT secrets, SMTP, stockage fichiers.

---

## 9. Phasage suggéré

**Phase 1 — MVP (site vitrine + inscriptions)**
- Pages publiques statiques/dynamiques (§4) alimentées par contenu en base
- Formulaire d'inscription (participant / exposant / sponsor) + email de confirmation
- Backoffice minimal : gestion du contenu + gestion des inscriptions + auth admin

**Phase 2 — Gestion opérationnelle**
- Module exposants/stands, module sponsors & prix gala
- Génération de badges PDF avec QR code
- Dashboard statistiques

**Phase 3 — Pilotage avancé**
- Module budget
- Gestion fine des rôles selon l'organigramme complet (12 responsables)
- Export de rapports, multi-édition (2025, 2026, 2027…)
- Multilingue (arabe / anglais)

---

## 10. Notes pour Claude Code

- Démarrer par la mise en place du monorepo (`apps/web` en Next.js, `apps/api` en NestJS, éventuellement `packages/shared-types`).
- Définir d'abord le schéma Prisma complet (§6) et lancer une migration initiale avant de coder les endpoints.
- Construire l'API NestJS module par module (auth → content → registrations → exhibitors/sponsors → budget → stats), avec Swagger activé dès le départ.
- Côté Next.js, créer d'abord le layout général + la page d'accueil, puis dérouler les sections du site (§4) en composants réutilisables, avant de brancher les formulaires sur l'API.
- Le contenu textuel exact (objectifs, résultats attendus, thème, cibles, prix du gala, organigramme) doit être repris fidèlement du document source — voir §1, §4, §5, §6 pour le détail déjà extrait.
