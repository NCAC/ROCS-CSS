# ProductCard Component

Exemple de carte produit e-commerce suivant la méthodologie ROCS.

## Démonstration

Ouvrir `index.html` dans un navigateur.

## Caractéristiques ROCS

### ✅ 1 classe par élément

```html
<article class="ProductCard" data-featured>
  <h3 class="ProductCard-title">Titre</h3>
</article>
```

### ✅ Sous-éléments en camelCase

```html
<div class="ProductCard-header">
  <span class="ProductCard-headerBadge">Nouveau</span>
  <button class="ProductCard-headerFavorite">♥</button>
</div>
```

**Convention :**
- `ProductCard-header` = élément direct
- `ProductCard-headerBadge` = sous-élément (camelCase)

### ✅ Variantes via attributs

```html
<!-- Variante visuelle (attribut booléen) -->
<article class="ProductCard" data-featured>

<!-- État dynamique -->
<article class="ProductCard" data-state="expanded">
```

```scss
.ProductCard[data-featured] {
  border-color: var(--color-accent);
}

// §6.2.2 — :where() obligatoire pour sélecteur descendant
.ProductCard[data-state="expanded"] :where(.ProductCard-description) {
  max-height: none;
}
```

### ✅ Cascade limitée aux états du Bloc

```scss
// ✅ Autorisé : état du Bloc affecte ses éléments (§6.2.2 — :where() obligatoire)
.ProductCard[data-state="expanded"] :where(.ProductCard-features) {
  display: block;
}

// ❌ Interdit : cascade entre blocs
.Sidebar .ProductCard { ... }
```

### ✅ Helpers = mixins uniquement

```scss
// Pas de classe .flex-between dans le HTML
.ProductCard-footer {
  @include flex-between;
}
```

## Compilation

```bash
# Avec Sass
sass styles.scss styles.css

# Avec watch
sass --watch styles.scss:styles.css
```

## Structure

```
ProductCard/
├── index.html       # Markup ROCS
├── styles.scss      # Styles avec mixins
├── styles.css       # Compilé (généré)
└── README.md        # Cette doc
```
