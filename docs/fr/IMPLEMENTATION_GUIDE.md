# Guide d'implémentation ROCS

**Version 1.0.0**
**Compagnon de la spécification ROCS**

> Ce guide fournit les configurations d'outillage pour automatiser la conformité ROCS dans un projet. Pour la spécification normative complète, consultez [`SPECIFICATION.md`](./SPECIFICATION.md).

**Périmètre** : ce guide couvre uniquement ce qui est **spécifique à ROCS** — les conventions de nommage, les règles de sélecteurs, les attributs `data-*`. Les sujets CSS génériques (organisation des media queries, bibliothèques d'animations, configuration Prettier, tests visuels, etc.) sont hors scope.

---

## Table des matières

1. [Stylelint : validation CSS](#1-stylelint--validation-css)
2. [ESLint : validation HTML/JSX](#2-eslint--validation-htmljsx)
3. [Validateur CLI (`rocs-validate.js`)](#3-validateur-cli-rocs-validatejs)
4. [Pre-commit hooks](#4-pre-commit-hooks)
5. [CI/CD : GitHub Actions](#5-cicd--github-actions)
6. [Conventions CSS complémentaires](#6-conventions-css-complémentaires)
7. [VS Code : snippets et extensions](#7-vs-code--snippets-et-extensions)

---

## 1. Stylelint : validation CSS

### 1.1 Installation

```bash
npm install --save-dev stylelint stylelint-config-standard-scss
```

### 1.2 Configuration de référence

Le fichier [`.stylelintrc.json`](../../.stylelintrc.json) à la racine du repo contient la configuration de référence. Voici les règles essentielles pour la conformité ROCS :

```json
{
  "extends": "stylelint-config-standard-scss",
  "rules": {
    "selector-class-pattern": [
      "^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$",
      {
        "message": "ROCS §3.2 — Classes en PascalCase (Bloc) ou Bloc-camelCase (Élément). Ex : ProductCard, ProductCard-title, CookiesConsentModal-closeButton"
      }
    ],
    "selector-max-id": [0, {
      "message": "ROCS §5 — Les sélecteurs id sont interdits en CSS. Utilisez une classe ROCS."
    }],
    "declaration-no-important": [true, {
      "severity": "warning",
      "message": "ROCS §6.1 — Évitez !important. ROCS repose sur une spécificité faible et prévisible."
    }]
  }
}
```

**Règles clés** :

| Règle Stylelint | Section spec | Objectif |
|---|---|---|
| `selector-class-pattern` | §3.2 | Valide le pattern PascalCase (Bloc) ou Bloc-camelCase (Élément) |
| `selector-max-id` | §5 | Interdit les `id` dans les sélecteurs CSS |
| `declaration-no-important` | §6.1 | Décourage `!important` |
| `selector-max-specificity` | §6.1 | Limite la spécificité (recommandation : `"0,3,1"`) |
| `selector-max-compound-selectors` | §6.2.1 | Limite la profondeur des sélecteurs combinés |

### 1.3 Overrides recommandés

Les fichiers de tokens, mixins et animations ne contiennent pas de classes ROCS — désactivez la validation de nommage pour ces fichiers :

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

### 1.4 Scripts npm

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

> **Note** : si vous compilez vos fichiers SCSS en CSS dans le même dossier, ajoutez les `.css` générés au `.stylelintignore` pour éviter les faux positifs (Sass peut reformater des notations).

---

## 2. ESLint : validation HTML/JSX

ESLint permet de valider les classes ROCS dans les attributs `className` (JSX) ou `class` (HTML via plugins).

### 2.1 Configuration de référence

Le fichier [`eslint.config.js`](../../eslint.config.js) à la racine du repo contient un **plugin ROCS complet** en flat config ESM (ESLint v9+). Il implémente deux règles :

| Règle | Section spec | Objectif |
|---|---|---|
| `rocs/class-naming` | §3.1, §3.2 | Valide le pattern, la profondeur (Bloc ≤ 4, Élément ≤ 3), et la règle « 0 ou 1 classe ROCS par élément » |
| `rocs/no-state-classes` | §3.5 | Interdit `is-*`, `has-*`, `--modifier` et les classes d'état BEM |

### 2.2 Pattern ROCS (identique dans tous les outils)

Le regex suivant **DOIT** être identique dans Stylelint, ESLint et `rocs-validate.js` :

```
^[A-Z][a-zA-Z0-9]*(?:-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2})?$
```

> **Important** : la contrainte de profondeur (Bloc ≤ 4 segments PascalCase, Élément ≤ 3 segments camelCase) n'est pas encodable dans un seul regex. Elle est vérifiée par une logique complémentaire dans `eslint.config.js` et `tools/rocs-validate.js`.

### 2.3 Préfixes non-ROCS autorisés

Les classes imposées par des frameworks tiers sont hors périmètre ROCS. Configurez une liste de préfixes autorisés :

```javascript
const NON_ROCS_ALLOWED_PREFIXES = [
  'js-',        // hooks JavaScript purs
  'v-',         // Vue.js (v-cloak, etc.)
  'ng-',        // Angular
  'swiper-',    // Swiper.js
  'slick-',     // Slick slider
];
```

Ces préfixes sont ignorés par le plugin `rocs/class-naming`.

---

## 3. Validateur CLI (`rocs-validate.js`)

Le fichier [`tools/rocs-validate.js`](../../tools/rocs-validate.js) est un validateur autonome qui analyse les fichiers HTML et SCSS.

### 3.1 Usage

```bash
# Validation standard (erreurs = exit 1, warnings = exit 0)
node tools/rocs-validate.js --dir ./src

# Mode strict (warnings = exit 1 aussi)
node tools/rocs-validate.js --dir ./src --strict

# Format JSON (pour CI)
node tools/rocs-validate.js --dir ./src --format json --output rocs-report.json

# Format GitHub Actions (annotations dans la PR)
node tools/rocs-validate.js --dir ./src --format github
```

### 3.2 Règles implémentées

| Règle | Section spec | Vérifie |
|---|---|---|
| R01 | §3.2 | Bloc PascalCase, max 4 segments |
| R02 | §3.2 | Élément Bloc-camelCase, max 3 segments |
| R03 | §3.1 | Max 1 classe ROCS par élément HTML |
| R04 | §3.5 | Classes d'état interdites (`is-*`, `--modifier`) |
| R05 | §4.3 | `data-*` de variant statique (heuristique) |
| R06 | §5 | `id` interdit dans les sélecteurs CSS |
| R07 | §6.2.1 | Sélecteurs descendants ROCS interdits |
| R08 | §6.2.2 | `:where()` obligatoire pour combinés autorisés |
| R09 | §3.2 | Blocs génériques design system (`Button`, `Modal`, etc.) |

### 3.3 Scripts npm

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

Un hook pre-commit garantit qu'aucun code non conforme n'est commité.

### 4.1 Configuration minimale (Husky)

```bash
npm install --save-dev husky
npx husky init
```

Contenu de `.husky/pre-commit` :

```bash
npm run check
```

> `npm run check` exécute `lint:css` + `lint:jsx` + `validate` en séquence.

### 4.2 Avec lint-staged (optionnel)

Pour ne linter que les fichiers modifiés :

```bash
npm install --save-dev lint-staged
```

Dans `package.json` :

```json
{
  "lint-staged": {
    "*.scss": ["stylelint --fix"],
    "*.{jsx,tsx}": ["eslint --fix"]
  }
}
```

---

## 5. CI/CD : GitHub Actions

### 5.1 Workflow de référence

Le fichier [`.github/workflows/rocs-ci.yml`](../../.github/workflows/rocs-ci.yml) contient le workflow complet du projet. Ses jobs :

| Job | Outil | Objectif |
|---|---|---|
| `stylelint` | Stylelint | Nommage ROCS dans les fichiers SCSS |
| `eslint` | ESLint | Nommage ROCS dans les fichiers JSX/TSX |
| `rocs-validate` | `rocs-validate.js` | Audit complet HTML + SCSS |
| `compile-examples` | Sass | Vérifier que les SCSS compilent |
| `validate-examples` | `rocs-validate.js` | Conformité des exemples |
| `summary` | — | Synthèse pass/fail |

### 5.2 Badge de statut

```markdown
![ROCS Quality Check](https://github.com/NCAC/ROCS-CSS/actions/workflows/rocs-ci.yml/badge.svg)
```

### 5.3 Adapter à votre projet

Le workflow du repo valide les exemples (`--dir ./examples`). Pour l'adapter :

```yaml
# Remplacez le chemin par votre dossier source
- name: Run ROCS validator
  run: node tools/rocs-validate.js --dir ./src --format github
```

---

## 6. Conventions CSS complémentaires

Cette section couvre les conventions CSS qui sont une **conséquence directe** des règles ROCS, sans entrer dans le domaine du design system ou de l'architecture CSS générique.

### 6.1 Nommage des `@keyframes`

Les `@keyframes` **doivent** être nommés selon leur **mouvement visuel**, jamais selon le contexte métier. C'est une conséquence du principe de séparation ROCS (§2) : la classe ROCS porte le *rôle*, le `@keyframes` porte le *mouvement*.

```scss
// ✅ Correct : nommé par le mouvement
@keyframes fadeIn { /* ... */ }
@keyframes slideUp { /* ... */ }

// ❌ Interdit : nommé par le contexte métier
@keyframes productCardAppear { /* ... */ }
@keyframes modalOpen { /* ... */ }
```

**Application** : les `@keyframes` sont des détails d'implémentation CSS réutilisables. La classe ROCS fait le pont entre le rôle et le mouvement :

```scss
.CookiesConsentModal[open] {
  animation: fadeIn 0.3s ease-out;
}

.ProductCard {
  animation: slideUp 0.4s ease-out;
}
```

> **Convention de nommage** : camelCase (`fadeIn`, `slideUp`, `scaleDown`). Stylelint peut valider ce pattern avec `keyframes-name-pattern: "^[a-z][a-zA-Z0-9]*$"`.

### 6.2 `prefers-reduced-motion`

Les composants avec animations **doivent** respecter la préférence utilisateur (WCAG 2.1, critère 2.3.3).

**Pattern global (filet de sécurité)** :

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Pattern par composant** (pour offrir une dégradation appropriée) :

```scss
.CookiesConsentModal[open] {
  animation: fadeIn 0.3s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}
```

### 6.3 Classes responsives : interdites dans le HTML

Les classes utilitaires responsives sont **interdites** (§2, §3.1). Le comportement responsive se gère en CSS :

```html
<!-- ❌ Interdit : classes utilitaires responsives -->
<div class="ProductCard-aside hidden-mobile visible-tablet">...</div>

<!-- ✅ Correct : 1 classe ROCS, responsive en CSS -->
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

**Nommage** : si un élément n'existe que sur mobile, le nom exprime le **rôle**, pas le breakpoint :

```html
<!-- ✅ Le nom dit ce que c'est, pas quand c'est visible -->
<button class="NavigationMain-menuToggle">Menu</button>
```

### 6.4 Container Queries : convention `container-name`

Lorsque vous utilisez les Container Queries, la convention ROCS recommande de dériver le `container-name` du nom du Bloc en **kebab-case** :

| Classe ROCS | `container-name` |
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

### 6.5 Sélecteurs d'état parent → enfant : `:where()` obligatoire

Lorsqu'un attribut d'état porté par un Bloc parent affecte le style d'un enfant, le sélecteur descendant **DOIT** utiliser `:where()` (§6.2.2) :

```scss
// ✅ Correct : :where() préserve la spécificité de l'enfant
.CookiesConsentModal[open] :where(.CookiesConsentModal-content) {
  animation: scaleUp 0.3s ease-out;
}

.ProductFaqAccordion-trigger[aria-expanded="true"] :where(.ProductFaqAccordion-icon) {
  transform: rotate(180deg);
}

// ❌ Interdit : spécificité gonflée par le parent
.CookiesConsentModal[open] .CookiesConsentModal-content {
  animation: scaleUp 0.3s ease-out;
}
```

---

## 7. VS Code : snippets et extensions

### 7.1 Extensions recommandées

Créez `.vscode/extensions.json` :

```json
{
  "recommendations": [
    "stylelint.vscode-stylelint",
    "dbaeumer.vscode-eslint"
  ]
}
```

### 7.2 Snippets ROCS

Créez `.vscode/rocs.code-snippets` :

```json
{
  "ROCS Bloc": {
    "prefix": "rocs-bloc",
    "body": [
      ".${1:BlocName} {",
      "  $0",
      "}"
    ],
    "description": "Bloc ROCS (PascalCase)"
  },
  "ROCS Élément": {
    "prefix": "rocs-element",
    "body": [
      ".${1:BlocName}-${2:element} {",
      "  $0",
      "}"
    ],
    "description": "Élément ROCS (Bloc-camelCase)"
  },
  "ROCS État data-*": {
    "prefix": "rocs-state",
    "body": [
      ".${1:BlocName}[data-${2:state}=\"${3:value}\"] {",
      "  $0",
      "}"
    ],
    "description": "Sélecteur d'état dynamique data-*"
  },
  "ROCS État + enfant :where()": {
    "prefix": "rocs-state-child",
    "body": [
      ".${1:BlocName}[${2:data-state}=\"${3:value}\"] :where(.${1:BlocName}-${4:element}) {",
      "  $0",
      "}"
    ],
    "description": "État parent → enfant avec :where() (§6.2.2)"
  }
}
```

---

## Ressources

- **Spécification normative** : [`SPECIFICATION.md`](./SPECIFICATION.md)
- **Aide-mémoire** : [`CHEATSHEET.md`](./CHEATSHEET.md)
- **Glossaire** : [`GLOSSARY.md`](./GLOSSARY.md)
- **Exemples annotés** : [`examples/`](../../examples/)
- **Guide de migration** : [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)

---

**Licence** : MIT
**Version** : 1.0.0
