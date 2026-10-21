# @rocss/sass-architecture

**Brouillon d'architecture de référence**, version 0.1.0, ciblant ROCS 1.0.
Ce package est essentiellement documentaire. Il fournit aussi un vérificateur
statique optionnel (`sass-architecture check`) ; il ne fournit aucun mixin Sass.

Après publication : `npm install --save-dev @rocss/sass-architecture`.
Les fichiers Markdown sont consultables directement ou localisables via les
sous-chemins `@rocss/sass-architecture/specification` et
`@rocss/sass-architecture/guide` ; ils ne sont pas des modules JavaScript à importer.

- [Spécification d'architecture](docs/fr/SPECIFICATION.md) : référence normative du brouillon.
- [Guide pédagogique](docs/fr/GUIDE.md) : informatif, pas encore entièrement synchronisé.
- [Revue contradictoire](docs/fr/REVIEW.md) : document de travail, propositions non automatiquement adoptées.

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
| I13, I16 | combinators limités à leur famille, sans behavior ni component |
| I19 | pas de classe ni d'`id` littéral ; pas de combinateur (`>`, `+`, `~`, descendant) hors `bootstrap`, sauf descendant dans la famille `scope` |
| I22 | `!important` réservé à `bootstrap` |
| I23 | `bootstrap` n'atteint que la famille `context`, transitivement |

Limites : analyse statique fondée sur `postcss-scss` et `postcss-selector-parser`,
sans compilation Sass. Elle ne vérifie pas I11 « exactement une fois par
branche », I12, I14, I15, I18 ni I21. Une erreur de syntaxe SCSS est signalée
(`SYNTAX`). Le reset de `bootstrap` n'est pas distingué
du reste de la couche. Une absence de violation ne prouve pas la conformité.

La spécification distingue `tokens`, `primitives`, `behaviors`, `combinators`,
`components`, `globals` et `bootstrap`. Ses contraintes supplémentaires ne
constituent pas des obligations pour toute application ROCS.

Les documents de [docs/fr/](docs/fr/) sont les sources canoniques, éditées
directement dans ce package (ils ne sont pas générés). Les propositions de la
revue ne sont pas adoptées automatiquement. Le guide et la revue doivent encore
être harmonisés avec le texte normatif actuel.

Les versions des packages sont indépendantes. La conformité à ROCS ne dépend
ni de l'adoption de cette architecture, ni de l'installation de ce package.
