# ROCS Glossary

**Version 1.0** · [Specification](./SPECIFICATION.md)

> Definitions of terms used in the ROCS specification and documentation. Definitions marked *(normative)* are binding; others are *(informative)*.

---

## A

### ARIA attributes *(informative)*
WAI-ARIA attributes (`aria-expanded`, `aria-hidden`, `aria-current`, etc.) used to express accessibility states. In ROCS, they are a preferred mechanism for expressing dynamic states alongside `data-*` attributes, and **MAY** be targeted in CSS selectors.

---

## B

### Block *(normative)*
A **level 1** ROCS class (no hyphen) representing an **autonomous semantic unit**: a business context, a feature, a content module.

**Pattern**: `^[A-Z][a-zA-Z0-9]*$` (PascalCase, max 4 segments)

**Examples**: `ProductCard`, `BestSellersBooks`, `CookiesConsentModal`, `CheckoutSummary`

**What a Block is NOT**:
- A generic design system component (`Button`, `Modal`, `Card`, `Input`) — these are reusable mechanisms, not application contexts
- A purely layout element with no business role

See also: [Element](#element-normative), [Promotion](#promotion-normative)

---

## C

### CSS Cascade *(informative)*
The CSS mechanism for resolving style conflicts. ROCS aims to **tame** the cascade through low, consistent specificity (simple classes, no `id`, no `!important`).

### Controlled HTML *(normative)*
HTML produced and maintained by the development team (as opposed to classes imposed by a framework or third-party component). Only controlled HTML is subject to ROCS rules.

### Contextual metadata *(normative)*
Information characterizing a **configuration or layout parameter** (number of items, orientation, columns, device type) without defining the element's semantic role. Persistent but non-semantic.

Three criteria for a `data-*` to qualify as contextual metadata (§4.2):
1. Does not encode a semantic variant/category
2. Does not encode a design system style
3. A separate ROCS class per value would be unreasonable

**Examples**: `data-columns="3"`, `data-articles-length="6"`, `data-device-type="mobile"`

**CSS usage**: combined selectors allowed with mandatory `:where()`.

### Contextual metadata — global *(normative)*
Contextual metadata carried by `body`, `html`, or `:root`. Characterizes the technical environment of the entire page (viewport, theme, browser capabilities).

**Examples**: `data-theme="dark"` (on `body`, modifiable client-side), `data-device-type="mobile"`

---

## D

### `data-*` *(normative)*
A free-form HTML attribute reserved, in ROCS, for three uses:
1. **Dynamic states/parameters** driven by JavaScript
2. **Contextual metadata** (layout/configuration parameters)
3. **Stable JS hooks** (analytics, testing) — MUST NOT be targeted in CSS

**Forbidden**: encoding a [persistent context](#persistent-context-static-normative) or a [semantic variant](#semantic-variant-normative).

### Depth *(normative)*
The number of segments composing a Block name (in PascalCase) or an Element name (in camelCase).

| Type | Max | Example (conforming) |
|------|-----|----------------------|
| Block | 4 segments | `ProductCheckoutSummary` (3) |
| Element | 3 segments | `closeButton` (2), `headerTitleBadge` (3) |

### Design system (DS) *(informative)*
A library of generic, reusable UI components (`Button`, `Input`, `Modal`, `Card`, etc.). In ROCS, DS classes are **not** application-level ROCS classes. DS styles are integrated via CSS composition (mixins), never via HTML classes.

### Dynamic state/parameter *(normative)*
Information stored in the DOM as a `data-*` attribute whose value **may change** during the page lifecycle and **is actually modified by JavaScript**.

**Examples**: `data-state="open"`, `data-active-tab="2"`, `data-gallery-index="0"`

See also: [Persistent context](#persistent-context-static-normative)

---

## E

### Element *(normative)*
A **level 2** ROCS class (format `Block-element`) representing a **local role** within a Block.

**Pattern**: `^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$`

**Max depth**: 3 camelCase segments after the hyphen

**Examples**: `ProductCard-title`, `CookiesConsentModal-closeButton`, `ProductCard-headerBadge`

**Important**: the name expresses the semantic role, not the position in the DOM tree.

See also: [Block](#block-normative), [Promotion](#promotion-normative)

---

## I

### `id` *(normative)*
An HTML attribute reserved, in ROCS, for **JavaScript targeting** and **anchors/navigation**. `id` selectors **MUST NEVER** appear in CSS selectors (§5).

---

## M

### BEM Modifier *(informative)*
The `--modifier` suffix from the BEM methodology used to create visual variants. This concept **does not exist in ROCS**: it is replaced by distinct ROCS classes (semantic variants) or dynamic `data-*` attributes (states/visual variants).

---

## P

### PascalCase *(normative)*
A naming convention where each word starts with an uppercase letter, with no separator: `ProductCard`, `BestSellersBooks`, `CookiesConsentModal`.

Mandatory convention for **ROCS Blocks**.

### Persistent context (static) *(normative)*
Information that characterizes content/object permanently (business type, semantic category) and whose value **does not change** during the page lifecycle. **MUST be expressed as a ROCS class**, never as a `data-*`.

See also: [Dynamic state/parameter](#dynamic-stateparameter-normative)

### Promotion *(normative)*
The transformation of an [Element](#element-normative) into a standalone [Block](#block-normative), recommended when the Element exceeds ~3 styled descendants, is reused across multiple Blocks, or carries autonomous logic.

```html
<!-- Before promotion -->
<div class="ProductGallery-header">
  <h2 class="ProductGallery-headerTitle">…</h2>
</div>

<!-- After promotion -->
<div class="ProductGalleryHeader">
  <h2 class="ProductGalleryHeader-title">…</h2>
</div>
```

---

## R

### ROCS class *(normative)*
A CSS class that satisfies the syntax, semantics, and depth constraints defined in §0.3.1 of the specification. A ROCS class expresses a **role or context**, never a visual style.

**Types**: [Block](#block-normative), [Element](#element-normative)

### Role *(normative)*
The functional meaning of an element in the document — **what it is / what it does** — independently of styling. This is what a ROCS class name must express.

> Example: "title of the Best Sellers section" → `BestSellersBooks-title`

---

## S

### Scope of application *(normative)*
ROCS applies to HTML **controlled** by the team. Third-party components, framework classes, and technical classes are **out of scope** but may coexist alongside a ROCS class.

### Self-sufficiency *(normative)*
A property of a ROCS class: its styles **do not depend on any implicit parent context**. Each class is styled independently in the CSS.

```css
/* ✅ Self-sufficient */
.ProductCard-title { font-size: 1.5rem; }

/* ❌ Dependent on a parent (forbidden — ROCS §6.2.1) */
.ProductCard .ProductCard-title { font-size: 1.5rem; }
```

### Self-sufficient selector *(normative)*
See [Self-sufficiency](#self-sufficiency-normative).

### Semantic variant *(normative)*
A variation that **changes the semantic nature** of an element (its role, its business category). A semantic variant **MUST be expressed as a distinct ROCS class**, never as a `data-*`.

**Test**: *"Does this information change what the element is?"*
- `ProductCard` for books vs DVDs → semantic variants → `ProductCardBook`, `ProductCardDvd` ✅
- `ProductGrid` with 1, 2, or 3 columns → layout parameter → `data-columns="3"` ✅

### Specificity *(normative)*
The weight of a CSS selector. ROCS recommends **low, consistent specificity** (0,1,0 for classes, 0,2,0 maximum for allowed combined selectors) to ensure cascade predictability.

### SSR (Server-Side Rendering) *(informative)*
Server-side HTML rendering. ROCS is particularly well suited to SSR architectures because HTML is the stable artifact. `data-*` attributes initialized server-side but modified client-side remain conforming (dynamic state).

### State class *(normative)*
A CSS class encoding a dynamic state (e.g., `is-active`, `has-error`, `--open`). **Forbidden in ROCS** (§3.5). Replaced by native attributes, ARIA, or dynamic `data-*` attributes.

### Style composition *(normative)*
A technique for applying multiple visual rules to an element. In ROCS, composition is done **exclusively in the CSS** (Sass mixins, `@extend`, custom properties) and **never** in the HTML `class` attribute.

---

## U

### Utility classes *(informative)*
Single-property or visual composition CSS classes (e.g., `.flex`, `.p-4`, `.text-blue`). **Forbidden in ROCS-controlled HTML** (§2.3). Composition is done in the CSS via mixins/placeholders.

---

## W

### `:where()` *(normative)*
A zero-specificity CSS pseudo-class. **Mandatory** in ROCS for allowed combined selectors (contextual metadata, global context), in order to preserve the self-sufficiency of the targeted Block.

```css
/* ✅ :where() mandatory */
.ProductGrid-list[data-columns="3"] :where(.ProductGrid-item) { width: 33%; }

/* ❌ Without :where(): specificity too high */
.ProductGrid-list[data-columns="3"] .ProductGrid-item { width: 33%; }
```

---

*Last updated: version 1.0*
