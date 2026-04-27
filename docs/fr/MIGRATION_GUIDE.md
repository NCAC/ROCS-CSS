# Guide de migration vers ROCS

**Version 1.0** · [Spécification](./SPECIFICATION.md) · [Aide-mémoire](./CHEATSHEET.md)

> Ce guide accompagne les équipes qui migrent un projet existant (BEM, OOCSS, Tailwind, nommage maison) vers ROCS. Il est **informatif** : les règles normatives sont dans `SPECIFICATION.md`.

---

## Table des matières

1. [Principes de migration](#1-principes-de-migration)
2. [Depuis BEM](#2-depuis-bem)
3. [Depuis OOCSS / classes utilitaires](#3-depuis-oocss--classes-utilitaires)
4. [Depuis Tailwind CSS](#4-depuis-tailwind-css)
5. [Depuis un nommage maison](#5-depuis-un-nommage-maison)
6. [Migration progressive](#6-migration-progressive)
7. [Checklist de migration](#7-checklist-de-migration)

---

## 1. Principes de migration

### Ce qui change fondamentalement
| Concept | Avant (BEM/OOCSS) | Après (ROCS) |
|---------|-------------------|-------------|
| Composition visuelle | Dans les classes HTML | Dans le CSS (mixins/placeholders) |
| États | `--modifier`, `is-active` | `data-*` dynamiques / ARIA |
| Variants | Classes multiples par élément | Classe ROCS unique + CSS contextuel |
| Réutilisation | Partager les classes dans le HTML | Partager les mixins dans le CSS |
| Sélecteurs | Enchaînés (`.Block .Element`) | Auto-suffisants (`.Block-element`) |

### Ce qui ne change pas
- La structure HTML sémantique (balises, ARIA, `id` pour ancres)
- Les custom properties CSS
- Les mécanismes CSS (media queries, @container, transitions)
- L'organisation des fichiers

### Règle d'or de la migration
> **Demandez toujours : "Quel est le rôle fonctionnel de cet élément ?"**
> Pas son apparence, pas sa position dans le DOM — son *rôle pour l'utilisateur*.

---

## 2. Depuis BEM

### 2.1 Correspondance Block / Element / Modifier

| BEM | ROCS | Notes |
|-----|------|-------|
| `.block` | `Bloc` (PascalCase) | Renommer en PascalCase |
| `.block__element` | `Bloc-element` (camelCase) | `__` → `-`, camelCase |
| `.block--modifier` | Supprimé du HTML | Déplacer la logique en CSS |
| `.block--modifier` (état) | `data-state="..."` | Piloté par JS |
| `.block--modifier` (variant) | Classe ROCS distincte OU `data-*` contextuel | Voir ci-dessous |

### 2.2 Migration pas-à-pas

#### Étape 1 : Renommer les Blocs
```html
<!-- BEM -->
<article class="product-card">…</article>

<!-- ROCS -->
<article class="ProductCard">…</article>
```

#### Étape 2 : Renommer les Éléments
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

#### Étape 3 : Traiter les modifiers

**Modifier de variant sémantique → Classe ROCS distincte** (le variant change le *sens*) :
```html
<!-- BEM : variant par modifier -->
<article class="product-card product-card--book">…</article>
<article class="product-card product-card--dvd">…</article>

<!-- ROCS : classe distincte par variant sémantique -->
<article class="ProductCardBook">…</article>
<article class="ProductCardDvd">…</article>
```

**Modifier de présentation → Composition dans le CSS** (le variant change l'*apparence*) :
```html
<!-- BEM : modifier de style dans le HTML -->
<button class="product-card__cta product-card__cta--primary product-card__cta--large">
  Ajouter
</button>

<!-- ROCS : 1 classe, composition dans le CSS -->
<button class="ProductCard-cta">Ajouter</button>
```
```scss
// CSS ROCS : composition dans le SCSS
.ProductCard-cta {
  @include btn_primary();
  @include btn_large();
}
```

**Modifier d'état → `data-*` dynamique ou attribut ARIA** :
```html
<!-- BEM : modifier d'état dans le HTML -->
<nav class="site-navigation site-navigation--open">…</nav>
<button class="accordion__trigger accordion__trigger--active">…</button>
<input class="form__input form__input--error">

<!-- ROCS : attributs natifs / data-* -->
<nav class="SiteNavigation" data-state="open">…</nav>
<button class="AccordionSection-trigger" aria-expanded="true">…</button>
<input class="LoginForm-input" aria-invalid="true">
```
```css
/* ROCS CSS */
.SiteNavigation[data-state="open"] { /* styles ouvert */ }
.AccordionSection-trigger[aria-expanded="true"] { /* styles actif */ }
.LoginForm-input[aria-invalid="true"] { /* styles erreur */ }
```

### 2.3 Cas des "helper classes" BEM mixins
```html
<!-- BEM : mixin (1 classe d'un autre bloc) -->
<div class="product-card__footer text text--small">…</div>

<!-- ROCS : 1 classe, composition CSS -->
<div class="ProductCard-footer">…</div>
```
```scss
.ProductCard-footer {
  @include text_small(); // le mixin vient du design system
}
```

### 2.4 Migration des sélecteurs CSS

```scss
// ❌ BEM : sélecteurs enchaînés
.product-card { … }
.product-card__title { … }
.product-card .product-card__title { … } // dépendance contextuelle

// ✅ ROCS : auto-suffisants
.ProductCard { … }
.ProductCard-title { … }
// Pas besoin de sélecteur descendant
```

```scss
// ❌ BEM : modifier dans les sélecteurs
.product-card--featured .product-card__title { font-size: 2rem; }

// ✅ ROCS : data-* + :where()
.ProductCard[data-variant="featured"] .ProductCard-title { … } // ❌ encore BEM
// Ou, si "featured" est un variant sémantique :
.ProductCardFeatured-title { font-size: 2rem; } // ✅ ROCS
// Ou, si c'est un état dynamique :
.ProductCard[data-variant="featured"] :where(.ProductCard-title) { … } // ✅ avec :where()
```

---

## 3. Depuis OOCSS / classes utilitaires

### 3.1 Le problème : composition dans le HTML

```html
<!-- OOCSS / Atomic CSS : composition dans l'attribut class -->
<article class="card card--large shadow-md rounded-lg p-6 flex flex-col gap-4">
  <h3 class="text-xl font-bold text-gray-900 mb-2">Titre</h3>
  <button class="btn btn-primary btn-cta rounded-full px-8 py-3 font-bold">
    Ajouter
  </button>
</article>
```

**Problèmes** :
- Refonte graphique → modification de chaque élément HTML
- Lisibilité nulle dans le code source
- Couplage fort entre HTML et CSS

### 3.2 La solution ROCS : déplacer dans le CSS

```html
<!-- ROCS : HTML stable, descriptif -->
<article class="ProductCard">
  <h3 class="ProductCard-title">Titre</h3>
  <button class="ProductCard-cta">Ajouter</button>
</article>
```

```scss
// CSS ROCS : toute la composition ici
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

## 4. Depuis Tailwind CSS

### 4.1 Stratégie de migration

Tailwind et ROCS ont des philosophies opposées sur **où** se fait la composition. La migration implique de :

1. **Identifier les composants** sémantiques (les blocs de contenu récurrents)
2. **Extraire** les classes Tailwind dans du SCSS nommé ROCS
3. **Réduire** l'attribut `class` à une seule classe ROCS
4. **Conserver** Tailwind uniquement si imposé par un framework (hors périmètre ROCS)

### 4.2 Migration exemple

```html
<!-- Tailwind -->
<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white">
  <img class="w-full h-48 object-cover" src="…" alt="…">
  <div class="px-6 py-4">
    <h3 class="font-bold text-xl mb-2 text-gray-900">Titre</h3>
    <p class="text-gray-700 text-base">Description</p>
  </div>
  <div class="px-6 pt-4 pb-2 flex gap-2">
    <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm">Tag 1</span>
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Voir le produit
    </button>
  </div>
</div>
```

```html
<!-- ROCS -->
<article class="ProductCard">
  <img class="ProductCard-media" src="…" alt="…">
  <div class="ProductCard-body">
    <h3 class="ProductCard-title">Titre</h3>
    <p class="ProductCard-description">Description</p>
  </div>
  <div class="ProductCard-footer">
    <span class="ProductCard-tag">Tag 1</span>
    <button class="ProductCard-cta">Voir le produit</button>
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

### 4.3 Coexistence temporaire

Durant la migration, Tailwind et ROCS peuvent coexister :

```html
<!-- ✅ Acceptable en transition : 1 classe ROCS + classes Tailwind imposées par le framework -->
<!-- Les classes Tailwind sont "hors périmètre ROCS" si imposées par l'outil -->
<div class="ProductCard tw-flex tw-flex-col">…</div>
```

> **Important** : les classes de composition Tailwind ne doivent jamais être les seuls hooks de style (pas de ciblage Tailwind dans le CSS ROCS). Le but est d'arriver à une classe ROCS unique par élément.

---

## 5. Depuis un nommage maison

### 5.1 Patterns courants et leur équivalent ROCS

| Pattern maison | Problème | ROCS |
|---------------|----------|------|
| `.section-product-title` | kebab-case, hiérarchie DOM | `ProductSection-title` |
| `.js-open-modal` | hook JS dans une classe stylistique | `data-action="open-modal"` (pur JS) |
| `.product.featured` | multi-classes pour variant | `FeaturedProduct` ou `ProductCard[data-variant="featured"]` |
| `.widget_header` | snake_case interdit | `Widget-header` |
| `.btn-red` | style dans le nom | `CheckoutForm-submitButton` (rôle) + CSS rouge |
| `.container`, `.wrapper` | générique sans rôle | Soit 0 classe (div sans rôle applicatif), soit `ProductCard-body` |

---

## 6. Migration progressive

### Stratégie recommandée

Ne migrez pas tout d'un coup. Adoptez une approche **"au fil de l'eau"** :

1. **Établir les conventions** d'équipe (lire la spec, faire un atelier de nommage)
2. **Configurer les outils** (Stylelint, ESLint, CI)
3. **Migrer les nouveaux composants** en ROCS dès le départ
4. **Migrer les composants existants** lors des refontes ou correctifs
5. **Audit périodique** via `node tools/rocs-validate.js --dir ./src`

### Isoler les fichiers en cours de migration

Utilisez les exclusions Stylelint pour les fichiers non encore migrés :

```json
// .stylelintrc.json - exclusion temporaire
{
  "extends": ["stylelint-config-standard-scss"],
  "ignoreFiles": [
    "src/legacy/**/*.scss",
    "src/components/old/**/*.scss"
  ]
}
```

### Marquer les classes "en cours de migration"

```html
<!-- Commentaire temporaire pour les classes legacy non encore migrées -->
<!-- TODO ROCS: migrer product-card vers ProductCard -->
<article class="product-card">…</article>
```

---

## 7. Checklist de migration

### Nommage
- [ ] Tous les Blocs sont en PascalCase (≤ 4 segments)
- [ ] Tous les Éléments suivent le pattern `Bloc-camelCase` (≤ 3 segments)
- [ ] Aucun modifier BEM (`--modifier`) dans le HTML
- [ ] Aucune classe d'état (`is-*`, `has-*`) dans le HTML
- [ ] Aucun snake_case ni kebab-case pour les classes ROCS

### États et interactions
- [ ] Les états dynamiques utilisent `data-state`, `data-*` ou attributs ARIA
- [ ] Les attributs `data-*` stylistiques sont effectivement modifiés par JS
- [ ] Les variants sémantiques statiques sont des classes ROCS distinctes

### CSS
- [ ] Aucun sélecteur `#id` dans le CSS
- [ ] Aucun sélecteur descendant ROCS (`.Bloc .Element`)
- [ ] Les métadonnées contextuelles en CSS utilisent `:where()`
- [ ] Les tiers sont encapsulés dans un Bloc wrapper (max 2 niveaux)
- [ ] `!important` absent ou justifié

### HTML
- [ ] Chaque élément porte 0 ou 1 classe ROCS
- [ ] Aucune classe utilitaire de composition dans le HTML contrôlé
- [ ] Les classes framework/tiers sont identifiables (préfixe dédié)

### Outillage
- [ ] Stylelint configuré et intégré en CI
- [ ] ESLint configuré pour JSX/HTML
- [ ] `node tools/rocs-validate.js` passe sans erreur
- [ ] GitHub Actions configuré

---

*Pour les cas complexes, consultez l'[Annexe B (FAQ)](./SPECIFICATION.md#annexe-b-cas-pratiques-faq) de la spécification.*
