# ROCS Implementation Guide

**Version 1.0.0**
**Companion to the ROCS Specification**

> This guide provides tooling configurations to automate ROCS compliance in a project. For the full normative specification, see [`SPECIFICATION.md`](./SPECIFICATION.md).

**Scope**: this guide covers only what is **specific to ROCS** — naming conventions, selector rules, `data-*` attributes. Generic CSS topics (media query organization, animation libraries, Prettier configuration, visual testing, etc.) are out of scope.

---

## Table of contents

1. [Stylelint: CSS validation](#1-stylelint-css-validation)
2. [ESLint: HTML/JSX validation](#2-eslint-htmljsx-validation)
3. [CLI Validator (`rocs-validate.js`)](#3-cli-validator-rocs-validatejs)
4. [Pre-commit hooks](#4-pre-commit-hooks)
5. [CI/CD: GitHub Actions](#5-cicd-github-actions)
6. [Complementary CSS conventions](#6-complementary-css-conventions)
7. [VS Code: snippets and extensions](#7-vs-code-snippets-and-extensions)

---

## 1. Stylelint: CSS validation

### 1.1 Installation

```bash
npm install --save-dev stylelint stylelint-config-standard-scss
```

### 1.2 Reference configuration

The [`.stylelintrc.json`](../../.stylelintrc.json) file at the repo root contains the reference configuration. Here are the essential rules for ROCS compliance:

```json
{
  "extends": "stylelint-config-standard-scss",
  "rules": {
    "selector-class-pattern": [
      "^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$",
      {
        "message": "ROCS §3.2 — Classes must be PascalCase (Block) or Block-camelCase (Element). E.g.: ProductCard, ProductCard-title, CookiesConsentModal-closeButton"
      }
    ],
    "selector-max-id": [0, {
      "message": "ROCS §5 — id selectors are forbidden in CSS. Use a ROCS class."
    }],
    "declaration-no-important": [true, {
      "severity": "warning",
      "message": "ROCS §6.1 — Avoid !important. ROCS relies on low, predictable specificity."
    }]
  }
}
```

**Key rules**:

| Stylelint rule | Spec section | Purpose |
|---|---|---|
| `selector-class-pattern` | §3.2 | Validates the PascalCase (Block) or Block-camelCase (Element) pattern |
| `selector-max-id` | §5 | Forbids `id` in CSS selectors |
| `declaration-no-important` | §6.1 | Discourages `!important` |
| `selector-max-specificity` | §6.1 | Limits specificity (recommendation: `"0,3,1"`) |
| `selector-max-compound-selectors` | §6.2.1 | Limits combined selector depth |

### 1.3 Recommended overrides

Token, mixin, and animation files do not contain ROCS classes — disable naming validation for these files:

```json
{
  "overrides": [
    {
      "files": ["**/_tokens.scss", "**/tokens/**/*.scss"],
      "rules": { "selector-class-pattern": null }
    },
    {
      "files": ["**/_mixins.scss", "**/mixins/**/*.scss"],
      "rules": { "selector-class-pattern": null }
    },
    {
      "files": ["**/_animations.scss", "**/animations/**/*.scss"],
      "rules": { "keyframes-name-pattern": null }
    }
  ]
}
```

### 1.4 npm scripts

```json
{
  "scripts": {
    "lint:css": "stylelint '**/*.scss'",
    "lint:css:fix": "stylelint '**/*.scss' --fix"
  }
}
```

### 1.5 `.stylelintignore`

```
node_modules/
dist/
build/
*.min.css
```

> **Note**: if you compile SCSS to CSS in the same folder, add the generated `.css` files to `.stylelintignore` to avoid false positives (Sass may reformat certain notations).

---

## 2. ESLint: HTML/JSX validation

ESLint can validate ROCS classes in `className` (JSX) or `class` (HTML via plugins) attributes.

### 2.1 Reference configuration

The [`eslint.config.js`](../../eslint.config.js) file at the repo root contains a **complete ROCS plugin** in flat config ESM (ESLint v9+). It implements two rules:

| Rule | Spec section | Purpose |
|---|---|---|
| `rocs/class-naming` | §3.1, §3.2 | Validates the pattern, depth (Block ≤ 4, Element ≤ 3), and the "0 or 1 ROCS class per element" rule |
| `rocs/no-state-classes` | §3.5 | Forbids `is-*`, `has-*`, `--modifier` and BEM state classes |

### 2.2 ROCS pattern (identical across all tools)

The following regex **MUST** be identical in Stylelint, ESLint, and `rocs-validate.js`:

```
^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$
```

> **Important**: the depth constraint (Block ≤ 4 PascalCase segments, Element ≤ 3 camelCase segments) cannot be encoded in a single regex. It is enforced by additional logic in `eslint.config.js` and `tools/rocs-validate.js`.

### 2.3 Allowed non-ROCS prefixes

Classes imposed by third-party frameworks are outside ROCS scope. Configure a list of allowed prefixes:

```javascript
const NON_ROCS_ALLOWED_PREFIXES = [
  'js-',        // pure JavaScript hooks
  'v-',         // Vue.js (v-cloak, etc.)
  'ng-',        // Angular
  'swiper-',    // Swiper.js
  'slick-',     // Slick slider
];
```

These prefixes are ignored by the `rocs/class-naming` plugin.

---

## 3. CLI Validator (`rocs-validate.js`)

The [`tools/rocs-validate.js`](../../tools/rocs-validate.js) file is a standalone validator that analyzes HTML and SCSS files.

### 3.1 Usage

```bash
# Standard validation (errors = exit 1, warnings = exit 0)
node tools/rocs-validate.js --dir ./src

# Strict mode (warnings = exit 1 too)
node tools/rocs-validate.js --dir ./src --strict

# JSON format (for CI)
node tools/rocs-validate.js --dir ./src --format json --output rocs-report.json

# GitHub Actions format (PR annotations)
node tools/rocs-validate.js --dir ./src --format github
```

### 3.2 Implemented rules

| Rule | Spec section | Checks |
|---|---|---|
| R01 | §3.2 | Block PascalCase, max 4 segments |
| R02 | §3.2 | Element Block-camelCase, max 3 segments |
| R03 | §3.1 | Max 1 ROCS class per HTML element |
| R04 | §3.5 | Forbidden state classes (`is-*`, `--modifier`) |
| R05 | §4.3 | Static variant `data-*` (heuristic) |
| R06 | §5 | `id` forbidden in CSS selectors |
| R07 | §6.2.1 | Forbidden ROCS descendant selectors |
| R08 | §6.2.2 | Mandatory `:where()` for allowed combined selectors |
| R09 | §3.2 | Generic design system Blocks (`Button`, `Modal`, etc.) |

### 3.3 npm scripts

```json
{
  "scripts": {
    "validate": "node tools/rocs-validate.js --dir ./src",
    "validate:strict": "node tools/rocs-validate.js --dir ./src --strict",
    "check": "npm run lint && npm run validate"
  }
}
```

---

## 4. Pre-commit hooks

A pre-commit hook ensures no non-conforming code gets committed.

### 4.1 Minimal setup (Husky)

```bash
npm install --save-dev husky
npx husky init
```

Contents of `.husky/pre-commit`:

```bash
npm run check
```

> `npm run check` runs `lint:css` + `lint:jsx` + `validate` sequentially.

### 4.2 With lint-staged (optional)

To lint only modified files:

```bash
npm install --save-dev lint-staged
```

In `package.json`:

```json
{
  "lint-staged": {
    "*.scss": ["stylelint --fix"],
    "*.{jsx,tsx}": ["eslint --fix"]
  }
}
```

---

## 5. CI/CD: GitHub Actions

### 5.1 Reference workflow

The [`.github/workflows/rocs-ci.yml`](../../.github/workflows/rocs-ci.yml) file contains the full project workflow. Its jobs:

| Job | Tool | Purpose |
|---|---|---|
| `stylelint` | Stylelint | ROCS naming in SCSS files |
| `eslint` | ESLint | ROCS naming in JSX/TSX files |
| `rocs-validate` | `rocs-validate.js` | Full HTML + SCSS audit |
| `compile-examples` | Sass | Verify that SCSS compiles |
| `validate-examples` | `rocs-validate.js` | Example conformance |
| `summary` | — | Pass/fail summary |

### 5.2 Status badge

```markdown
![ROCS Quality Check](https://github.com/NCAC/ROCS-CSS/actions/workflows/rocs-ci.yml/badge.svg)
```

### 5.3 Adapt to your project

The repo workflow validates examples (`--dir ./examples`). To adapt it:

```yaml
# Replace the path with your source folder
- name: Run ROCS validator
  run: node tools/rocs-validate.js --dir ./src --format github
```

---

## 6. Complementary CSS conventions

This section covers CSS conventions that are a **direct consequence** of ROCS rules, without entering the domain of design systems or generic CSS architecture.

### 6.1 `@keyframes` naming

`@keyframes` **must** be named after their **visual movement**, never after the business context. This follows from the ROCS separation principle (§2): the ROCS class carries the *role*, the `@keyframes` carries the *movement*.

```scss
// ✅ Correct: named after the movement
@keyframes fadeIn { /* ... */ }
@keyframes slideUp { /* ... */ }

// ❌ Forbidden: named after business context
@keyframes productCardAppear { /* ... */ }
@keyframes modalOpen { /* ... */ }
```

**Application**: `@keyframes` are reusable CSS implementation details. The ROCS class bridges the gap between role and movement:

```scss
.CookiesConsentModal[open] {
  animation: fadeIn 0.3s ease-out;
}

.ProductCard {
  animation: slideUp 0.4s ease-out;
}
```

> **Naming convention**: camelCase (`fadeIn`, `slideUp`, `scaleDown`). Stylelint can validate this pattern with `keyframes-name-pattern: "^[a-z][a-zA-Z0-9]*$"`.

### 6.2 `prefers-reduced-motion`

Animated components **must** respect user preferences (WCAG 2.1, criterion 2.3.3).

**Global pattern (safety net)**:

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Per-component pattern** (for graceful degradation):

```scss
.CookiesConsentModal[open] {
  animation: fadeIn 0.3s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}
```

### 6.3 Responsive classes: forbidden in HTML

Responsive utility classes are **forbidden** (§2, §3.1). Responsive behavior is handled in CSS:

```html
<!-- ❌ Forbidden: responsive utility classes -->
<div class="ProductCard-aside hidden-mobile visible-tablet">...</div>

<!-- ✅ Correct: 1 ROCS class, responsive in CSS -->
<div class="ProductCard-aside">...</div>
```

```scss
.ProductCard-aside {
  display: block;

  @media (max-width: 767px) {
    display: none;
  }
}
```

**Naming**: if an element only exists on mobile, the name expresses the **role**, not the breakpoint:

```html
<!-- ✅ The name says what it is, not when it's visible -->
<button class="NavigationMain-menuToggle">Menu</button>
```

### 6.4 Container Queries: `container-name` convention

When using Container Queries, the ROCS convention recommends deriving the `container-name` from the Block name in **kebab-case**:

| ROCS class | `container-name` |
|---|---|
| `ProductGrid` | `product-grid` |
| `BestSellersBooks` | `best-sellers-books` |
| `CheckoutSummary` | `checkout-summary` |

```scss
.ProductGrid {
  container-name: product-grid;
  container-type: inline-size;
}

.ProductGrid-item {
  width: 100%;

  @container product-grid (min-width: 600px) {
    width: 50%;
  }

  @container product-grid (min-width: 900px) {
    width: 33.333%;
  }
}
```

### 6.5 Parent state → child selectors: `:where()` mandatory

When a state attribute on a parent Block affects a child's style, the descendant selector **MUST** use `:where()` (§6.2.2):

```scss
// ✅ Correct: :where() preserves the child's specificity
.CookiesConsentModal[open] :where(.CookiesConsentModal-content) {
  animation: scaleUp 0.3s ease-out;
}

.ProductFaqAccordion-trigger[aria-expanded="true"] :where(.ProductFaqAccordion-icon) {
  transform: rotate(180deg);
}

// ❌ Forbidden: specificity inflated by the parent
.CookiesConsentModal[open] .CookiesConsentModal-content {
  animation: scaleUp 0.3s ease-out;
}
```

---

## 7. VS Code: snippets and extensions

### 7.1 Recommended extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "stylelint.vscode-stylelint",
    "dbaeumer.vscode-eslint"
  ]
}
```

### 7.2 ROCS snippets

Create `.vscode/rocs.code-snippets`:

```json
{
  "ROCS Block": {
    "prefix": "rocs-block",
    "body": [
      ".${1:BlockName} {",
      "  $0",
      "}"
    ],
    "description": "ROCS Block (PascalCase)"
  },
  "ROCS Element": {
    "prefix": "rocs-element",
    "body": [
      ".${1:BlockName}-${2:element} {",
      "  $0",
      "}"
    ],
    "description": "ROCS Element (Block-camelCase)"
  },
  "ROCS data-* state": {
    "prefix": "rocs-state",
    "body": [
      ".${1:BlockName}[data-${2:state}=\"${3:value}\"] {",
      "  $0",
      "}"
    ],
    "description": "Dynamic data-* state selector"
  },
  "ROCS state + child :where()": {
    "prefix": "rocs-state-child",
    "body": [
      ".${1:BlockName}[${2:data-state}=\"${3:value}\"] :where(.${1:BlockName}-${4:element}) {",
      "  $0",
      "}"
    ],
    "description": "Parent state → child with :where() (§6.2.2)"
  }
}
```

---

## Resources

- **Normative specification**: [`SPECIFICATION.md`](./SPECIFICATION.md)
- **Cheat sheet**: [`CHEATSHEET.md`](./CHEATSHEET.md)
- **Glossary**: [`GLOSSARY.md`](./GLOSSARY.md)
- **Annotated examples**: [`examples/`](../../examples/)
- **Migration guide**: [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

---

**License**: MIT
**Version**: 1.0.0
