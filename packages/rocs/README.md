# @rocss/rocs

Spécification ROCS et outils de validation HTML/CSS. Package du monorepo
[ROCS](https://github.com/NCAC/ROCS-CSS).

## Utilisation

Après publication sur npm :

```sh
npm install --save-dev @rocss/rocs
npx rocs --dir ./src
npx rocs --dir ./src --format json
```

Dans le dépôt, après `pnpm install`, la commande est également accessible via
`pnpm exec rocs --dir ./examples`. Les anciennes commandes du dépôt restent disponibles.

## API JavaScript

```js
import { analyzeHtml, analyzeScss, validateRocsClass } from '@rocss/rocs';

const issues = analyzeHtml('<div class="ProductCard"></div>', 'example.html');
```

`analyzeHtml(content, filePath)` et `analyzeScss(content, filePath)` retournent
des tableaux de diagnostics. `analyzeScss` accepte aussi du CSS.
`validateRocsClass(name)` contrôle un nom de classe. L'import ne lance pas le CLI.
`runCli(args)` est également exportée, mais termine le processus : utiliser les
fonctions d'analyse pour une intégration programmatique.

## Configurations de lint

Stylelint : installer `stylelint` et `stylelint-config-standard-scss`, puis
utiliser `"extends": ["@rocss/rocs/stylelint"]` dans sa configuration.

ESLint (version 9, flat config) : installer `eslint`, puis au choix :

- `import rocs from '@rocss/rocs/eslint'` et `export default [...rocs]` : active
  `rocs/class-naming` et `rocs/no-state-classes` sur `**/*.jsx` et `**/*.tsx`,
  sans aucune règle cœur d'ESLint ni ignore ;
- `import rocs from '@rocss/rocs/eslint-plugin'` : le plugin seul, à déclarer
  dans `plugins: { rocs }` avec ses propres `files` et sévérités.

Les classes de frameworks tiers sont ignorées selon une liste de préfixes
(`js-`, `v-`, `ng-`, `swiper-`, `slick-`, `fancybox-` par défaut), configurable
pour les deux règles via `settings: { rocs: { allowedPrefixes: ['ais-'] } }`
(ajout) et `useDefaultPrefixes: false` (remplacement). Voir le guide
d'implémentation, §2.3.

Un parseur adapté reste nécessaire pour TypeScript et les autres syntaxes.

Les dépendances de configuration sont des peers optionnelles : le CLI et l'API
d'analyse ne nécessitent aucune dépendance d'exécution externe.

## Portée réelle

Le CLI parcourt HTML, HTM, CSS et SCSS. Ses analyses sont **heuristiques**,
pas une preuve complète de conformité. Sources SCSS et CSS générés sont
analysés séparément. Les expressions dynamiques et les templates Twig, Vue,
JSX, etc. ne disposent pas d'adaptateurs dans ce CLI. Certaines décisions
sémantiques demandent une revue humaine. Les règles existantes ne sont pas
modifiées par l'extraction en package.

## Spécification embarquée

[Spécification française](docs/fr/SPECIFICATION.md) : source normative.
[Version anglaise](docs/en/SPECIFICATION.md) : traduction.

Ces documents sont copiés depuis la source canonique du dépôt lors de
`pnpm run build` ou `pnpm pack`. Ne pas modifier les copies générées.

Version de la spécification ciblée : **ROCS 1.0**. Aucun usage de Sass n'est
nécessaire pour utiliser ce package.
