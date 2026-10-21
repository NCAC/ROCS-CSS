# Comparison — ROCS, BEM, and Atomic CSS

> **Informative** document (non-normative). ROCS rules are in [`SPECIFICATION.md`](./SPECIFICATION.md). To migrate an existing project, see [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md).

ROCS, BEM, and Atomic CSS (here understood in its **utility-first** sense: Tailwind, Bootstrap utilities, Tachyons…) all answer the same question — *how should we organize HTML and CSS so a project remains maintainable?* — but with **three different answers** about where style knowledge lives and what HTML should say. None is universally superior: each optimizes a different axis.

This document compares the three on concrete axes, shows the **same component** rendered in each convention, then indicates in which contexts each is more appropriate.

## Table of contents

1. [The three philosophies in one sentence](#1-the-three-philosophies-in-one-sentence)
2. [Comparison table](#2-comparison-table)
3. [Note on BEM: a convention without an architectural decision](#3-note-on-bem-a-convention-without-an-architectural-decision)
4. [The same component rendered in the three conventions](#4-the-same-component-rendered-in-the-three-conventions)
5. [When to choose what](#5-when-to-choose-what)
6. [See also](#6-see-also)

---

## 1. The three philosophies in one sentence

- **Atomic CSS (utility-first)** — *HTML composes the style from utility classes provided by a library (Tailwind, Bootstrap…).* Visual knowledge lives in the **`class` attribute**. The CSS is largely written once and for all (by the library) and purged at build time.
- **BEM** — *HTML declares components (`Block`, `__Element`, `--modifier`); CSS defines the appearance of each component.* Visual knowledge lives in the **component's CSS**, but variants and states bubble back into HTML through modifiers.
- **ROCS** — *HTML declares a local role (0 or 1 class per element); all styling and composition live in CSS.* Visual knowledge lives in **CSS alone**. HTML stays stable even when presentation changes.

> **Note.** The definition of a "Block" in BEM is intentionally open: depending on the team, it can refer to a reusable UI component (`.button`, `.modal`) or to an applicative context (`.product-card`). This openness has important practical consequences — see the [Note on BEM](#3-note-on-bem-a-convention-without-an-architectural-decision) after the table.

---

## 2. Comparison table

### Philosophy & role of the class

| Axis | Atomic CSS (Tailwind/Bootstrap) | BEM | ROCS |
|---|---|---|---|
| Primary objective | Writing speed, prototyping, fast delivery | Naming convention to structure a CSS project | HTML readability and long-term maintainability |
| Fundamental priority | Integration speed | Shared, explicit convention | Stability of the HTML artifact |
| Role of the CSS class | Atomic visual property (`p-4`, `text-lg`) | Component or component variant | Local role within an applicative context |
| Where style is composed | In HTML (`class="…"`) | Shared: structure in CSS, variants/states in HTML | In CSS only (mixins, placeholders, tokens) |
| Where reuse happens | HTML (repeated classes) | CSS (Block reused) + HTML (mixin of classes) | CSS (mixins / placeholders) |

### Reading HTML

| Axis | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| HTML readability without knowing the convention | Low — `class` describes appearance, not role | Medium — role is readable but blurred by modifiers | High — the class names the role |
| Cognitive load when reading HTML | High (volume of classes per element) | Moderate (`__` / `--` grammar to internalize) | Low once the convention is learned (long but literal names) |
| HTML ↔ appearance coupling | Strong (changing appearance ⇒ rewriting `class`) | Medium (visual modifiers live in HTML) | Weak (HTML describes only the role) |

### CSS architecture & states

| Axis | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Selector specificity | Atomic (one class = one rule), very low | Variable, depends on discipline | Bounded to 0,1,0 by construction |
| Risk of unintended cascade | Very low (independent utilities) | Real if descendants are nested (`.Block .Block__el`) | Very low (self-contained selectors) |
| State handling | Prefixed variants (`hover:`, `focus:`, `data-[state=open]:`) | `--state` modifiers added in HTML | Native HTML attributes, ARIA, pseudo-classes; `data-*` for JS-driven dynamic states |
| Structure / state separation | Low (same utilities everywhere) | Mixed (state bubbles up into `class`) | Clear (state is an attribute, not a class) |

### Refactors & maintenance

| Axis | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Visual redesign without touching HTML | Difficult (classes describe appearance) | Partial (visual variants live in HTML) | Native (CSS changes, HTML doesn't move) |
| Semantic rename (rename a role) without touching CSS | Not applicable (HTML carries no role) | Renaming a Block ⇒ HTML + CSS | Renaming a Block ⇒ HTML + CSS, but local scope and tooled |
| Cold readability (6 months later) | Low — you must decode the `class` | Medium — grammar helps but modifiers blur | High — the class reads as the role |
| Initial learning cost | Moderate to high (memorize the library's vocabulary) | Low (3 conventions: Block, Element, Modifier) | Moderate (strict but few rules) |

### Tooling & ecosystem

| Axis | Atomic CSS | BEM | ROCS |
|---|---|---|---|
| Native tooling | Very rich (Tailwind, plugins, IntelliSense, JIT) | No official tool — conventions to internalize | Stylelint + ESLint + custom validator (this repo) |
| Final CSS bundle | Very small after purge (only used classes are emitted) | Depends on discipline (CSS hand-written) | Depends on discipline (CSS hand-written, factorized via mixins) |
| Coupling to a third-party vendor | Strong (style API = library's API) | None | None |
| Ecosystem (ready-made components, themes) | Very rich | Moderate | Emerging |

---

## 3. Note on BEM: a convention without an architectural decision

Atomic CSS and ROCS each answer **explicitly** a structuring question — *where does style composition happen?*:

- **Atomic CSS** answers: in HTML, by stacking utility classes.
- **ROCS** answers: in CSS, via mixins and placeholders; HTML carries only a role.

**BEM does not answer this question.** It provides a grammar (`Block__Element--modifier`) but leaves it up to the team to decide what a Block is. As a result, two "100 % BEM" projects can be radically different in spirit: one treats Block as a **reusable UI primitive** (`.button`, `.modal`, `.input`) — BEM plays the role of an implicit design system —, the other as an **applicative feature** (`.product-card`, `.checkout-form`) — BEM plays the role of a semantic taxonomy. Both are BEM-compliant.

### 3.1 The two attractor poles

On a long-lived project, two pressures pull in opposite directions:

1. **DRY pressure** — *"I'm writing the same button styling in 10 places, let's factorize"* → drift toward UI primitives (`.button`, `.button--primary`).
2. **Semantic pressure** — *"this button in the cart carries a particular role"* → contextual modifiers or Block combinations (`class="button button--primary product-card__cta"`) → drift toward context.

Without a rule to decide, the developer arbitrates case by case. A codebase often ends up mixing both registers, with no way to predict what kind a given Block represents until you read its definition.

### 3.2 The daily cost: naming an element

A developer who has to name a new BEM class has **no procedure**. The grammar tells them *how to write* the name, not *what to represent*. Faced with a new element, they must decide alone:

- Standalone Block, or Element of an existing Block?
- If a Block: named after its shape (`.card`), its role (`.product-card`), or its location (`.sidebar-item`)?
- If an Element: attached to which Block among several candidate parents in the page?
- Visual variant: modifier, new Block, or Block combination?

Lacking a rule, the developer falls back on **archaeology** (looking at what has already been done in the project), intuition, or a colleague. The convention is then transmitted by imitation of the early naming decisions, which implicitly lock the architecture for the project's lifetime — without that architecture ever having been written or arbitrated explicitly. When the team rotates, this transmission mode becomes a real cost: every newcomer must reconstruct the tacit rules by reading existing code.

### 3.3 Empirical evidence: derived conventions

Most major BEM adoptions have added a **complementary layer** to fill this gap:

- **ITCSS** (Harry Roberts) — namespace prefixes `o-` (object), `c-` (component), `u-` (utility), `is-` (state), `js-` (JS hook) to make explicit what a Block represents.
- **BEMIT** — combines ITCSS and BEM to clarify the taxonomy.
- **SUIT CSS** — fixes Block = component (syntax `PascalCase-camelCase--modifier`).
- **rscss** — leans the other way, more semantic and contextual.

These conventions exist **precisely because BEM doesn't decide**. They patch an under-specification that is structural, not accidental.

### 3.4 A fair reading

This note is not a condemnation. BEM is a **naming convention that leaves architecture open**: that's a valuable degree of freedom in some contexts (stable, experienced team, fixed scope, short project) and a cost in others (rotating team, long lifecycle, multiple redesigns). BEM was designed at Yandex for a context with very strong internal discipline, where this openness didn't bite. The difficulty mostly arises when BEM is adopted *without* the structuring discipline that came with it originally.

Atomic CSS and ROCS each take **a side** on the question — opposing but explicit. BEM chooses not to choose: that's a defensible choice, but one to be aware of when adopting the method.

---

## 4. The same component rendered in the three conventions

To make the differences concrete, here is the same `ProductCard` (header with badge and favorite button, image, title, description, price, CTA) in the three conventions.

### 4.1 Atomic CSS version (Tailwind)

```html
<article class="bg-white border-2 border-emerald-500 rounded-lg shadow-sm hover:shadow-md p-6 grid gap-4 transition-shadow">
  <div class="flex items-center justify-between">
    <span class="px-2 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-white rounded">
      New
    </span>
    <button class="bg-transparent border-0 text-2xl text-gray-500 hover:text-red-500 cursor-pointer"
            aria-label="Add to favorites">♥</button>
  </div>

  <img class="w-full aspect-[4/3] object-cover rounded-lg" src="…" alt="Sample product">

  <div class="grid gap-3">
    <h3 class="text-xl font-semibold text-gray-900">Product name</h3>
    <p class="text-sm text-gray-500 leading-relaxed line-clamp-3">
      Short description of the product with a few important details.
    </p>
    <div class="flex items-center justify-between mt-2">
      <span class="text-2xl font-bold text-emerald-500">$49.99</span>
      <button class="px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
        Add to cart
      </button>
    </div>
  </div>
</article>
```

**What you read**: the exact styling (colors, spacing, sizes). The **business role** (product card, badge, CTA) must be inferred from the HTML structure and labels. Redesigning the appearance without touching HTML is hard — the classes *are* the appearance.

### 4.2 BEM version

```html
<article class="product-card product-card--featured">
  <div class="product-card__header">
    <span class="product-card__badge product-card__badge--new">New</span>
    <button class="product-card__favorite" aria-label="Add to favorites">♥</button>
  </div>

  <img class="product-card__media" src="…" alt="Sample product">

  <div class="product-card__content">
    <h3 class="product-card__title">Product name</h3>
    <p class="product-card__description">
      Short description of the product with a few important details.
    </p>
    <div class="product-card__footer">
      <span class="product-card__price product-card__price--highlight">$49.99</span>
      <button class="product-card__cta product-card__cta--primary">
        Add to cart
      </button>
    </div>
  </div>
</article>
```

**What you read**: the role of each element (`__header`, `__title`, `__cta`) and its variants (`--featured`, `--primary`). HTML stays consistent even when appearance changes, but **visual variants** (`--primary`, `--highlight`) bubble up into `class`: redesigning the visual palette forces touching HTML to adjust or remove modifiers.

### 4.3 ROCS version

```html
<article class="ProductCard" data-featured>
  <div class="ProductCard-header">
    <span class="ProductCard-headerBadge">New</span>
    <button class="ProductCard-headerFavorite" aria-label="Add to favorites">♥</button>
  </div>

  <img class="ProductCard-media" src="…" alt="Sample product">

  <div class="ProductCard-content">
    <h3 class="ProductCard-title">Product name</h3>
    <p class="ProductCard-description">
      Short description of the product with a few important details.
    </p>
    <div class="ProductCard-footer">
      <span class="ProductCard-price" data-tone="highlight">$49.99</span>
      <button class="ProductCard-cta">Add to cart</button>
    </div>
  </div>
</article>
```

**What you read**: only the role. No visual-variant class — `data-featured` is a positional boolean attribute, `data-tone="highlight"` is a client-side parameter. The **CSS** defines what "featured" and "highlight" mean visually; redesigning the visual palette doesn't touch HTML.

> See the full example (with SCSS and `data-state="expanded"` state) in [`examples/ProductCard/`](../../examples/ProductCard/).

---

## 5. When to choose what

None of the three approaches disqualifies the others. The choice depends on the **shape of the project**, the **team**, and the **expected lifecycle**.

### Atomic CSS / utility-first is more appropriate when…

- The project prioritizes **integration speed** (prototypes, MVP, design still in flux).
- The team is **front-only** and masters the library's ecosystem (especially Tailwind).
- HTML is **dynamically generated** by components (React, Vue, Svelte) where the class is read only at build time, not inspected in production.
- A **minimal CSS bundle** is a strong priority (aggressive purging).
- The design system is **provided** by the library or a layer on top (Headless UI + Tailwind, shadcn/ui…).

### BEM is more appropriate when…

- The project's scope is a **distributable UI component library**, where "Block = primitive component" aligns naturally and modifiers document the component's variants.
- The team values the **familiarity** of a convention widely adopted in the industry: faster onboarding for already-trained integrators, abundance of resources and literature.
- The team **accepts that visual variants live in HTML** (`--primary`, `--featured`) rather than being encapsulated in CSS — a model close to an explicit design system.
- The project **does not seek to enforce an architectural stance** (Block = component *or* context); the flexibility of the Block definition is seen as an asset (see §3). Conversely, if the project **explicitly fixes** that stance and sticks to it, BEM fits; without that choice, you inherit the ambiguity described above.

### ROCS is more appropriate when…

- HTML is **server-rendered** or **statically generated** (Drupal, WordPress, Symfony/Twig, Django, Rails, Hugo, 11ty, Astro, Next.js SSR…) and forms a **stable artifact that is inspected and versioned**.
- The project targets a **long lifecycle** with **multiple visual redesigns** planned without rewriting templates.
- The team values HTML that is **readable by non-developers** (QA, design, SEO, accessibility).
- The business scope is **applicative** rather than "distributable component library".
- The project wants a **self-contained HTML/CSS convention**, with no dependency on a third-party library or CSS framework.
- The team is **mixed** (front + back) and wants a grammar that reads equally well in an SSR template (Twig, Django, Rails) and in an SSR component (Next.js, Nuxt).
- The team accepts aligning on a **discipline framed by the specification** and supported by tooling (linter, validator, CI) — more rules than BEM, but explicit and checkable, which especially helps rotating teams (the spec replaces archaeology).

### In practice

The three approaches **can coexist** in a single project during a transition (see [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md)). A team can also choose ROCS for the **HTML they control** and accept that a third-party framework imposes utility classes outside the scope — ROCS explicitly covers this case (§ "out-of-scope" classes).

---

## 6. See also

- [`SPECIFICATION.md`](./SPECIFICATION.md) — normative ROCS rules
- [`MIGRATION_GUIDE.md`](./MIGRATION_GUIDE.md) — moving from a BEM, OOCSS, or Tailwind project to ROCS, step by step
- [`GLOSSARY.md`](./GLOSSARY.md) — precise definitions of "Block", "Element", "modifier", etc.
- [`examples/ProductCard/`](../../examples/ProductCard/) — the full example in ROCS, with annotated SCSS
