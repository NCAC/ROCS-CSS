# ROCS — Cheat Sheet

**Version 1.0** · [Full Specification](./SPECIFICATION.md) · [Implementation Guide](./IMPLEMENTATION_GUIDE.md)

---

## 1. Class naming

### Block (PascalCase)
```
^[A-Z][a-zA-Z0-9]*$        max 4 segments
```
| ✅ Valid | ❌ Invalid |
|----------|-----------|
| `ProductCard` | `productCard` (lowercase) |
| `BestSellersBooks` | `best-sellers` (kebab) |
| `CookiesConsentModal` | `Button` (generic design system) |
| `CheckoutSummary` | `AccountCheckoutShippingAddressForm` (5 segments) |

### Element (`Block-camelCase`)
```
^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$    max 3 segments after the hyphen
```
| ✅ Valid | ❌ Invalid |
|----------|-----------|
| `ProductCard-title` | `ProductCard-Title` (uppercase) |
| `CookiesConsentModal-closeButton` | `ProductCard_image` (underscore) |
| `ProductCard-headerBadge` | `ProductCard-headerTitleBadgeIcon` (4 segments) |

### Recommended word order
**Business role first, component type second**:
- Blocks: `CookiesConsentModal` ✅ · `ModalCookiesConsent` ❌
- Elements: `closeButton` ✅ · `buttonClose` ❌

---

## 2. Core rule: 0 or 1 ROCS class per element

```html
<!-- ✅ 1 ROCS class -->
<button class="ProductFooter-addToBasket">Add</button>

<!-- ❌ 2 ROCS classes -->
<button class="Button Button--primary">Add</button>

<!-- ✅ 1 ROCS class + 1 framework class (out of scope) -->
<div class="ProductCard v-cloak">…</div>
```

---

## 3. States — Forbidden vs allowed

| ❌ Forbidden | ✅ Allowed | Mechanism |
|-------------|-----------|-----------|
| `class="Nav is-open"` | `data-state="open"` | JS-driven |
| `class="Panel--expanded"` | `aria-expanded="true"` | Native ARIA |
| `class="Btn--disabled"` | `disabled` (HTML attribute) | Native attribute |
| `class="Input--error"` | `data-error="required"` | JS-driven |
| `class="Dialog--loading"` | `data-state="loading"` | JS-driven |

```css
/* Target dynamic states in CSS */
.CheckoutNavigation[data-state="open"] { … }
.ProductFaq-panel[aria-expanded="true"] { … }
.LoginForm-input:invalid { … }
.ProductCard-cta:disabled { … }
```

---

## 4. `data-*` — When to use them?

```
Can the value change client-side?
  ├── YES → Dynamic JS state       → data-state="open" ✅ (can target in CSS)
  └── NO  → Persistent context?
        ├── Semantic variant (business type) → Distinct ROCS class ✅
        │     data-type="book" ❌ → ProductCardBook ✅
        └── Layout parameter (column count, etc.) → Contextual metadata
              data-columns="3" ✅ (target with mandatory :where())
```

**Pure JS hook** (analytics, testid): `data-testid="..."` ✅ but **never targeted in CSS**.

---

## 5. Allowed CSS selectors

```css
/* ✅ Single ROCS class (self-sufficient) */
.ProductCard-title { font-size: 1.5rem; }

/* ✅ Pseudo-classes / pseudo-elements */
.ProductCard-cta:hover { … }
.ProductCard-cta::before { … }

/* ✅ Dynamic JS states */
.CheckoutNavigation[data-state="open"] { … }

/* ✅ Native attributes / ARIA */
.ProductFaq-panel[aria-expanded="true"] { … }
.LoginForm-input:disabled { … }

/* ✅ Contextual metadata — :where() MANDATORY */
.ProductGrid-list[data-columns="3"] :where(.ProductGrid-item) { width: 33.333%; }
body[data-theme="dark"] :where(.EditorialSummary) { … }

/* ✅ Third-party encapsulated (anchored on the ROCS wrapper) */
.HeroSlider .swiper-button-prev { … }

/* ❌ ROCS descendant selector */
.ProductCard .ProductCard-title { … }
/* ❌ Direct child */
.ProductCard > .ProductCard-media { … }
/* ❌ id selector */
#checkout-summary { … }
/* ❌ Metadata without :where() */
.ProductGrid-list[data-columns="3"] .ProductGrid-item { … }
```

---

## 6. Style composition in CSS (never in HTML)

```html
<!-- ❌ Composition in HTML -->
<button class="btn btn-cta btn-primary btn-large">Add</button>

<!-- ✅ 1 ROCS class, composition in CSS -->
<button class="ProductFooter-addToBasket">Add</button>
```

```scss
// ✅ SCSS
.ProductFooter-addToBasket {
  @include btn_cta();
  @include btn_primary();
  @include btn_large();
}
```

---

## 7. Promotion: Element → Block

**Warning sign**: the element has ≥3 styled descendants, is reused elsewhere, or carries autonomous logic.

```html
<!-- Before: too complex as an Element -->
<div class="ProductGallery-header">
  <h2 class="ProductGallery-headerTitle">…</h2>
  <button class="ProductGallery-headerClose">×</button>
  <span class="ProductGallery-headerCount">3/12</span>
</div>

<!-- After: standalone Block -->
<div class="ProductGalleryHeader">
  <h2 class="ProductGalleryHeader-title">…</h2>
  <button class="ProductGalleryHeader-close">×</button>
  <span class="ProductGalleryHeader-count">3/12</span>
</div>
```

---

## 8. Animations

- `@keyframes`: named after the **visual movement** (`fadeIn`, `slideUp`, `scaleUp`)
- **Never** after the business context (`productCardEnter` ❌)

```scss
.ProductCard { animation: slideUp 0.4s var(--ease-out); }
.Modal[open] { animation: fadeIn var(--duration-normal) var(--ease-out); }
.Modal[data-closing] { animation: fadeOut var(--duration-fast) var(--ease-in); }
```

---

## 9. Third-party components

```html
<!-- Encapsulate in a ROCS wrapper Block -->
<div class="HeroSlider">
  <!-- Internal plugin markup, third-party classes unchanged -->
  <div class="swiper">…</div>
</div>
```

```css
/* Third-party selectors anchored on the wrapper, max 2 levels */
.HeroSlider .swiper-button-prev { color: var(--color-primary); }
.HeroSlider .swiper-pagination-bullet { background: white; }
```

---

## 10. Quick decision tree

```
I need to name an HTML element
  ↓
What is its functional role? (what it does for the user)
  ↓
Is it an autonomous semantic unit?
  ├── YES → PascalCase Block    → ProductCard, CheckoutSummary
  └── NO  → Block-camelCase Element → ProductCard-title, CheckoutSummary-total

Does its style need to vary?
  ├── Based on current state (JS changes value)     → data-state="..." + CSS
  ├── Based on a semantic variant (business type)    → New ROCS class
  └── Based on a layout param (column count, etc.)   → data-* + :where() in CSS
```

---

## Tools

```bash
# Lint CSS/SCSS
npx stylelint '**/*.{css,scss}'

# Lint JSX/TSX
npx eslint '**/*.{jsx,tsx}'

# Full ROCS validation
node tools/rocs-validate.js --dir ./src

# Compile examples
npm run compile:examples
```

---

*To learn more: [SPECIFICATION.md](./SPECIFICATION.md) · [GLOSSARY.md](./GLOSSARY.md) · [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)*
