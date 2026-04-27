# Migration Guide to ROCS

**Version 1.0** · [Specification](./SPECIFICATION.md) · [Cheat Sheet](./CHEATSHEET.md)

> This guide helps teams migrate an existing project (BEM, OOCSS, Tailwind, custom naming) to ROCS. It is **informative**: the normative rules are in `SPECIFICATION.md`.

---

## Table of contents

1. [Migration principles](#1-migration-principles)
2. [From BEM](#2-from-bem)
3. [From OOCSS / utility classes](#3-from-oocss--utility-classes)
4. [From Tailwind CSS](#4-from-tailwind-css)
5. [From custom naming](#5-from-custom-naming)
6. [Progressive migration](#6-progressive-migration)
7. [Migration checklist](#7-migration-checklist)

---

## 1. Migration principles

### What fundamentally changes
| Concept | Before (BEM/OOCSS) | After (ROCS) |
|---------|---------------------|-------------|
| Visual composition | In HTML classes | In CSS (mixins/placeholders) |
| States | `--modifier`, `is-active` | Dynamic `data-*` / ARIA |
| Variants | Multiple classes per element | Single ROCS class + contextual CSS |
| Reuse | Share classes in HTML | Share mixins in CSS |
| Selectors | Chained (`.Block .Element`) | Self-sufficient (`.Block-element`) |

### What stays the same
- Semantic HTML structure (tags, ARIA, `id` for anchors)
- CSS custom properties
- CSS mechanisms (media queries, @container, transitions)
- File organization

### Golden rule of migration
> **Always ask: "What is the functional role of this element?"**
> Not its appearance, not its position in the DOM — its *role for the user*.

---

## 2. From BEM

### 2.1 Block / Element / Modifier mapping

| BEM | ROCS | Notes |
|-----|------|-------|
| `.block` | `Block` (PascalCase) | Rename to PascalCase |
| `.block__element` | `Block-element` (camelCase) | `__` → `-`, camelCase |
| `.block--modifier` | Removed from HTML | Move logic to CSS |
| `.block--modifier` (state) | `data-state="..."` | JS-driven |
| `.block--modifier` (variant) | Distinct ROCS class OR contextual `data-*` | See below |

### 2.2 Step-by-step migration

#### Step 1: Rename Blocks
```html
<!-- BEM -->
<article class="product-card">…</article>

<!-- ROCS -->
<article class="ProductCard">…</article>
```

#### Step 2: Rename Elements
```html
<!-- BEM -->
<h3 class="product-card__title">…</h3>
<button class="product-card__cta">…</button>
<div class="product-card__footer">…</div>

<!-- ROCS -->
<h3 class="ProductCard-title">…</h3>
<button class="ProductCard-cta">…</button>
<div class="ProductCard-footer">…</div>
```

#### Step 3: Handle modifiers

**Semantic variant modifier → Distinct ROCS class** (the variant changes *meaning*):
```html
<!-- BEM: variant via modifier -->
<article class="product-card product-card--book">…</article>
<article class="product-card product-card--dvd">…</article>

<!-- ROCS: distinct class per semantic variant -->
<article class="ProductCardBook">…</article>
<article class="ProductCardDvd">…</article>
```

**Presentation modifier → Composition in CSS** (the variant changes *appearance*):
```html
<!-- BEM: style modifier in HTML -->
<button class="product-card__cta product-card__cta--primary product-card__cta--large">
  Add
</button>

<!-- ROCS: 1 class, composition in CSS -->
<button class="ProductCard-cta">Add</button>
```
```scss
// ROCS CSS: composition in SCSS
.ProductCard-cta {
  @include btn_primary();
  @include btn_large();
}
```

**State modifier → Dynamic `data-*` or ARIA attribute**:
```html
<!-- BEM: state modifier in HTML -->
<nav class="site-navigation site-navigation--open">…</nav>
<button class="accordion__trigger accordion__trigger--active">…</button>
<input class="form__input form__input--error">

<!-- ROCS: native attributes / data-* -->
<nav class="SiteNavigation" data-state="open">…</nav>
<button class="AccordionSection-trigger" aria-expanded="true">…</button>
<input class="LoginForm-input" aria-invalid="true">
```
```css
/* ROCS CSS */
.SiteNavigation[data-state="open"] { /* open styles */ }
.AccordionSection-trigger[aria-expanded="true"] { /* active styles */ }
.LoginForm-input[aria-invalid="true"] { /* error styles */ }
```

### 2.3 BEM mixin "helper classes"
```html
<!-- BEM: mixin (1 class from another block) -->
<div class="product-card__footer text text--small">…</div>

<!-- ROCS: 1 class, CSS composition -->
<div class="ProductCard-footer">…</div>
```
```scss
.ProductCard-footer {
  @include text_small(); // mixin comes from the design system
}
```

### 2.4 CSS selector migration

```scss
// ❌ BEM: chained selectors
.product-card { … }
.product-card__title { … }
.product-card .product-card__title { … } // contextual dependency

// ✅ ROCS: self-sufficient
.ProductCard { … }
.ProductCard-title { … }
// No descendant selector needed
```

```scss
// ❌ BEM: modifier in selectors
.product-card--featured .product-card__title { font-size: 2rem; }

// ✅ ROCS: data-* + :where()
.ProductCard[data-variant="featured"] .ProductCard-title { … } // ❌ still BEM-style
// Or, if "featured" is a semantic variant:
.ProductCardFeatured-title { font-size: 2rem; } // ✅ ROCS
// Or, if it's a dynamic state:
.ProductCard[data-variant="featured"] :where(.ProductCard-title) { … } // ✅ with :where()
```

---

## 3. From OOCSS / utility classes

### 3.1 The problem: composition in HTML

```html
<!-- OOCSS / Atomic CSS: composition in the class attribute -->
<article class="card card--large shadow-md rounded-lg p-6 flex flex-col gap-4">
  <h3 class="text-xl font-bold text-gray-900 mb-2">Title</h3>
  <button class="btn btn-primary btn-cta rounded-full px-8 py-3 font-bold">
    Add
  </button>
</article>
```

**Problems**:
- Visual redesign → modify every HTML element
- Zero readability in the source code
- Tight coupling between HTML and CSS

### 3.2 The ROCS solution: move it to CSS

```html
<!-- ROCS: stable, descriptive HTML -->
<article class="ProductCard">
  <h3 class="ProductCard-title">Title</h3>
  <button class="ProductCard-cta">Add</button>
</article>
```

```scss
// ROCS CSS: all composition here
.ProductCard {
  @include card_large();
  @include shadow_md();
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ProductCard-title {
  @include text_xl();
  font-weight: bold;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.ProductCard-cta {
  @include btn_primary();
  @include btn_cta();
  border-radius: 9999px;
  padding: 0.75rem 2rem;
  font-weight: bold;
}
```

---

## 4. From Tailwind CSS

### 4.1 Migration strategy

Tailwind and ROCS have opposite philosophies on **where** composition happens. Migration involves:

1. **Identifying** semantic components (recurring content blocks)
2. **Extracting** Tailwind classes into ROCS-named SCSS
3. **Reducing** the `class` attribute to a single ROCS class
4. **Keeping** Tailwind only if imposed by a framework (out of ROCS scope)

### 4.2 Migration example

```html
<!-- Tailwind -->
<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white">
  <img class="w-full h-48 object-cover" src="…" alt="…">
  <div class="px-6 py-4">
    <h3 class="font-bold text-xl mb-2 text-gray-900">Title</h3>
    <p class="text-gray-700 text-base">Description</p>
  </div>
  <div class="px-6 pt-4 pb-2 flex gap-2">
    <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm">Tag 1</span>
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      View product
    </button>
  </div>
</div>
```

```html
<!-- ROCS -->
<article class="ProductCard">
  <img class="ProductCard-media" src="…" alt="…">
  <div class="ProductCard-body">
    <h3 class="ProductCard-title">Title</h3>
    <p class="ProductCard-description">Description</p>
  </div>
  <div class="ProductCard-footer">
    <span class="ProductCard-tag">Tag 1</span>
    <button class="ProductCard-cta">View product</button>
  </div>
</article>
```

```scss
// ProductCard.scss
.ProductCard {
  max-width: 24rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  background: white;
}

.ProductCard-media {
  width: 100%;
  height: 12rem;
  object-fit: cover;
}

.ProductCard-body {
  padding: 1.5rem;
}

.ProductCard-title {
  font-weight: bold;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-gray-900);
}

.ProductCard-description {
  color: var(--color-gray-700);
}

.ProductCard-footer {
  padding: 1rem 1.5rem 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.ProductCard-tag {
  display: inline-block;
  background: var(--color-gray-200);
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
}

.ProductCard-cta {
  @include btn_primary();
}
```

### 4.3 Temporary coexistence

During migration, Tailwind and ROCS can coexist:

```html
<!-- ✅ Acceptable during transition: 1 ROCS class + framework-imposed Tailwind classes -->
<!-- Tailwind classes are "out of ROCS scope" if imposed by the tool -->
<div class="ProductCard tw-flex tw-flex-col">…</div>
```

> **Important**: Tailwind composition classes must never be the sole style hooks (no Tailwind targeting in ROCS CSS). The goal is to arrive at a single ROCS class per element.

---

## 5. From custom naming

### 5.1 Common patterns and their ROCS equivalents

| Custom pattern | Problem | ROCS |
|---------------|---------|------|
| `.section-product-title` | kebab-case, DOM hierarchy | `ProductSection-title` |
| `.js-open-modal` | JS hook in a style class | `data-action="open-modal"` (pure JS) |
| `.product.featured` | multi-class for variant | `FeaturedProduct` or `ProductCard[data-variant="featured"]` |
| `.widget_header` | snake_case forbidden | `Widget-header` |
| `.btn-red` | style in the name | `CheckoutForm-submitButton` (role) + red CSS |
| `.container`, `.wrapper` | generic with no role | Either 0 classes (div with no application role), or `ProductCard-body` |

---

## 6. Progressive migration

### Recommended strategy

Don't migrate everything at once. Adopt an **incremental** approach:

1. **Establish** team conventions (read the spec, hold a naming workshop)
2. **Configure** the tools (Stylelint, ESLint, CI)
3. **Migrate new components** to ROCS from the start
4. **Migrate existing components** during redesigns or bug fixes
5. **Periodic audit** via `node tools/rocs-validate.js --dir ./src`

### Isolate files being migrated

Use Stylelint exclusions for files not yet migrated:

```json
// .stylelintrc.json - temporary exclusion
{
  "extends": ["stylelint-config-standard-scss"],
  "ignoreFiles": [
    "src/legacy/**/*.scss",
    "src/components/old/**/*.scss"
  ]
}
```

### Mark classes "being migrated"

```html
<!-- Temporary comment for legacy classes not yet migrated -->
<!-- TODO ROCS: migrate product-card to ProductCard -->
<article class="product-card">…</article>
```

---

## 7. Migration checklist

### Naming
- [ ] All Blocks are PascalCase (≤ 4 segments)
- [ ] All Elements follow the `Block-camelCase` pattern (≤ 3 segments)
- [ ] No BEM modifiers (`--modifier`) in HTML
- [ ] No state classes (`is-*`, `has-*`) in HTML
- [ ] No snake_case or kebab-case for ROCS classes

### States and interactions
- [ ] Dynamic states use `data-state`, `data-*`, or ARIA attributes
- [ ] Style-targeting `data-*` attributes are actually modified by JS
- [ ] Static semantic variants are distinct ROCS classes

### CSS
- [ ] No `#id` selector in CSS
- [ ] No ROCS descendant selectors (`.Block .Element`)
- [ ] Contextual metadata in CSS uses `:where()`
- [ ] Third-party components are encapsulated in a wrapper Block (max 2 levels)
- [ ] `!important` absent or justified

### HTML
- [ ] Each element carries 0 or 1 ROCS class
- [ ] No composition utility classes in controlled HTML
- [ ] Framework/third-party classes are identifiable (dedicated prefix)

### Tooling
- [ ] Stylelint configured and integrated in CI
- [ ] ESLint configured for JSX/HTML
- [ ] `node tools/rocs-validate.js` passes without errors
- [ ] GitHub Actions configured

---

*For complex cases, see [Appendix B (FAQ)](./SPECIFICATION.md#appendix-b-practical-cases-faq) in the specification.*
