# @rocss/sass

**English** · [Français](README.fr.md)

Canonical Sass mixins for the combinators layer, the reference implementation of
the [`@rocss/sass-architecture`](https://github.com/NCAC/ROCS-CSS/tree/main/packages/sass-architecture#readme) architecture.

**Experimental version 0.1.0, published under the npm tag `next`.** The API may
still change, in particular to follow the architecture, which is itself a
release candidate. Targeted references: ROCS 1.0 and Sass architecture 1.0.0-rc.1.

## Imports

In a project: `npm install --save-dev @rocss/sass@next sass`.
Inside the repository, after `pnpm install` at the root, the workspaces are
linked in `node_modules/@rocss/` (`workspace:*` root dependencies).

The compiler is not bundled: `sass` and `sass-embedded` (≥ 1.71.0, for `pkg:`
URLs) are declared as optional `peerDependencies`. Install one of them; the
package manager then reports a version that is too old.

### Recommended: `pkg:` URLs

`pkg:` URLs (Dart Sass ≥ 1.71.0) resolve the package with the Node.js
algorithm, from the manifest `exports` (`sass` condition). They depend neither
on where `node_modules` lives nor on its layout, so they also work with pnpm
and in monorepos.

```scss
@use "pkg:@rocss/sass/context";
@use "pkg:@rocss/sass/state";

.ProductCard-title {
 @include context.media("(min-width: 48rem)") {
  @include state.pseudo-class("hover") {
   text-decoration: underline;
  }
 }
}
```

The Node package importer must be enabled; it is off by default:

```sh
# CLI
sass --pkg-importer=node input.scss output.css
```

```js
// JavaScript API
import * as sass from 'sass';

const result = sass.compile('input.scss', {
  importers: [new sass.NodePackageImporter()],
});
```

`NodePackageImporter` resolves from the entry script's directory. Without an
entry script (`node -e`, REPL, some tools), pass the starting directory
explicitly: `new sass.NodePackageImporter(process.cwd())`. With a bundler,
provide the same importer through its Sass options (for example `importers` in
Vite's `css.preprocessorOptions.scss` or in `sass-loader`'s `sassOptions`).

`@use "pkg:@rocss/sass"` loads the aggregate entry point; a layer restricted to
one family imports its subpath directly (I23).

### Alternative: load path

Without `pkg:`, add `node_modules` to the load paths and import without a prefix:

```scss
@use "@rocss/sass/state";
```

```sh
sass --load-path=node_modules input.scss output.css
```

or `loadPaths: ["node_modules"]` with the API. This assumes that
`node_modules/@rocss/sass` exists at that location: true for a direct
dependency, but not always with pnpm (transitive dependency) or in a monorepo
subpackage. The SCSS files are not JavaScript modules.

| Family | Mixins and arguments |
| --- | --- |
| `context` | `media($condition)`, `supports($condition)`, `container($condition)` |
| `state` | `pseudo-class($pseudo)`, `attribute($name, $value: null)` |
| `scope` | `ancestor($ancestor)` |
| `part` | `pseudo-element($pseudo)` |

The package mixins are **kebab-case**, like the built-in modules `sass:list` or
`sass:meta`; the mixins of a consuming project (specializations, behaviors,
components) are **snake_case** (Sass architecture §0.3). Since Sass treats `-`
and `_` as equivalent, `state.pseudo_class` is still accepted: this is a
readability convention, not a compiler constraint.

Each family can be imported through its subpath (`/context`, `/state`,
`/scope`, `/part`). The main entry point aggregates the seven mixins without
emitting CSS when loaded. A layer restricted to one family must import its
subpath, not the aggregate (I23). Internal utilities are not part of the
public API.

Every mixin requires a content block and forwards it once. Scope example:

```scss
@use "pkg:@rocss/sass/scope";
@use "pkg:@rocss/sass/state";

.ProductCard-title {
 @include scope.ancestor('body[data-device-type="mobile"]') {
  @include state.pseudo-class("focus-visible") {
   outline-style: solid;
  }
 }
}
```

## Validation and limits

- Simple pseudo-classes: closed list in the source. The four `nth-*` variants
 accept `An+B` indices, integers, `odd` and `even`. Selector arguments (`is`,
 `not`, `has`, `where`, `nth-child(... of ...)`) are rejected by this mechanism.
- Attributes: ASCII identifiers and string/number values without quotes,
 backslashes, brackets or line breaks.
- Ancestors: a `<root>[<attribute>]` compound, with `html`, `body`, `:root` or a
 class as root. The initial parent must be a single compound; nested scopes are
 rejected. The ancestor is provided by the project.
- Pseudo-elements: closed list in the source.
- Conditions: non-blank strings without `{`, `}` or `;`. This check is not a
 complete CSS query parser; Sass and the browser complete the syntax validation.

These checks are syntactic, not a proof of ROCS semantic compliance. The
consumer remains responsible for the meaning of attributes, membership in the
same Block, the ROCS parent, the `context → scope → state → part` order and the
specificity cap. This package provides no design tokens, no visual components
and no automatic check of the architecture graph.

## Checks

From the repository root: `pnpm test` compiles the entry points and
compositions, tests rejected arguments and installs the three archives in a
temporary project outside the repository. `pnpm run pack:check` also inspects
the Sass archive.
