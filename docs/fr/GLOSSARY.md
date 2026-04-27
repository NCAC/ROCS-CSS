# Glossaire ROCS

**Version 1.0** · [Spécification](./SPECIFICATION.md)

> Définitions des termes utilisés dans la spécification et la documentation ROCS. Les définitions marquées *(normatif)* ont une valeur contraignante ; les autres sont *(informatives)*.

---

## A

### Auto-suffisance *(normatif)*
Propriété d'une classe ROCS : ses styles **ne dépendent d'aucun contexte parent implicite**. Chaque classe est stylée de façon indépendante dans le CSS.

```css
/* ✅ Auto-suffisant */
.ProductCard-title { font-size: 1.5rem; }

/* ❌ Dépendant d'un parent (interdit ROCS §6.2.1) */
.ProductCard .ProductCard-title { font-size: 1.5rem; }
```

---

## B

### Bloc *(normatif)*
Classe ROCS de **niveau 1** (sans tiret) qui représente une **unité sémantique autonome** : un contexte métier, une fonctionnalité, un module de contenu.

**Pattern** : `^[A-Z][a-zA-Z0-9]*$` (PascalCase, max 4 segments)

**Exemples** : `ProductCard`, `BestSellersBooks`, `CookiesConsentModal`, `CheckoutSummary`

**Ce qu'un Bloc n'est pas** :
- Un composant générique de design system (`Button`, `Modal`, `Card`, `Input`) → ce sont des mécanismes réutilisables, pas des contextes applicatifs
- Un élément purement de layout sans rôle métier

Voir également : [Élément](#élément), [Promotion](#promotion)

---

## C

### Cascade CSS *(informatif)*
Mécanisme CSS de résolution des conflits de style. ROCS vise à **maîtriser** la cascade via une spécificité faible et homogène (classes simples, pas d'`id`, pas de `!important`).

### Classe ROCS *(normatif)*
Classe CSS qui respecte les contraintes de syntaxe, de sémantique et de profondeur définies en §0.3.1 de la spécification. Une classe ROCS exprime un **rôle ou un contexte**, jamais un style visuel.

**Types** : [Bloc](#bloc), [Élément](#élément)

### Classe d'état *(normatif)*
Classe CSS encodant un état dynamique (exemple : `is-active`, `has-error`, `--open`). **Interdites en ROCS** (§3.5). Remplacées par des attributs natifs, ARIA ou `data-*` dynamiques.

### Classes utilitaires *(informatif)*
Classes CSS mono-propriété ou de composition visuelle (ex: `.flex`, `.p-4`, `.text-blue`). **Interdites dans le HTML contrôlé ROCS** (§2.3). La composition se fait dans le CSS via mixins/placeholders.

### Composition de styles *(normatif)*
Technique consistant à appliquer plusieurs règles visuelles à un élément. En ROCS, la composition se fait **exclusivement dans le CSS** (mixins Sass, `@extend`, custom properties) et **jamais** dans l'attribut `class` du HTML.

### Contexte *(normatif)*
Périmètre sémantique dans lequel un rôle existe. Correspond au [Bloc](#bloc) auquel un [Élément](#élément) appartient.

> Exemple : `BestSellersBooks-title` — le contexte est `BestSellersBooks`, le rôle est `title`.

### Contexte persistant (statique) *(normatif)*
Information qui caractérise un contenu/objet de façon permanente (type métier, catégorie sémantique) et dont la valeur **ne varie pas** au cours du cycle de vie d'une page. **Doit être exprimée par une classe ROCS**, jamais par un `data-*`.

Voir aussi : [État/paramètre dynamique](#étatparamètre-dynamique)

---

## D

### `data-*` *(normatif)*
Attribut HTML libre réservé, dans ROCS, à trois usages :
1. **États/paramètres dynamiques** pilotés par JavaScript
2. **Métadonnées contextuelles** (paramètres de layout/configuration)
3. **Hooks JS stables** (analytics, tests) — ne doivent pas être ciblés en CSS

**Interdit** : encoder un [contexte persistant](#contexte-persistant-statique) ou un [variant sémantique](#variant-sémantique).

### Design system (DS) *(informatif)*
Bibliothèque de composants UI génériques et réutilisables (`Button`, `Input`, `Modal`, `Card`…). En ROCS, les classes DS ne sont **pas** des classes ROCS applicatives. Les styles DS sont intégrés via composition CSS (mixins), jamais via des classes HTML.

---

## E

### Élément *(normatif)*
Classe ROCS de **niveau 2** (format `Bloc-element`) qui représente un **rôle local** à l'intérieur d'un Bloc.

**Pattern** : `^[A-Z][a-zA-Z0-9]*-(?:[a-z]+[0-9]*)(?:[A-Z][a-z]+[0-9]*){0,2}$`

**Profondeur max** : 3 segments camelCase après le tiret

**Exemples** : `ProductCard-title`, `CookiesConsentModal-closeButton`, `ProductCard-headerBadge`

**Important** : le nom exprime le rôle sémantique, pas la position dans l'arbre DOM.

Voir également : [Bloc](#bloc), [Promotion](#promotion)

### État/paramètre dynamique *(normatif)*
Information stockée dans le DOM sous forme d'attribut `data-*` dont la valeur **peut varier** au cours du cycle de vie d'une page et **est effectivement modifiée par JavaScript**.

**Exemples** : `data-state="open"`, `data-active-tab="2"`, `data-gallery-index="0"`

Voir aussi : [Contexte persistant](#contexte-persistant-statique)

---

## H

### HTML contrôlé *(normatif)*
HTML produit et maintenu par l'équipe de développement (par opposition aux classes imposées par un framework ou un composant tiers). Seul le HTML contrôlé est soumis aux règles ROCS.

---

## I

### `id` *(normatif)*
Attribut HTML réservé, dans ROCS, au **ciblage JavaScript** et aux **ancres/navigation**. Les `id` **ne doivent jamais** apparaître dans les sélecteurs CSS (§5).

---

## M

### Métadonnée contextuelle *(normatif)*
Information caractérisant une **configuration ou un paramètre de layout** (nombre d'éléments, orientation, colonnes, type de device) sans définir le rôle sémantique de l'élément. Persistante mais non sémantique.

Trois critères pour qu'un `data-*` soit une métadonnée contextuelle (§4.2) :
1. N'encode pas un variant/catégorie sémantique
2. N'encode pas un style design system
3. Une classe ROCS distincte par valeur serait déraisonnable

**Exemples** : `data-columns="3"`, `data-articles-length="6"`, `data-device-type="mobile"`

**Usage CSS** : sélecteurs combinés autorisés avec `:where()` obligatoire.

### Métadonnée contextuelle globale *(normatif)*
Métadonnée contextuelle portée par `body`, `html` ou `:root`. Caractérise l'environnement technique de la page entière (viewport, thème, capacités navigateur).

**Exemples** : `data-theme="dark"` (sur `body`, modifiable côté client), `data-device-type="mobile"`

### Modifier BEM *(informatif)*
Suffixe `--modifier` de la méthodologie BEM permettant de créer des variantes visuelles. Concept **absent en ROCS** : remplacé par des classes ROCS distinctes (variants sémantiques) ou des `data-*` dynamiques (états/variants visuels).

---

## P

### PascalCase *(normatif)*
Convention de nommage où chaque mot commence par une majuscule, sans séparateur : `ProductCard`, `BestSellersBooks`, `CookiesConsentModal`.

Convention obligatoire pour les **Blocs ROCS**.

### Périmètre d'application *(normatif)*
ROCS s'applique au HTML **contrôlé** par l'équipe. Les composants tiers, les classes de framework et les classes techniques sont **hors périmètre** mais peuvent coexister avec une classe ROCS.

### Profondeur *(normatif)*
Nombre de segments composant un nom de Bloc (en PascalCase) ou un nom d'Élément (en camelCase).

| Type | Max | Exemple (conforme) |
|------|-----|--------------------|
| Bloc | 4 segments | `ProductCheckoutSummary` (3) |
| Élément | 3 segments | `closeButton` (2), `headerTitleBadge` (3) |

### Promotion *(normatif)*
Transformation d'un [Élément](#élément) en [Bloc](#bloc) autonome, recommandée quand l'Élément dépasse ~3 descendants stylés, est réutilisé dans plusieurs Blocs, ou porte une logique autonome.

```html
<!-- Avant promotion -->
<div class="ProductGallery-header">
  <h2 class="ProductGallery-headerTitle">…</h2>
</div>

<!-- Après promotion -->
<div class="ProductGalleryHeader">
  <h2 class="ProductGalleryHeader-title">…</h2>
</div>
```

---

## R

### Rôle *(normatif)*
Signification fonctionnelle d'un élément dans le document — **ce qu'il est / à quoi il sert** — indépendamment du style. C'est ce que le nom d'une classe ROCS doit exprimer.

> Exemple : "titre de la strate Meilleures ventes" → `BestSellersBooks-title`

---

## S

### Sélecteur auto-suffisant *(normatif)*
Voir [Auto-suffisance](#auto-suffisance-normatif).

### Spécificité *(normatif)*
Poids d'un sélecteur CSS. ROCS recommande une **spécificité faible et homogène** (0,1,0 pour les classes, 0,2,0 maximum pour les sélecteurs combinés autorisés) afin de garantir la prévisibilité de la cascade.

### SSR (Server-Side Rendering) *(informatif)*
Rendu HTML côté serveur. ROCS est particulièrement adapté aux architectures SSR car le HTML est l'artefact stable. Les `data-*` initialisés côté serveur mais modifiés par le client restent conformes (état dynamique).

---

## V

### Variant sémantique *(normatif)*
Variation qui **change la nature sémantique** d'un élément (son rôle, sa catégorie métier). Un variant sémantique **doit être exprimé par une classe ROCS distincte**, jamais par un `data-*`.

**Test** : *"L'information change-t-elle ce qu'est l'élément ?"*
- `ProductCard` livre vs DVD → variants sémantiques → `ProductCardBook`, `ProductCardDvd` ✅
- `ProductGrid` à 1, 2 ou 3 colonnes → paramètre de layout → `data-columns="3"` ✅

---

## W

### `:where()` *(normatif)*
Pseudo-classe CSS à spécificité nulle. **Obligatoire** dans ROCS pour les sélecteurs combinés autorisés (métadonnées contextuelles, contexte global), afin de préserver l'auto-suffisance du Bloc ciblé.

```css
/* ✅ :where() obligatoire */
.ProductGrid-list[data-columns="3"] :where(.ProductGrid-item) { width: 33%; }

/* ❌ Sans :where() : spécificité trop haute */
.ProductGrid-list[data-columns="3"] .ProductGrid-item { width: 33%; }
```

---

*Dernière mise à jour : version 1.0*
