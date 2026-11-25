# @rocss/sass-architecture

**English** · [Français](README.fr.md)

**Reference architecture** for ROCS-compatible Sass, stable since 1.0.0,
targeting ROCS 1.0. This package is mostly documentation.
It also ships an optional static checker (`sass-architecture check`); it
provides no Sass mixins (see [`@rocss/sass`](https://github.com/NCAC/ROCS-CSS/tree/main/packages/sass#readme)).

Installation: `npm install --save-dev @rocss/sass-architecture`.
The Markdown files can be read directly or located through the
`@rocss/sass-architecture/specification` and `@rocss/sass-architecture/guide`
subpaths; they are not JavaScript modules to import.

The documents are currently available in French only:

- [Architecture specification](docs/fr/SPECIFICATION.md): normative reference.
- [Guide](docs/fr/GUIDE.md): informative, aligned with the specification.
- [Adversarial review](docs/fr/REVIEW.md): critical analysis, settled point by point (“Arbitrage” section).

## Architecture checker

```sh
npx sass-architecture check ./src --format json
npx sass-architecture check . --layer tokens=assets/tokens --layer bootstrap=assets/base
```

Convention: one folder per layer (`tokens`, `primitives`, `behaviors`,
`combinators`, `components`, `globals`, `bootstrap`), at the root or under
`src/`, `scss/` or `styles/`. Combinators are split into `context/`, `scope/`,
`state/` and `part/` subfolders. `--layer name=path` overrides a location.
Exit codes: 0 compliant, 1 violation (or warning with `--strict`), 2 invalid usage.

With `--compile`, every module of the layers in the chain is compiled with
`sass` (≥ 1.71.0, optional peer, looked up first in the analyzed project) and
must produce no CSS (I2); `globals` may only produce `@keyframes`, `@font-face`
and `@property`. This semantic check catches, for example, an external
dependency that emits CSS when loaded. A module that does not compile on its own
(missing dependency) yields a `COMPILE` warning, not an error.
The JavaScript API is `checkArchitecture(dir, { layers })`.

| Invariant | Check |
| --- | --- |
| I1 | `@use`/`@forward` follow the layer table; no import of `globals` or `bootstrap` |
| I2 | no standalone emission outside `bootstrap` and `globals` (`@keyframes`, `@font-face`, `@property`) |
| I3 | custom property assignment outside `bootstrap`/`globals` (warning) |
| I7 | `tokens` modules are independent |
| I8 | `primitives`: functions only |
| I9, I10 | behaviors are output-only, with no `&`, `@content`, conditional at-rule or other behavior |
| I11 | each combinator contains at least one `@content` |
| I12 | a single canonical per identifier (`media`, `supports`, `container`, `pseudo-class`, `attribute`, `ancestor`, `pseudo-element`), in the family of its mechanism |
| I13, I14, I16 | combinators stay in their family; specializations use no other specialization, behavior or component |
| I15 | `context → scope → state → part` precedence in nested `@include`s, a single `scope` and a single `part` |
| I19 | no literal class or `id`; no combinator (`>`, `+`, `~`, descendant) outside `bootstrap`, except descendant in the `scope` family |
| I21 | specificity of a composition signature (specification scale) at most (0,3,1), when the `scope` ancestor is a literal |
| I22 | `!important` reserved for `bootstrap` |
| I23 | `bootstrap` reaches only the `context` family, transitively |

Limits: static analysis based on `postcss-scss` and `postcss-selector-parser`,
without Sass compilation. It does not check I11 “exactly once per branch”, nor
I18. An SCSS syntax error is reported (`SYNTAX`). The `bootstrap` reset is not
distinguished from the rest of the layer. The absence of violations does not
prove compliance.

The specification distinguishes `tokens`, `primitives`, `behaviors`,
`combinators`, `components`, `globals` and `bootstrap`. Its additional
constraints are not obligations for every ROCS application.

## Stability

1.0.0 freezes the specification and the rule identifiers (`I1`…`I23`). The
checker remains **heuristic**: see the limits above. The reference
implementation `@rocss/sass` is also stable since 1.0.0.

Policy: a new check is introduced as a warning and only becomes an error at the
next major version, so that a minor update does not break existing projects.

The three `@rocss` packages share one version number, kept in sync by Changesets. ROCS compliance depends neither on adopting
this architecture nor on installing this package.
