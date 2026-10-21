# Organisation du monorepo ROCS

## Responsabilités et autorité

| Workspace | Version initiale | Contenu | Statut |
| --- | --- | --- | --- |
| `@rocss/rocs` | 1.0.0 | Spécification, CLI, API et configurations de lint | Extrait de l'outillage existant, non publié dans cette migration |
| `@rocss/sass-architecture` | 0.1.0 | Spécification d'architecture, documents associés et vérificateur statique `sass-architecture check` | Brouillon documentaire, vérificateur heuristique |
| `@rocss/sass` | 0.1.0 | Implémentation Sass : sept mixins, quatre familles | Expérimental, `private: true`, tests à exécuter et contrats à revoir |

La racine est privée et orchestre les workspaces pnpm déclarés dans
[pnpm-workspace.yaml](../pnpm-workspace.yaml). Aucun orchestrateur
supplémentaire n'est nécessaire. Les relations de conformité entre les trois
objets n'impliquent pas de dépendances npm d'exécution.

L'autorité va de la spécification ROCS à l'architecture optionnelle, puis à
l'implémentation. Une application conforme à ROCS n'est pas tenue d'utiliser
Sass ou cette architecture. Les règles automatisées ne prouvent pas toutes
les exigences sémantiques du texte normatif.

## Sources canoniques

- ROCS : [documents français](fr/SPECIFICATION.md), traductions dans le dossier anglais.
- Architecture : [bases conceptuelles](../scss-rocs-framework/Framework%20SCSS%20—%20Bases%20conceptuelles.md).
- Implémentation de validation : [package rocs](../packages/rocs/README.md).
- Bibliothèque Sass : [sources canoniques du workspace `@rocss/sass`](../packages/sass/), avec 13 fichiers SCSS copiés/adaptés depuis le dossier local d'import initial. Le dossier d'import initial a été supprimé : `packages/sass` est la seule source.

Les anciens chemins documentaires restent valides. `pnpm run build` et les
hooks `prepack` copient les documents et la licence dans les deux packages
distribuables. Ces copies ignorées par Git ne sont jamais des sources à éditer.
La revue contradictoire reste informative ; son inclusion ne vaut pas adoption
de ses propositions. Les décalages du guide avec la référence restent signalés.

Le workspace `@rocss/sass` contient sa propre [copie réelle de la licence MIT](../packages/sass/LICENSE), incluse dans son archive ; elle n'est pas générée par la construction documentaire.

## API Sass intégrée

| Famille | Mixins implémentées |
| --- | --- |
| `context` | `media($condition)`, `supports($condition)`, `container($condition)` |
| `state` | `pseudo-class($pseudo)`, `attribute($name, $value: null)` |
| `scope` | `ancestor($ancestor)` |
| `part` | `pseudo-element($pseudo)` |

Après `pnpm install` (la racine lie les workspaces via `workspace:*`), importer les familles avec `@use "pkg:@rocss/sass/context"`, `/state`, `/scope` ou `/part`. Activer l'importeur de packages Node de Dart Sass (≥ 1.71.0 ; CLI : `--pkg-importer=node`, API : `importers: [new NodePackageImporter()]`) : la résolution utilise le workspace local, sans publication npm. `loadPaths: ["node_modules"]` avec `@use "@rocss/sass/…"` reste une alternative ([détails](../packages/sass/README.md#imports)). L'entrée principale agrège les sept mixins ; une couche restreinte à une famille importe directement son sous-chemin (I23).

Ces mécanismes ne constituent pas un framework visuel complet : les contrôles syntaxiques ne prouvent pas la conformité sémantique ROCS. Les responsabilités et limites détaillées restent décrites dans le [README de `@rocss/sass`](../packages/sass/README.md).

## Développement

Depuis la racine, avec Node.js 20 ou plus récent et pnpm (version fixée par
`packageManager`, activable avec `corepack enable`) :

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm run check
pnpm run pack:check
```

`pnpm test` contrôle l'API, les points d'entrée CLI, le lockfile, la fidélité des
copies documentaires et l'installation hors dépôt des archives locales.
Des tests ont été ajoutés pour la compilation des points d'entrée et compositions
Sass, les arguments invalides et la compilation depuis l'archive installée.
Les archives sont construites avec `pnpm pack`, puis installées avec npm, hors
ligne et sans scripts, pour vérifier la compatibilité côté consommateur.
`pnpm run pack:check` inspecte les **trois archives** (`@rocss/rocs`,
`@rocss/sass-architecture` et `@rocss/sass`) avec
`pnpm pack --dry-run`, y compris le workspace privé, **sans publication**.
`private: true` interdit la publication, pas l'archivage local avec `pnpm pack`.
**Les tests restent à exécuter ; leur présence ne signifie pas qu'ils réussissent.**

Les commandes historiques `validate`, `validate:strict`, `validate:json`,
`lint` et `compile:examples` sont conservées. Le CLI est aussi accessible par
`pnpm exec rocs --dir ./examples` après installation des workspaces.
L'ancien script et les configurations racine délèguent au package central.
Le CLI analyse désormais les CSS, en plus du HTML/HTM et du SCSS ; les fichiers
sources et compilés peuvent donc produire des diagnostics similaires.

Les adaptateurs de templates ne font pas partie de cette migration structurelle.
L'implémentation des combinators Sass est désormais intégrée ; les autres limites
actuelles figurent dans chaque README.

## Versions et publication

Les versions de packages sont indépendantes de celle de la racine. Un changement
de CLI ne modifie pas automatiquement la version de la spécification. Chaque
package documente la version ROCS ciblée ; l'architecture est encore en 0.x.

L'ancien flux `release-it` global n'est plus exposé par les scripts racine.
Sa configuration historique ne constitue pas une politique de publication
multi-packages. Aucune publication automatique n'est activée.

Avant publication : vérifier ses droits de publication dans l'organisation `@rocss`,
mettre à jour les versions et le lockfile, contrôler les archives et leurs
installations, puis publier explicitement le workspace voulu depuis ce dépôt :

```sh
pnpm --filter @rocss/rocs publish --access public
pnpm --filter @rocss/sass-architecture publish --access public
```

Ces commandes sont des procédures futures, pas des publications déjà réalisées.
Ne pas publier tous les workspaces indistinctement : `@rocss/sass` reste
expérimental en **0.1.0** et protégé par `private: true` dans l'attente de
l'exécution des tests et de la revue des contrats. Aucun package n'est publié
à ce stade ; les packages seront publiés sous l'organisation npm `@rocss`.
