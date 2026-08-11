# FI-HADJ — Forum International du Hadj

Site public et système de gestion du **Forum International du Hadj**, organisé à Abidjan par
**SESAP** et la **CDIDES**.

> La carte complète du projet — stack, direction artistique, conventions, pièges du poste — est
> dans **[claudemap.md](claudemap.md)**. Le cahier des charges d'origine est dans
> [cahier-des-charges.md](cahier-des-charges.md).

---

## Démarrer

```bash
pnpm install
pnpm db:up            # Postgres (54320) + Mailpit (8026)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm shared           # compile @fihadj/shared-types — à faire avant api et web
pnpm prisma:migrate
pnpm prisma:seed
```

Puis, dans deux terminaux :

```bash
pnpm api
```

```bash
pnpm web
```

| | |
|---|---|
| Site public | http://localhost:3050 |
| Back-office | http://localhost:3050/admin |
| API | http://localhost:3051 |
| Documentation de l'API | http://localhost:3051/docs |
| Boîte aux lettres de dev | http://localhost:8026 |

**Comptes de recette** — un par rôle de l'organigramme, mot de passe commun `fihadj2025` :

| Rôle | Identifiant |
|---|---|
| Super administrateur | `admin@fi-hadj.ci` |
| Commissaire Général | `commissaire@fi-hadj.ci` |
| Responsable Financier | `finances@fi-hadj.ci` |
| Responsable Communication | `communication@fi-hadj.ci` |
| Responsable Expositions | `expositions@fi-hadj.ci` |
| Responsable RH | `rh@fi-hadj.ci` |

La liste complète est dans [`apps/api/prisma/seed.ts`](apps/api/prisma/seed.ts).
⚠️ Ces comptes n'existent que pour la recette : à supprimer avant toute mise en production.

---

## Structure

```
apps/api/     NestJS 11 + Prisma 6 + PostgreSQL — API REST et logique métier
apps/web/     Next.js 15 — site public ET back-office /admin
packages/
  design-tokens/   couleurs, typographie, rayons, ombres + preset Tailwind partagé
  shared-types/    enums, schémas Zod, matrice RBAC, helpers de format
scripts-verif/     vérifications exécutables
```

Le **schéma Zod d'un formulaire est le même des deux côtés** : `packages/shared-types` est importé
par le formulaire React et par le DTO NestJS. Une règle de validation s'écrit une fois.

La **matrice RBAC** vit dans `packages/shared-types/src/permissions.ts`. L'API l'applique dans son
`ModuleGuard`, le back-office s'en sert pour filtrer le menu latéral : un module invisible dans
l'interface est aussi refusé par l'API.

---

## Vérifier

```bash
pnpm typecheck
```

```bash
node scripts-verif/api-check.mjs
```

Ce dernier prouve ce qui ne se voit pas à l'écran : la matrice RBAC refuse et autorise réellement,
la référence d'inscription est séquentielle par type, le badge est un vrai PDF, l'export CSV porte
son BOM UTF-8, le tableau de bord calcule ses agrégats. **36 vérifications.**

---

## Contenu à valider avant mise en ligne

Le seed distingue trois natures de données. Une seule demande une relecture :

| Contenu | Statut |
|---|---|
| Promoteurs, thème et 4 sous-thèmes, dates et lieu, 16 distinctions du gala, 10 catégories de cible, chiffres de la 1ʳᵉ édition, coordonnées | ✅ repris littéralement du cahier |
| **8 objectifs spécifiques, 6 résultats attendus, projections 2026-2028, horaires du programme** | ⚠️ **déduits — à relire face à la présentation officielle** |
| Inscriptions, exposants, sponsors et budget de démonstration | 🔧 `pnpm prisma:seed --sans-demo` pour les omettre |

Les intitulés exacts des distinctions du dîner-gala et le nom des lauréats sont **volontairement
laissés vides** : ils se saisissent au back-office. Inventer un libellé de distinction officielle
serait pire qu'un champ vide.

---

## Points d'attention

- L'édition amorcée est **2025**, déjà passée. Le site le gère (pas de compte à rebours sur une date
  écoulée, mention « édition clôturée »), mais il faut créer l'édition suivante depuis
  `/admin/editions` — le modèle est multi-édition depuis l'origine.
- **Multilingue anglais / arabe non commencé**, volontairement : une traduction partielle est pire
  que pas de traduction.
- Le stockage des fichiers est **local** (`apps/api/uploads`, servi en `/uploads`). Passer à un
  bucket S3 ne demande de toucher qu'à `MediaService`.
- Les envois d'emails passent par **Mailpit en développement** : rien ne sort du poste.
