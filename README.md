# ROCS — *Role-Oriented, One-Class CSS Methodology*

**Version 1.0.0**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Stable](https://img.shields.io/badge/Status-Stable-green.svg)]()

> A strict, readable, and scalable CSS methodology.\
> Modern alternative to BEM, OOCSS, and Atomic CSS.

**[🇫🇷 Version française](./README_FR.md)**

---

## 🎯 At a Glance

**ROCS** enforces simple and radical rules:

- ✅ **1 class per element** (no composition)
- ✅ **PascalCase for Blocks** (`BestSellersBooks`)
- ✅ **`data-*` reserved for JS-driven dynamic state/parameters**
- ✅ **Cascade restricted** (Block state → its own elements, plus explicit global context via `:where()`)
- ✅ **Preprocessors required** (mixins, no HTML helpers)
- ✅ **Semantic naming** (role/context, never appearance)

---

## 🚀 Quick Start

### 1. Stylelint (recommended)

```bash
npm install --save-dev stylelint stylelint-config-standard-scss
```

`.stylelintrc.json`:
```json
{
  "extends": "stylelint-config-standard-scss",
  "rules": {
    "selector-max-class": 1,
    "selector-no-qualifying-type": true,
    "no-descending-specificity": true,
    "selector-max-specificity": "0,3,0"
  }
}
```

### 2. HTML Test (optional)

```js
test("One class per element", () => {
  document.querySelectorAll("[class]").forEach(el => {
    expect(el.classList.length).toBeLessThanOrEqual(1);
  });
});
```

---

## 📖 Full Documentation

See **[SPECIFICATION.md](./docs/en/SPECIFICATION.md)** for the detailed specification.

---

## 🆚 Why Not BEM/Atomic CSS?

| Issue | BEM | Atomic CSS | ROCS |
|-------|-----|------------|------|
| Unreadable double dashes | ❌ `.block__el--mod` | ✅ N/A | ✅ `.Block-element` |
| Style in HTML | ✅ No | ❌ **Massive** | ✅ No |
| Redesign without touching HTML | ✅ Yes | ❌ No | ✅ Yes |
| Predictable specificity | ✅ Yes | ⚠️ Variable | ✅ Yes (0,1,0) |

**Real horror case:**
```css
/* Seen in production */
.Context .blue { color: red !important; }
```
→ **Impossible with ROCS** (semantic naming required)

---

## 🧪 Quick Example

```html
<!-- ❌ Atomic CSS: style in HTML -->
<div class="flex items-center justify-between p-4 bg-blue-500 rounded shadow-md">
  <h3 class="text-lg font-bold text-white">Title</h3>
</div>

<!-- ✅ ROCS: semantic role/context (one class) -->
<section class="BestSellersBooks" data-slider-active="true">
  <h2 class="BestSellersBooks-title">Best sellers</h2>
  <div class="BestSellersBooks-slider">...</div>
</section>
```

```scss
// ROCS CSS (with preprocessor)
.BestSellersBooks-title {
  @include section_title();
}

/* JS-driven state/parameters via data-* (dynamic) */
.BestSellersBooks[data-slider-active="true"] .BestSellersBooks-slider {
  @include slider_enabled();
}
```

---

## 🛠 Core Rules

### 1. One class = one unique role/context

```html
<!-- ❌ Forbidden -->
<button class="btn btn-primary btn-large">

<!-- ✅ Required -->
<button class="ProductFooter-addToBasket">Add to cart</button>
```

### 2. Block = PascalCase, Element = Block-element

```html
<section class="BestSellersBooks">
  <h2 class="BestSellersBooks-title">Best sellers</h2>
  <a class="BestSellersBooks-moreLink" href="/books/best-sellers">See all</a>
</section>
```

### 3. `data-*` is for dynamic state/parameters (JS-driven)

```css
/* ✅ Allowed: Block dynamic state influences its own elements */
.Modal[data-open="true"] .Modal-overlay { opacity: 1; }

/* ❌ Forbidden: using data-* as a substitute for "design-system variants" */
/* .Button[data-variant="primary"] { ... } */
```

### 4. Cascade is restricted

```css
/* ✅ Allowed: Block state → its own elements */
.ProductCard[data-expanded="true"] .ProductCard-media { transform: scale(1.05); }

/* ❌ Forbidden: cross-block cascade */
.Sidebar .ProductCard { ... }
```

---

## 🧪 Use Cases

### Element → Block Promotion

```html
<!-- Before: simple element -->
<div class="Slider-header">...</div>

<!-- After: autonomous Block (reusable) -->
<header class="SliderHeader">
  <h2 class="SliderHeader-title">...</h2>
  <button class="SliderHeader-cta">...</button>
</header>
```

**When to promote?**
- Element contains structured children
- Must be reusable elsewhere
- Has independent logic

---

## 📚 Resources

- **[Full Specification](./docs/en/SPECIFICATION.md)** — All detailed rules
- **[Examples](./examples/)** — Real components
- **[Stylelint Config](./.stylelintrc.json)** — Ready to use

---

## 💡 Philosophy

### 1. HTML describes role, CSS describes presentation

```html
<!-- ❌ Anti-pattern -->
<div class="flex justify-center bg-blue-500 p-4">

<!-- ✅ ROCS -->
<div class="Card-header" data-variant="primary">
```

### 2. Readability over brevity

**Code is read 10× more than it's written.**

### 3. Preprocessors are mandatory

Helpers (visually-hidden, flex-center...) are **mixins**, never HTML classes.

```scss
// ❌ Forbidden
<div class="visually-hidden">

// ✅ Required
.ProductCard-info {
  @include visually-hidden;
}
```

---

## 🤝 Contributing

ROCS is **open to contributions**. Your feedback is welcome:

- Open an issue for discussions
- Propose improvements via PR
- Share your use cases

---

## 📄 License

MIT License - Free to use, publish, and adapt.

See [LICENSE](./LICENSE) for details.

---

## 👤 Author

Created by a front-end developer tired of:
- `.block__element--modifier--state--size` (unreadable BEM)
- `class="flex items-center justify-between p-4 bg-blue-500..."` (HTML debt)
- `.Context .blue { color: red !important; }` (technical debt)

**ROCS** = Predictable CSS, semantic HTML, serene redesigns.
