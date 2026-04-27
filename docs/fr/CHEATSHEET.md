# ROCS — Aide-mémoire (*Cheat Sheet*)

**Version 1.0** · [Spécification complète](./SPECIFICATION.md) · [Guide d'implémentation](./IMPLEMENTATION_GUIDE.md)

---

## 1. Nommage des classes

### Bloc (PascalCase)
```
^[A-Z][a-zA-Z0-9]*$        max 4 segments
```
| ✅ Valide | ❌ Invalide |
|-----------|------------|
| `ProductCard` | `productCard` (minuscule) |
| `BestSellersBooks` | `best-sellers` (kebab) |
| `CookiesConsentModal` | `Button` (design system générique) |
| `CheckoutSummary` | `AccountCheckoutShippingAddressForm` (5 segments) |

### Élément (`Bloc-camelCase`)
```
^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$    max 3 segments après le tiret
```
| ✅ Valide | ❌ Invalide |
|-----------|------------|
| `ProductCard-title` | `ProductCard-Title` (majuscule) |
| `CookiesConsentModal-closeButton` | `ProductCard_image` (underscore) |
| `ProductCard-headerBadge` | `ProductCard-headerTitleBadgeIcon` (4 segments) |

### Ordre recommandé
**Rôle métier d'abord, type de composant ensuite** :
- Blocs : `CookiesConsentModal` ✅ · `ModalCookiesConsent` ❌
- Éléments : `closeButton` ✅ · `buttonClose` ❌

---

## 2. Règle fondamentale : 0 ou 1 classe ROCS par élément

```html
<!-- ✅ 1 classe ROCS -->
<button class="ProductFooter-addToBasket">Ajouter</button>

<!-- ❌ 2 classes ROCS -->
<button class="Button Button--primary">Ajouter</button>

<!-- ✅ 1 classe ROCS + 1 classe framework (hors périmètre) -->
<div class="ProductCard v-cloak">…</div>
```

---

## 3. États — Ce qui est interdit vs autorisé

| ❌ Interdit | ✅ Autorisé | Mécanisme |
|-------------|------------|-----------|
| `class="Nav is-open"` | `data-state="open"` | JS pilote |
| `class="Panel--expanded"` | `aria-expanded="true"` | ARIA natif |
| `class="Btn--disabled"` | `disabled` (attribut HTML) | Attribut natif |
| `class="Input--error"` | `data-error="required"` | JS pilote |
| `class="Dialog--loading"` | `data-state="loading"` | JS pilote |

```css
/* Cible les états dynamiques en CSS */
.CheckoutNavigation[data-state="open"] { … }
.ProductFaq-panel[aria-expanded="true"] { … }
.LoginForm-input:invalid { … }
.ProductCard-cta:disabled { … }
```

---

## 4. `data-*` — Quand les utiliser ?

```
Valeur peut changer côté client ?
  ├── OUI → État dynamique JS    → data-state="open" ✅ (peut cibler en CSS)
  └── NON → Contexte persistant ?
        ├── Variant sémantique (type métier) → Classe ROCS distincte ✅
        │     data-type="book" ❌ → ProductCardBook ✅
        └── Paramètre de layout (nb colonnes, etc.) → Métadonnée contextuelle
              data-columns="3" ✅ (cibler avec :where() obligatoire)
```

**Hook JS pur** (analytics, testid) : `data-testid="..."` ✅ mais **jamais ciblé en CSS**.

---

## 5. Sélecteurs CSS autorisés

```css
/* ✅ Classe ROCS seule (auto-suffisante) */
.ProductCard-title { font-size: 1.5rem; }

/* ✅ Pseudo-classes / pseudo-éléments */
.ProductCard-cta:hover { … }
.ProductCard-cta::before { … }

/* ✅ États dynamiques JS */
.CheckoutNavigation[data-state="open"] { … }

/* ✅ Attributs natifs / ARIA */
.ProductFaq-panel[aria-expanded="true"] { … }
.LoginForm-input:disabled { … }

/* ✅ Métadonnée contextuelle — :where() OBLIGATOIRE */
.ProductGrid-list[data-columns="3"] :where(.ProductGrid-item) { width: 33.333%; }
body[data-theme="dark"] :where(.EditorialSummary) { … }

/* ✅ Tiers encapsulé (ancré sur le wrapper ROCS) */
.HeroSlider .swiper-button-prev { … }

/* ❌ Sélecteur descendant ROCS */
.ProductCard .ProductCard-title { … }
/* ❌ Enfant direct */
.ProductCard > .ProductCard-media { … }
/* ❌ Sélecteur id */
#checkout-summary { … }
/* ❌ Métadonnée sans :where() */
.ProductGrid-list[data-columns="3"] .ProductGrid-item { … }
```

---

## 6. Composition côté CSS (jamais dans le HTML)

```html
<!-- ❌ Composition dans le HTML -->
<button class="btn btn-cta btn-primary btn-large">Ajouter</button>

<!-- ✅ 1 classe ROCS, composition dans le CSS -->
<button class="ProductFooter-addToBasket">Ajouter</button>
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

## 7. Promotion Élément → Bloc

**Signal d'alerte** : l'élément a ≥3 descendants stylés, est réutilisé, ou porte une logique autonome.

```html
<!-- Avant : trop complexe comme Élément -->
<div class="ProductGallery-header">
  <h2 class="ProductGallery-headerTitle">…</h2>
  <button class="ProductGallery-headerClose">×</button>
  <span class="ProductGallery-headerCount">3/12</span>
</div>

<!-- Après : Bloc autonome -->
<div class="ProductGalleryHeader">
  <h2 class="ProductGalleryHeader-title">…</h2>
  <button class="ProductGalleryHeader-close">×</button>
  <span class="ProductGalleryHeader-count">3/12</span>
</div>
```

---

## 8. Animations

- `@keyframes` : nommés par le **mouvement visuel** (`fadeIn`, `slideUp`, `scaleUp`)
- **Jamais** par le contexte métier (`productCardEnter` ❌)

```scss
.ProductCard { animation: slideUp 0.4s var(--ease-out); }
.Modal[open] { animation: fadeIn var(--duration-normal) var(--ease-out); }
.Modal[data-closing] { animation: fadeOut var(--duration-fast) var(--ease-in); }
```

---

## 9. Composants tiers

```html
<!-- Encapsuler dans un Bloc ROCS wrapper -->
<div class="HeroSlider">
  <!-- Markup interne du plugin, classes tiers non modifiées -->
  <div class="swiper">…</div>
</div>
```

```css
/* Sélecteurs tiers ancrés sur le wrapper, max 2 niveaux */
.HeroSlider .swiper-button-prev { color: var(--color-primary); }
.HeroSlider .swiper-pagination-bullet { background: white; }
```

---

## 10. Décision rapide

```
Je dois nommer un élément HTML
  ↓
Quel est son rôle fonctionnel ? (ce qu'il fait pour l'utilisateur)
  ↓
Est-il une unité sémantique autonome ?
  ├── OUI → Bloc PascalCase  → ProductCard, CheckoutSummary
  └── NON → Élément Bloc-camelCase → ProductCard-title, CheckoutSummary-total

Son style doit varier ?
  ├── Selon l'état courant (JS change la valeur) → data-state="..." + CSS
  ├── Selon un variant sémantique (type métier)  → Nouvelle classe ROCS
  └── Selon un param layout (nb colonnes, etc.)  → data-* + :where() en CSS
```

---

## Outils

```bash
# Lint CSS/SCSS
npx stylelint '**/*.{css,scss}'

# Lint JSX/TSX
npx eslint '**/*.{jsx,tsx}'

# Validation ROCS complète
node tools/rocs-validate.js --dir ./src

# Compiler les exemples
npm run compile:examples
```

---

*Pour approfondir : [SPECIFICATION.md](./SPECIFICATION.md) · [GLOSSARY.md](./GLOSSARY.md) · [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)*
