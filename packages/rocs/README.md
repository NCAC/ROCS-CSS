# @rocss/rocs

**English** · [Français](README.fr.md)

ROCS (Role-Oriented, One-Class CSS Semantics) specification and HTML/CSS
validation tools. Part of the [ROCS](https://github.com/NCAC/ROCS-CSS) monorepo.

## Usage

```sh
npm install --save-dev @rocss/rocs
npx rocs --dir ./src
npx rocs --dir ./src --format json
```

Inside the repository, after `pnpm install`, the command is also available as
`pnpm exec rocs --dir ./examples`. The legacy repository commands remain available.

## JavaScript API

```js
import { analyzeHtml, analyzeScss, validateRocsClass } from '@rocss/rocs';

const issues = analyzeHtml('<div class="ProductCard"></div>', 'example.html');
```

`analyzeHtml(content, filePath)` and `analyzeScss(content, filePath)` return
arrays of diagnostics. `analyzeScss` also accepts plain CSS.
`validateRocsClass(name)` checks a single class name. Importing the module does
not launch the CLI. `runCli(args)` is exported too, but it terminates the
process: use the analysis functions for programmatic integrations.

## Lint configurations

`stylelint` (^16), `stylelint-config-standard-scss` (^13) and `eslint` (≥ 9) are
optional peer dependencies: install only the ones for the tool you use.

Stylelint: install `stylelint` and `stylelint-config-standard-scss`, then use
`"extends": ["@rocss/rocs/stylelint"]` in your configuration.

ESLint (version 9 or later, flat config): install `eslint`, then either:

- `import rocs from '@rocss/rocs/eslint'` and `export default [...rocs]`: enables
  `rocs/class-naming` and `rocs/no-state-classes` on `**/*.jsx` and `**/*.tsx`,
  with no ESLint core rules and no ignores;
- `import rocs from '@rocss/rocs/eslint-plugin'`: the plugin alone, to register
  under `plugins: { rocs }` with your own `files` and severities.

Third-party framework classes are skipped based on a prefix list (`js-`, `v-`,
`ng-`, `swiper-`, `slick-`, `fancybox-` by default), configurable for both rules
with `settings: { rocs: { allowedPrefixes: ['ais-'] } }` (adds prefixes) and
`useDefaultPrefixes: false` (replaces the defaults). See the implementation
guide, §2.3.

TypeScript and other syntaxes still need an appropriate parser.

The CLI and the analysis API have no runtime dependencies.

## Actual scope

The CLI scans HTML, HTM, CSS and SCSS files. Its analysis is **heuristic**, not
a complete proof of compliance. SCSS sources and generated CSS are analyzed
separately. Dynamic expressions and Twig, Vue, JSX, etc. templates have no
adapters in this CLI. Some semantic decisions require human review.

## Bundled specification

[French specification](https://github.com/NCAC/ROCS-CSS/blob/main/docs/fr/SPECIFICATION.md): normative source.
[English version](https://github.com/NCAC/ROCS-CSS/blob/main/docs/en/SPECIFICATION.md): translation.

The package ships both files as `docs/fr/SPECIFICATION.md` and
`docs/en/SPECIFICATION.md` (also exported as `@rocss/rocs/docs/*`). They are
copied from the repository's canonical sources during
`pnpm run build` or `pnpm pack`. Do not edit the generated copies.

Targeted specification version: **ROCS 1.0**. Using this package does not
require Sass.
