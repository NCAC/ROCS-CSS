# @rocss/rocs

[English](README.md) · **Français**

Spécification ROCS et outils de validation HTML/CSS. Package du monorepo
[ROCS](https://github.com/NCAC/ROCS-CSS).

## Utilisation

```sh
npm install --save-dev @rocss/rocs
npx rocs --dir ./src
npx rocs --dir ./src --format json
```

Dans le dépôt, après `pnpm install`, la commande est également accessible via
`pnpm exec rocs --dir ./examples`. Les anciennes commandes du dépôt restent disponibles.

## API JavaScript

```js
import { analyzeHtml, analyzeScss, analyzeTwig, validateRocsClass } from '@rocss/rocs';

const issues = analyzeHtml('<div class="ProductCard"></div>', 'example.html');
```

`analyzeHtml(content, filePath)`, `analyzeTwig(content, filePath)` et
`analyzeScss(content, filePath)` retournent des tableaux de diagnostics. `analyzeScss` accepte aussi du CSS.
`validateRocsClass(name)` contrôle un nom de classe. L'import ne lance pas le CLI.
`runCli(args)` est également exportée, mais termine le processus : utiliser les
fonctions d'analyse pour une intégration programmatique.

## Configurations de lint

`stylelint` (^16), `stylelint-config-standard-scss` (^13) et `eslint` (≥ 9) sont
des dépendances pair optionnelles : n'installer que celles de l'outil utilisé.

Stylelint : installer `stylelint` et `stylelint-config-standard-scss`, puis
utiliser `"extends": ["@rocss/rocs/stylelint"]` dans sa configuration.

ESLint (version 9 ou ultérieure, flat config) : installer `eslint`, puis au choix :

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

Le CLI parcourt HTML, HTM, Twig (`.twig`, y compris `.html.twig`), CSS et
SCSS. Ses analyses sont **heuristiques**, pas une preuve complète de
conformité. Sources SCSS et CSS générés sont analysés séparément. Certaines
décisions sémantiques demandent une revue humaine.

### Templates Twig

Les templates Twig sont analysés avec les règles HTML, sans démarrer Drupal ni
compiler les templates. Les diagnostics indiquent la ligne du template source.

- Les commentaires Twig (`{# … #}`) sont ignorés.
- Les classes statiques sont vérifiées, y compris dans les blocs conditionnels
  et dans les attributs mixtes comme `class="ServiceCard {{ extra_classes }}"`.
- Pour la règle d'une classe par élément (R03), les branches d'un `{% if %}` /
  `{% elseif %}` / `{% else %}` sont exclusives :
  `class="{% if featured %}ServiceCardFeatured{% else %}ServiceCard{% endif %}"`
  est conforme, et la règle s'applique à chaque chemin de rendu.

**Limite : les valeurs dynamiques ne sont pas devinées.** Seules les classes
écrites littéralement dans le template sont vérifiées. L'analyse ignore une
classe produite par une expression (`{{ classes|join(' ') }}`), une classe
collée à une expression (`ServiceCard{{ suffix }}`, `is-{{ state }}`), et les
classes ajoutées via les objets d'attributs de Drupal
(`{{ attributes.addClass('ServiceCard') }}`) ou des variables `{% set %}`.
Le CLI n'a pas non plus d'adaptateurs pour Vue, JSX, etc. Les règles existantes ne sont pas
modifiées par l'extraction en package.

## Spécification embarquée

[Spécification française](https://github.com/NCAC/ROCS-CSS/blob/main/docs/fr/SPECIFICATION.md) : source normative.
[Version anglaise](https://github.com/NCAC/ROCS-CSS/blob/main/docs/en/SPECIFICATION.md) : traduction.

Le package embarque ces deux fichiers sous `docs/fr/SPECIFICATION.md` et
`docs/en/SPECIFICATION.md` (également exportés via `@rocss/rocs/docs/*`). Ils sont
copiés depuis la source canonique du dépôt lors de
`pnpm run build` ou `pnpm pack`. Ne pas modifier les copies générées.

Version de la spécification ciblée : **ROCS 1.0**. Aucun usage de Sass n'est
nécessaire pour utiliser ce package.
