# @rocss/sass-architecture

[English](README.md) · **Français**

**Architecture de référence**, stable depuis la 1.0.0, ciblant ROCS 1.0.
Ce package est essentiellement documentaire. Il fournit aussi un vérificateur
statique optionnel (`sass-architecture check`) ; il ne fournit aucun mixin Sass.

Installation : `npm install --save-dev @rocss/sass-architecture`.
Les fichiers Markdown sont consultables directement ou localisables via les
sous-chemins `@rocss/sass-architecture/specification` et
`@rocss/sass-architecture/guide` ; ils ne sont pas des modules JavaScript à importer.

Ces documents n'existent qu'en français pour l'instant.

- [Spécification d'architecture](docs/fr/SPECIFICATION.md) : référence normative.
- [Guide pédagogique](docs/fr/GUIDE.md) : informatif, aligné sur la spécification.
- [Revue contradictoire](docs/fr/REVIEW.md) : analyse critique, arbitrée point par point (section « Arbitrage »).

## Vérificateur d'architecture

```sh
npx sass-architecture check ./src --format json
npx sass-architecture check . --layer tokens=assets/tokens --layer bootstrap=assets/base
```

Convention : un dossier par couche (`tokens`, `primitives`, `behaviors`,
`combinators`, `components`, `globals`, `bootstrap`), à la racine ou sous `src/`,
`scss/` ou `styles/`. Les combinators se répartissent en sous-dossiers `context/`,
`scope/`, `state/` et `part/`. `--layer nom=chemin` surcharge un emplacement.
Codes de sortie : 0 conforme, 1 violation (ou avertissement avec `--strict`), 2 usage invalide.

Avec `--compile`, chaque module des couches de la chaîne est compilé avec `sass`
(≥ 1.71.0, pair optionnel, cherché d'abord dans le projet analysé) et ne doit
produire aucun CSS (I2) ; `globals` ne peut produire que `@keyframes`, `@font-face`
et `@property`. Ce contrôle sémantique détecte, par exemple, une dépendance
externe qui émet du CSS à son chargement. Un module qui ne compile pas isolément
(dépendance introuvable) produit un avertissement `COMPILE`, pas une erreur.
L'API JavaScript est `checkArchitecture(dir, { layers })`.

| Invariant | Contrôle |
| --- | --- |
| I1 | `@use`/`@forward` conformes au tableau des couches ; aucun import de `globals` ni `bootstrap` |
| I2 | aucune émission autonome hors `bootstrap` et `globals` (`@keyframes`, `@font-face`, `@property`) |
| I3 | affectation de custom property hors `bootstrap`/`globals` (avertissement) |
| I7 | modules de `tokens` indépendants |
| I8 | `primitives` : fonctions uniquement |
| I9, I10 | behaviors output-only, sans `&`, `@content`, at-rule conditionnelle ni autre behavior |
| I11 | chaque combinator contient au moins un `@content` |
| I12 | un seul canonique par identifiant (`media`, `supports`, `container`, `pseudo-class`, `attribute`, `ancestor`, `pseudo-element`), dans la famille de son mécanisme |
| I13, I14, I16 | combinators limités à leur famille, spécialisations sans autre spécialisation, sans behavior ni component |
| I15 | précédence `context → scope → state → part` dans les `@include` imbriqués, un seul `scope` et un seul `part` |
| I19 | pas de classe ni d'`id` littéral ; pas de combinateur (`>`, `+`, `~`, descendant) hors `bootstrap`, sauf descendant dans la famille `scope` |
| I21 | spécificité d'une signature de composition (barème de la spec) au plus (0,3,1), quand l'ancêtre de `scope` est un littéral |
| I22 | `!important` réservé à `bootstrap` |
| I23 | `bootstrap` n'atteint que la famille `context`, transitivement |

Limites : analyse statique fondée sur `postcss-scss` et `postcss-selector-parser`,
sans compilation Sass. Elle ne vérifie pas I11 « exactement une fois par
branche », ni I18. Une erreur de syntaxe SCSS est signalée
(`SYNTAX`). Le reset de `bootstrap` n'est pas distingué
du reste de la couche. Une absence de violation ne prouve pas la conformité.

La spécification distingue `tokens`, `primitives`, `behaviors`, `combinators`,
`components`, `globals` et `bootstrap`. Ses contraintes supplémentaires ne
constituent pas des obligations pour toute application ROCS.

Les documents de [docs/fr/](docs/fr/) sont les sources canoniques, éditées
directement dans ce package (ils ne sont pas générés). La
revue est arbitrée dans sa section « Arbitrage ».

## Stabilité

La 1.0.0 fige la spécification et les identifiants de règles (`I1`…`I23`).
Le vérificateur reste **heuristique** : voir les limites ci-dessus.
L'implémentation de référence `@rocss/sass` est elle aussi stable depuis la 1.0.0.

Politique : une nouvelle vérification est introduite en avertissement et ne
devient une erreur qu'à la version majeure suivante, afin qu'une mise à jour
mineure ne casse pas les projets existants.

Les trois packages `@rocss` partagent un même numéro de version, synchronisé par Changesets. La conformité à ROCS ne dépend
ni de l'adoption de cette architecture, ni de l'installation de ce package.
